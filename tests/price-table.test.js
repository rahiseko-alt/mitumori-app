const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");

const Catalog = require("../catalog.js");
const { buildPriceTable, TARGET } = require("../scripts/build-price-table.js");

test("配る価格表が catalog.js とずれていない", () => {
  const onDisk = fs.readFileSync(TARGET, "utf8");
  assert.equal(onDisk, buildPriceTable(),
    "単価を変えたら node scripts/build-price-table.js を実行すること");
});

test("価格表に96項目すべてが載っている", () => {
  const table = fs.readFileSync(TARGET, "utf8");
  const missing = Catalog.features.filter((f) => !table.includes("| " + f.name + " |"));
  assert.deepEqual(missing.map((f) => f.id), []);
});

test("価格表の単価が千円単位で割り切れている", () => {
  const odd = Catalog.features.filter((f) => Number(f.fixedPrice || 0) % 1000 !== 0);
  assert.deepEqual(odd.map((f) => f.id), [], "千円表示で端数が出る単価がある");
});
