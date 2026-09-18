const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");

const Catalog = require("../catalog.js");
const Engine = require("../engine.js");
const Interview = require("../interview.js");
const { buildOpenPoints, TARGET } = require("../scripts/build-open-points.js");

function total(answers) {
  const direct = Interview.selectedFeatures(answers);
  const all = [...new Set([...direct, ...Catalog.mandatoryFeatureIds])];
  const selection = Engine.computeSelection(Catalog.features, all);
  const pricing = Engine.applyPricingRules(Catalog.features, selection);
  return Engine.calculateEstimate(pricing.features, selection.selected, Catalog.rateProfiles.company.rates, 0).totalCost;
}

test("配る論点表が interview.js とずれていない", () => {
  assert.equal(fs.readFileSync(TARGET, "utf8"), buildOpenPoints(),
    "論点や単価を変えたら node scripts/build-open-points.js を実行すること");
});

test("27の論点すべてに幅があり、幅ゼロの論点を載せていない", () => {
  const table = fs.readFileSync(TARGET, "utf8");
  const rows = table.split("\n").filter((line) => /^\| \d+ \| \w+（/.test(line));
  assert.equal(rows.length, Interview.questions.length);
  const zero = rows.filter((line) => /^\| 0 \|/.test(line));
  assert.deepEqual(zero, [], "幅が出ない論点は、聞いても金額が動かない");
});

test("下限は必ず入る項目を下回らない", () => {
  const base = total({});
  assert.equal(base % 5000, 0);
  const table = fs.readFileSync(TARGET, "utf8");
  assert.ok(table.includes("**" + Math.round(base / 1000) + "千円 〜 "),
    "何も決まっていないときの下限が、必須と設計の合計と一致していない");
});

test("論点が1つ決まると、上限が下がり下限が上がる", () => {
  // 「人によって見えるものを変えるか」を例にとる。未決なら 0〜265千円。
  // 「役割ごとに変える」で確定すると、上限も下限もその1点へ寄る。
  const base = total({});
  const cheapest = total({ scope: ["no"] });
  const dearest = total({ scope: ["role", "tenant"] });
  const settled = total({ scope: ["role"] });
  assert.ok(cheapest <= settled && settled <= dearest, "確定額が未決の幅の内側にある");
  assert.ok(settled > cheapest, "確定で下限が上がる");
  assert.ok(settled < dearest, "確定で上限が下がる");
  assert.equal(cheapest, base, "いちばん安い選び方は、必ず入る項目だけの額と同じ");
});
