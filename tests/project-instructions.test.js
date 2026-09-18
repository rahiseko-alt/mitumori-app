const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");

const { buildProjectInstructions, TARGET } = require("../scripts/build-project-instructions.js");

test("営業へ貼る指示が SKILL.md とずれていない", () => {
  assert.equal(fs.readFileSync(TARGET, "utf8"), buildProjectInstructions(),
    "手順を変えたら node scripts/build-project-instructions.js を実行すること");
});

test("貼る指示が、Drive から読む2ファイルを名指ししている", () => {
  const text = fs.readFileSync(TARGET, "utf8");
  assert.ok(text.includes("見積単価表"), "単価表の名前がない");
  assert.ok(text.includes("見積論点表"), "論点表の名前がない");
  assert.ok(text.includes("Google Drive を検索して"), "Drive から読む指示がない");
  assert.ok(!text.startsWith("---"), "frontmatter が残っている");
});

test("Drive を読めなかったら金額を出さずに止まると書いてある", () => {
  const text = fs.readFileSync(TARGET, "utf8");
  assert.ok(text.includes("読めなかったら、金額を一切出さない"), "読めないときの歯止めがない");
  assert.ok(text.includes("記憶や推測で単価を作ってはならない"), "推測で単価を作る余地が残っている");
});

test("読んだ版を営業に見せると書いてあり、日付がカタログと一致する", () => {
  const text = fs.readFileSync(TARGET, "utf8");
  const basis = (require("../catalog.js").priceMasterMeta || {}).createdAt;
  assert.ok(basis, "カタログに価格基準日がない");
  assert.ok(text.includes("価格基準日 " + basis),
    "指示文の価格基準日がカタログとずれている（build-project-instructions.js を実行すること）");
});

test("配る2つの表に、版が入っている", () => {
  const basis = (require("../catalog.js").priceMasterMeta || {}).createdAt;
  for (const name of ["見積単価表.md", "見積論点表.md"]) {
    const table = fs.readFileSync(
      require("path").join(__dirname, "..", ".claude", "skills", "mitsumori-flow", name), "utf8");
    assert.ok(table.includes("版：価格基準日 " + basis), name + " に版が入っていない");
  }
});

test("貼る指示に、合計を暗算するなという歯止めが入っている", () => {
  const text = fs.readFileSync(TARGET, "utf8");
  assert.ok(text.includes("一覧にしてから足す"), "合計の出し方の歯止めがない");
  assert.ok(text.includes("ここにない金額を作ってはならない"), "価格表の外を禁じる一文がない");
});
