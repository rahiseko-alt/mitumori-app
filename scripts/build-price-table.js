// 価格表（.claude/skills/mitsumori-flow/見積単価表.md）を catalog.js から作り直す。
// チャットで動く Claude は catalog.js を読めないので、同じ数字を読める形に写す。
// 単価を変えたら必ず実行する:  node scripts/build-price-table.js
const fs = require("fs");
const path = require("path");
const Catalog = require("../catalog.js");
const Interview = require("../interview.js");

const TARGET = path.join(__dirname, "..", ".claude", "skills", "mitsumori-flow", "見積単価表.md");

function buildPriceTable() {
const mandatory = new Set(Catalog.mandatoryFeatureIds);
const always = new Set(Interview.alwaysAdded);
const k = (n) => Math.round(Number(n || 0) / 1000);
const name = (id) => Catalog.plainNames[id] || id;

const meta = Catalog.priceMasterMeta || {};
const out = [
  "# 見積単価表（千円・消費税別）",
  "",
  "**版：価格基準日 " + (meta.createdAt || "不明") + "／縮小率 " + (meta.priceScale || "不明") +
    "／" + Catalog.features.length + "項目**",
  "",
  "この表が唯一の単価の出どころである。ここにない金額を作ってはならない。",
  "原本は `catalog.js`。この表は `node scripts/build-price-table.js` で生成しており、手で書き換えない。",
  "",
  "- **区分**：`必須`＝どの案件でも必ず入る。`土台`＝誰も名指しで選ばないが、他が動くために要る。空欄＝営業が答えから選ぶもの。",
  "- **必要とするもの**：この項目を入れるとき、一緒に必ず入る項目。再帰的にたどる。",
  "- **一式に含む**：この項目を入れると、右の項目は0円になる（二重計上しない）。",
  "",
];

for (const layer of Object.keys(Catalog.layers)) {
  const rows = Catalog.features.filter((f) => f.layer === layer);
  if (!rows.length) continue;
  out.push("## " + (Catalog.plainLayers[layer] || Catalog.layers[layer]) + "（" + Catalog.layers[layer] + "）", "");
  out.push("| 項目名（顧客に見せる） | 技術名 | 単価 | 区分 | 必要とするもの | 一式に含む |");
  out.push("|---|---|---:|---|---|---|");
  for (const feature of rows) {
    const kind = mandatory.has(feature.id) ? "必須"
      : (feature.pricingClass === "foundation" || always.has(feature.id)) ? "土台" : "";
    const deps = (feature.dependencies || []).map(name).join("・");
    const included = (feature.bundleIncludes || []).map(name).join("・");
    out.push("| " + name(feature.id) + " | " + feature.name + " | " + k(feature.fixedPrice) +
      " | " + kind + " | " + (deps || "—") + " | " + (included || "—") + " |");
  }
  out.push("");
}

const mandatorySum = Catalog.features
  .filter((f) => mandatory.has(f.id))
  .reduce((sum, f) => sum + Number(f.fixedPrice || 0), 0);

out.push("## 必ず入る項目の合計", "");
out.push("必須" + mandatory.size + "件だけで **" + k(mandatorySum) + "千円**。ここに設計" + always.size +
  "工程（" + Interview.alwaysAdded.map(name).join("・") + "）が必ず加わる。");

  return out.join("\n") + "\n";
}

module.exports = { buildPriceTable, TARGET };

if (require.main === module) {
  fs.writeFileSync(TARGET, buildPriceTable());
  console.log("wrote " + TARGET + " (" + Catalog.features.length + " items)");
}
