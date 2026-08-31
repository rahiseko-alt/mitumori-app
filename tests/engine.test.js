const test = require("node:test");
const assert = require("node:assert/strict");

const Engine = require("../engine.js");
const Catalog = require("../catalog.js");

const zero = () => Object.fromEntries(Engine.ROLES.map((role) => [role, 0]));
const feature = (id, dependencies = [], role = "frontend", hours = 1) => ({
  id,
  name: id,
  layer: "test",
  description: "test",
  dependencies,
  hours: { ...zero(), [role]: hours },
});

test("実カタログは参照切れや循環を含まない", () => {
  assert.equal(Catalog.features.length, 96);
  assert.deepEqual(Engine.validateCatalog(Catalog.features), []);
  for (const item of Catalog.features) {
    assert.deepEqual(Engine.computeSelection(Catalog.features, [item.id]).cycles, []);
  }
});

test("機能を追加すると多段の依存項目が自動選択される", () => {
  const catalog = [feature("base"), feature("api", ["base"]), feature("screen", ["api"])];
  const result = Engine.computeSelection(catalog, ["screen"]);

  assert.deepEqual([...result.direct], ["screen"]);
  assert.deepEqual(new Set(result.automatic), new Set(["api", "base"]));
  assert.deepEqual(new Set(result.selected), new Set(["screen", "api", "base"]));
});

test("機能を外すと不要になった依存項目も消える", () => {
  const catalog = [feature("base"), feature("api", ["base"]), feature("screen", ["api"])];
  const impact = Engine.removalImpact(catalog, ["screen"], "screen");

  assert.deepEqual(new Set(impact.removed), new Set(["screen", "api", "base"]));
  assert.equal(impact.selection.selected.size, 0);
});

test("別機能から共有される依存項目は削除されない", () => {
  const catalog = [feature("base"), feature("screen-a", ["base"]), feature("screen-b", ["base"])];
  const impact = Engine.removalImpact(catalog, ["screen-a", "screen-b"], "screen-a");

  assert.deepEqual(impact.removed, ["screen-a"]);
  assert.deepEqual(new Set(impact.selection.selected), new Set(["screen-b", "base"]));
});

test("追加影響は新たに必要になる項目だけを返す", () => {
  const catalog = [feature("base"), feature("screen-a", ["base"]), feature("screen-b", ["base"])];
  const impact = Engine.additionImpact(catalog, ["screen-a"], "screen-b");

  assert.deepEqual(impact.added, ["screen-b"]);
});

test("担当別工数・原価・予備費を集計できる", () => {
  const catalog = [feature("front", [], "frontend", 10), feature("back", [], "backend", 5)];
  const rates = { ...zero(), frontend: 8_000, backend: 10_000 };
  const result = Engine.calculateEstimate(catalog, ["front", "back"], rates, 20);

  assert.equal(result.roleHours.frontend, 10);
  assert.equal(result.roleHours.backend, 5);
  assert.equal(result.baseHours, 15);
  assert.equal(result.baseCost, 130_000);
  assert.equal(result.contingencyCost, 26_000);
  assert.equal(result.totalCost, 156_000);
});

test("親枝・中間枝・末端の解除範囲を分けられる", () => {
  const all = ["A", "A-1", "A-2", "A-2-1", "A-2-2", "B"];

  assert.deepEqual(
    Engine.setBranchSelection(all, ["A", "A-1", "A-2", "A-2-1", "A-2-2"], false),
    new Set(["B"]),
  );
  assert.deepEqual(
    Engine.setBranchSelection(all, ["A-2", "A-2-1", "A-2-2"], false),
    new Set(["A", "A-1", "B"]),
  );
  assert.deepEqual(
    Engine.setBranchSelection(all, ["A-2-1"], false),
    new Set(["A", "A-1", "A-2", "A-2-2", "B"]),
  );
});

test("見積操作ツリーは96機能を重複なく網羅する", () => {
  const hierarchyIds = Catalog.featureHierarchy.flatMap((layer) => layer.groups.flatMap((group) => group.features));
  const catalogIds = Catalog.features.map((item) => item.id);

  assert.equal(new Set(hierarchyIds).size, hierarchyIds.length);
  assert.deepEqual(new Set(hierarchyIds), new Set(catalogIds));
});

test("非エンジニア向け項目名が全96機能に設定されている", () => {
  const technicalWords = /(フロントエンド|バックエンド|インフラ|API基盤|セッション|CI\/CD|PWA)/;

  assert.equal(Catalog.features.filter((item) => item.plainName).length, Catalog.features.length);
  assert.deepEqual(Catalog.features.filter((item) => technicalWords.test(item.plainName)), []);
});

test("中小規模システム会社向け7,000円の時間単価に固定されている", () => {
  assert.deepEqual(Object.keys(Catalog.rateProfiles), ["company"]);
  assert.deepEqual(new Set(Object.values(Catalog.rateProfiles.company.rates)), new Set([7000]));
});
