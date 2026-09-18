const test = require("node:test");
const assert = require("node:assert");

const Catalog = require("../catalog.js");
const Interview = require("../interview.js");
const Range = require("../range.js");

test("何も決まっていないとき、下限は必ず入る項目だけの額になる", () => {
  const r = Range.computeRange({});
  assert.equal(r.floor, Range.total({}));
  assert.ok(r.floor > 0);
  assert.ok(r.ceiling > r.floor);
  assert.equal(r.floor % 5000, 0);
  assert.equal(r.ceiling % 5000, 0);
});

test("論点を決めると、上限が下がり下限が上がる", () => {
  const before = Range.computeRange({});
  const after = Range.computeRange({ scope: ["role"] });
  assert.ok(after.floor > before.floor, "下限が上がる");
  assert.ok(after.ceiling < before.ceiling, "上限が下がる");
  assert.ok(after.band < before.band, "幅が縮む");
});

test("いちばん高い選び方で確定しても、上限は上がらない", () => {
  const before = Range.computeRange({});
  const after = Range.computeRange({ scope: ["role", "tenant"] });
  assert.ok(after.ceiling <= before.ceiling, "確定で上限が上がってはいけない");
  assert.ok(after.floor > before.floor);
});

test("確定した額は、決める前の幅の内側にある", () => {
  const before = Range.computeRange({});
  for (const value of ["role", "tenant", "no"]) {
    const settled = Range.total({ scope: [value] });
    assert.ok(settled >= before.floor && settled <= before.ceiling,
      value + " の確定額が幅の外に出た");
  }
});

test("論点をすべて決めると幅がゼロになる", () => {
  let answers = {};
  for (let round = 0; round < 8; round += 1) {
    const open = Interview.visibleQuestions(answers).filter((q) => answers[q.id] === undefined);
    if (!open.length) break;
    open.forEach((q) => { answers[q.id] = Range.extremeAnswer(q, "dear"); });
  }
  const r = Range.computeRange(answers);
  assert.equal(r.open.length, 0, "未決が残っている");
  assert.equal(r.band, 0, "未決がないのに幅が残っている");
  assert.equal(r.floor, r.ceiling);
});

test("未決の論点は幅の大きい順に並び、幅ゼロの論点を含まない", () => {
  const r = Range.computeRange({});
  const bands = r.open.map((p) => p.band);
  assert.deepEqual(bands, bands.slice().sort((a, b) => b - a));
  assert.ok(bands.every((b) => b > 0));
  assert.equal(r.open[0].id, "business", "いちばん金額が動く論点から聞く");
});

test("幅を足し算すると二重に数える（だから組み直す）", () => {
  const r = Range.computeRange({});
  const summed = r.open.reduce((sum, p) => sum + p.band, 0);
  assert.ok(summed > r.band,
    "論点ごとの幅の合計が、まるごと組み直した幅と同じになっている。共有する土台を数え損ねている可能性がある");
});

test("聞き取りで論点が埋まるほど、幅は単調に縮む", () => {
  const steps = [
    {},
    { who: ["partner"] },
    { who: ["partner"], login: ["email"] },
    { who: ["partner"], login: ["email"], business: ["none"] },
    { who: ["partner"], login: ["email"], business: ["none"], screens: ["dashboard"] },
  ];
  const bands = steps.map((answers) => Range.computeRange(answers).band);
  for (let i = 1; i < bands.length; i += 1) {
    assert.ok(bands[i] <= bands[i - 1],
      "論点を決めたのに幅が広がった: " + bands[i - 1] + " -> " + bands[i]);
  }
  assert.ok(bands[bands.length - 1] < bands[0]);
});

test("金額はすべて5,000円単位に揃う", () => {
  const r = Range.computeRange({ who: ["partner"], files: ["camera"] });
  assert.equal(r.floor % 5000, 0);
  assert.equal(r.ceiling % 5000, 0);
  r.open.forEach((p) => assert.equal(p.band % 5000, 0, p.id + " の幅が5,000円単位でない"));
});

test("カタログの必須項目が、下限に必ず入っている", () => {
  const r = Range.computeRange({});
  assert.ok(Catalog.mandatoryFeatureIds.length > 0);
  const onlyMandatory = Catalog.features
    .filter((f) => Catalog.mandatoryFeatureIds.includes(f.id))
    .reduce((sum, f) => sum + Number(f.fixedPrice || 0), 0);
  assert.ok(r.floor >= onlyMandatory, "下限が必須項目の合計を下回っている");
});
