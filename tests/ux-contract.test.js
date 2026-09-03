const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const catalog = fs.readFileSync(path.join(root, "catalog.js"), "utf8");

test("自動保存は明示同意がない限り復元・保存しない", () => {
  assert.match(html, /id="auto-save"/);
  assert.match(app, /autoSave: false/);
  assert.match(app, /STORAGE_CONSENT_KEY/);
  assert.match(app, /state\.autoSave/);
});

test("参考概算は消費税別と画面・CSV・印刷で明示する", () => {
  assert.match(html, /相対参考単価合計（消費税別）/);
  assert.match(html, /正式見積ではありません/);
  assert.match(app, /参考概算・消費税別/);
  assert.match(app, /相対参考単価合計（消費税別）/);
});

test("原本単価と査定単価を維持し、難易度指数と必須固定を示す", () => {
  assert.match(html, /非対応62項目は.+査定/);
  assert.match(html, /難易度指数（価格は変更しません）/);
  assert.match(html, /現在の固定単価、原本単価、査定単価のいずれも変更しません/);
  assert.match(app, /priceStatus === "assessed"/);
  assert.match(app, /mandatoryFeatureIds/);
  assert.match(app, /isMandatoryFeature/);
  assert.match(app, /difficultyIndex/);
  assert.match(app, /値付け根拠/);
  assert.match(app, /値付け意図/);
  assert.match(app, /pricing-review-warning/);
  assert.doesNotMatch(html, /id="contingency"/);
});

test("上書き・初期化に確認がある", () => {
  assert.match(app, /現在の案件.+置き換えますか/);
  assert.match(app, /案件名、見積項目、メモをすべて初期化しますか/);
});

test("見積は単一ページで、ヒアリング設問を持たない", () => {
  assert.equal((html.match(/<caption class="sr-only">/g) || []).length, 2);
  assert.doesNotMatch(html, /page-nav|page-interview|id="questions"/);
  assert.doesNotMatch(app, /Catalog\.questions|state\.answers|switchPage/);
  assert.doesNotMatch(catalog, /const questions = \[/);
});

test("合計金額は追従バーにも同期される", () => {
  assert.match(html, /class="estimate-sticky-total"/);
  assert.match(html, /id="sticky-summary-cost"/);
  assert.match(html, /id="sticky-summary-count"/);
  assert.match(app, /el\("sticky-summary-cost"\)\.textContent = money\.format\(estimate\.totalCost\)/);
  assert.match(app, /el\("sticky-summary-count"\)\.textContent/);
  assert.match(styles, /\.estimate-sticky-total\s*\{[^}]*position:\s*sticky/s);
  assert.match(styles, /@media print[\s\S]*\.estimate-sticky-total/);
});
