import { getChannel, getProfileDir, profileFile, getSubtitlesMode } from "./scripts/lib/profile.js";
import { existsSync } from "node:fs";
const p = "projects/answerdelta/_smoke";
console.log("channel      :", getChannel(p));
console.log("profileDir   :", getProfileDir(p));
console.log("subtitles    :", getSubtitlesMode(p));
for (const f of ["style.md","voice-config.json","thumbnail-playbook.md","render-config.json","hyperframes-tokens.css"]) {
  const r = profileFile(p, f);
  console.log(existsSync(r) ? "  OK   " : "  MANQUE", f, "->", r.includes("answerdelta") ? "profil answerdelta" : "FALLBACK GLOBAL");
}
console.log("channel-mark :", existsSync("references/profiles/answerdelta/channel-mark.png") ? "présent" : "ABSENT (à déposer)");
