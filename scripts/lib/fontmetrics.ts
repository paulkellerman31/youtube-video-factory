import { readFileSync } from "node:fs";

/**
 * Minimal TrueType metrics reader — zero dependencies, works on Windows.
 *
 * WHY THIS EXISTS: the locked thumbnail art direction (thumbnail-playbook §2) needs the
 * headline auto-fitted to a fixed 600px column, and ffmpeg CANNOT do that — `drawtext` has no
 * way to measure a string and shrink itself. So the measurement happens here, in Node, before
 * the filtergraph is composed.
 *
 * Reads only what's needed: head (unitsPerEm), hhea (ascender/descender/numberOfHMetrics),
 * hmtx (advance widths), OS/2 (sCapHeight) and cmap format 4 (unicode -> glyph id).
 * Everything is returned in em units (font-size-independent); multiply by fontSize for pixels.
 */
export interface FontMetrics {
  unitsPerEm: number;
  ascentEm: number;
  descentEm: number;
  capHeightEm: number;
  /** advance width in em for a unicode code point (falls back to the average) */
  advanceEm(codePoint: number): number;
}

interface Table { offset: number; length: number }

function readTables(buf: Buffer): Map<string, Table> {
  const tables = new Map<string, Table>();
  let base = 0;
  // ttcf (font collection): jump to the first font's offset table
  if (buf.readUInt32BE(0) === 0x74746366) base = buf.readUInt32BE(12);
  const numTables = buf.readUInt16BE(base + 4);
  for (let i = 0; i < numTables; i++) {
    const rec = base + 12 + i * 16;
    const tag = buf.toString("ascii", rec, rec + 4);
    tables.set(tag, { offset: buf.readUInt32BE(rec + 8), length: buf.readUInt32BE(rec + 12) });
  }
  return tables;
}

/** cmap format 4 (the BMP unicode subtable) -> Map<codePoint, glyphId>. */
function readCmap(buf: Buffer, cmapOff: number): Map<number, number> {
  const map = new Map<number, number>();
  const numSub = buf.readUInt16BE(cmapOff + 2);
  let best = -1;
  for (let i = 0; i < numSub; i++) {
    const rec = cmapOff + 4 + i * 8;
    const platform = buf.readUInt16BE(rec);
    const encoding = buf.readUInt16BE(rec + 2);
    const off = cmapOff + buf.readUInt32BE(rec + 4);
    // windows/unicode BMP subtables, in preference order
    if ((platform === 3 && (encoding === 1 || encoding === 10)) || platform === 0) best = off;
  }
  if (best < 0 || buf.readUInt16BE(best) !== 4) return map;

  const segCountX2 = buf.readUInt16BE(best + 6);
  const segCount = segCountX2 / 2;
  const endO = best + 14;
  const startO = endO + segCountX2 + 2;
  const deltaO = startO + segCountX2;
  const rangeO = deltaO + segCountX2;

  for (let s = 0; s < segCount; s++) {
    const end = buf.readUInt16BE(endO + s * 2);
    const start = buf.readUInt16BE(startO + s * 2);
    const delta = buf.readInt16BE(deltaO + s * 2);
    const rangeOffset = buf.readUInt16BE(rangeO + s * 2);
    if (start === 0xffff) continue;
    for (let c = start; c <= end && c !== 0x10000; c++) {
      let gid: number;
      if (rangeOffset === 0) gid = (c + delta) & 0xffff;
      else {
        const gi = rangeO + s * 2 + rangeOffset + (c - start) * 2;
        if (gi + 1 >= buf.length) continue;
        const g = buf.readUInt16BE(gi);
        gid = g === 0 ? 0 : (g + delta) & 0xffff;
      }
      if (gid) map.set(c, gid);
    }
  }
  return map;
}

