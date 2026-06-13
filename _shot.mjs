import { chromium } from 'playwright';
const base=process.cwd()+'/projects/ofm/2026-06-09_beacons-shadowban/hyperframes';
const out='/sessions/determined-lucid-gauss/mnt/outputs';
const b=await chromium.launch();
for (const [scene,prog] of [['s20',0.55],['s27',0.95]]) {
  const p=await b.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+base+'/'+scene+'/index.html',{waitUntil:'load',timeout:30000});
  await p.waitForTimeout(1500);
  const hasGsap=await p.evaluate(()=>!!(window.__timelines&&window.__timelines.main));
  if(hasGsap){ await p.evaluate(pr=>window.__timelines.main.progress(pr),prog); }
  await p.waitForTimeout(400);
  await p.screenshot({path:out+'/preview_'+scene+'.png'});
  console.log(scene+' : gsap='+hasGsap);
  await p.close();
}
await b.close();
console.log('done');
