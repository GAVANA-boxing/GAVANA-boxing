const { chromium } = require("playwright");
(async () => {
  const runs = JSON.parse(process.argv[2]);
  const b = await chromium.launch();
  for (const r of runs) {
    const p = await b.newPage();
    const q = new URLSearchParams(r).toString();
    await p.goto(`http://localhost:3100/mn/zz-eval?${q}`, { waitUntil: "load" });
    await p.waitForFunction(() => window.__RESULT, null, { timeout: 240000 });
    const res = await p.evaluate(() => window.__RESULT);
    if (res.error) { console.log(r, "ERROR", res.error); continue; }
    const counts = res.events.reduce((m, e) => ((m[`${e.type}/${e.hand}`] = (m[`${e.type}/${e.hand}`] || 0) + 1), m), {});
    console.log(`${r.src.split("/").pop()} model=${res.model} fps=${res.fps} stance=${res.stance} | body ${res.withBody}/${res.frames} armVis~${res.armVisMedian?.toFixed(2)} | punches ${res.events.length} ${JSON.stringify(counts)} | hint ${res.stanceHint}`);
    console.log("   ", res.events.map((e) => `${e.t}s ${e.type}(${e.hand[0]})`).join("  "));
    await p.close();
  }
  await b.close();
})();
