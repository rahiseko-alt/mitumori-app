const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("自動保存は明示同意がない限り復元・保存しない", () => {
  assert.match(html, /id="auto-save"/);
  assert.match(app, /autoSave: false/);
  assert.match(app, /STORAGE_CONSENT_KEY/);
  assert.match(app, /state\.autoSave/);
});

test("参考概算は消費税別と画面・CSV・印刷で明示する", () => {
  assert.match(html, /機能単価合計（消費税別）/);
  assert.match(html, /正式見積ではありません/);
  assert.match(app, /参考概算・消費税別/);
  assert.match(app, /機能単価合計（消費税別）/);
});

test("固定単価マスタと仮0円を画面・CSVで区別する", () => {
  assert.match(html, /対応しない項目は仮0円/);
  assert.match(app, /priceStatus === "temporary"/);
  assert.match(app, /仮0円・要確認/);
  assert.doesNotMatch(html, /id="contingency"/);
});

test("上書き・クリア・未回答遷移に確認がある", () => {
  assert.match(app, /現在の案件.+置き換えますか/);
  assert.match(app, /ヒアリング回答だけをすべてクリアしますか/);
  assert.match(app, /未確認の質問が.*見積画面へ進みますか/);
});

test("ページナビと明細表に支援技術向け構造がある", () => {
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 2);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 2);
  assert.equal((html.match(/<caption class="sr-only">/g) || []).length, 2);
});