/** yMax of a glyph's outline, in font units. 0 if unavailable (CFF font, missing tables…). */
function glyphYMax(buf: Buffer, t: Map<string, Table>, gid: number): number {
  const head = t.get("head");
  const loca = t.get("loca");
  const glyf = t.get("glyf");
  if (!head || !loca || !glyf || !gid) return 0;
  const longLoca = buf.readInt16BE(head.offset + 50) === 1; // indexToLocFormat
  try {
    const at = (i: number): number =>
      longLoca ? buf.readUInt32BE(loca.offset + i * 4) : buf.readUInt16BE(loca.offset + i * 2) * 2;
    const start = at(gid);
    if (at(gid + 1) === start) return 0; // empty glyph
    return buf.readInt16BE(glyf.offset + start + 8); // yMax field of the glyph header
  } catch {
    return 0;
  }
}

export function readFontMetrics(fontPath: string): FontMetrics {
  const buf = readFileSync(fontPath);
  const t = readTables(buf);
  const head = t.get("head");
  const hhea = t.get("hhea");
  const hmtx = t.get("hmtx");
  const cmap = t.get("cmap");
  if (!head || !hhea || !hmtx || !cmap) throw new Error(`fontmetrics: tables manquantes dans ${fontPath}`);

  const unitsPerEm = buf.readUInt16BE(head.offset + 18) || 1000;
  const ascent = buf.readInt16BE(hhea.offset + 4);
  const descent = buf.readInt16BE(hhea.offset + 6);
  const numberOfHMetrics = buf.readUInt16BE(hhea.offset + 34);

  const charMap = readCmap(buf, cmap.offset);

  // Cap height: measured from the 'H' outline (glyf yMax) rather than OS/2 sCapHeight.
  // OS/2 routinely under-reports it — Impact declares 0.727em where the glyph actually inks
  // 0.81em — and the thumbnail block is vertically centred on this value, so a 5% error is a
  // visibly off-centre headline. Falls back to OS/2, then to a ratio of the ascent.
  let capHeight = glyphYMax(buf, t, charMap.get(0x48) ?? 0);
  if (!capHeight) {
    const os2 = t.get("OS/2");
    if (os2 && buf.readUInt16BE(os2.offset) >= 2 && os2.length >= 90) capHeight = buf.readInt16BE(os2.offset + 88);
  }
  if (!capHeight) capHeight = Math.round(ascent * 0.72);
  const advanceOf = (gid: number): number => {
    const i = Math.min(gid, numberOfHMetrics - 1);
    const off = hmtx.offset + i * 4;
    if (off + 1 >= buf.length) return unitsPerEm / 2;
    return buf.readUInt16BE(off);
  };

  // Fallback for unmapped code points: the advance of 'X' (close to the caps average).
  const fallback = advanceOf(charMap.get(0x58) ?? 0) || unitsPerEm / 2;

  return {
    unitsPerEm,
    ascentEm: ascent / unitsPerEm,
    descentEm: Math.abs(descent) / unitsPerEm,
    capHeightEm: capHeight / unitsPerEm,
    advanceEm(cp: number): number {
      const gid = charMap.get(cp);
      return (gid ? advanceOf(gid) : fallback) / unitsPerEm;
    },
  };
}

/** Width of a string, in em. Multiply by fontSize for pixels. */
export function measureEm(m: FontMetrics, text: string): number {
  let w = 0;
  for (const ch of text) w += m.advanceEm(ch.codePointAt(0) ?? 0x20);
  return w;
}

/**
 * Largest size in [min, max] (stepping down by `step`) at which EVERY line fits `maxWidthPx`.
 * One shared size for all lines — two headlines at different sizes would break the series,
 * which is the whole point of a locked art direction.
 */
export function fitFontSize(
  m: FontMetrics,
  lines: string[],
  maxWidthPx: number,
  opts: { max: number; min: number; step: number },
): { size: number; overflow: boolean } {
  const widest = Math.max(...lines.map((l) => measureEm(m, l)), 0);
  if (widest === 0) return { size: opts.max, overflow: false };
  for (let size = opts.max; size >= opts.min; size -= opts.step) {
    if (widest * size <= maxWidthPx) return { size, overflow: false };
  }
  return { size: opts.min, overflow: true }; // caller must warn: the line needs rewriting
}
