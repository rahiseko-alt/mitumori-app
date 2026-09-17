const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");

const { buildProjectInstructions, TARGET } = require("../scripts/build-project-instructions.js");

test("営業へ貼る指示が SKILL.md とずれていない", () => {
  assert.equal(fs.readFileSync(TARGET, "utf8"), buildProjectInstructions(),
    "手順を変えたら node scripts/build-project-instructions.js を実行すること");
});

test("貼る指示が、添付する2ファイルを名指ししている", () => {
  const text = fs.readFileSync(TARGET, "utf8");
  assert.ok(text.includes("price-table.md"), "単価表の名前がない");
  assert.ok(text.includes("open-points.md"), "論点表の名前がない");
  assert.ok(!text.startsWith("---"), "frontmatter が残っている");
});

test("貼る指示に、合計を暗算するなという歯止めが入っている", () => {
  const text = fs.readFileSync(TARGET, "utf8");
  assert.ok(text.includes("一覧にしてから足す"), "合計の出し方の歯止めがない");
  assert.ok(text.includes("ここにない金額を作ってはならない"), "価格表の外を禁じる一文がない");
});
