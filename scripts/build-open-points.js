// 論点表（.claude/skills/mitsumori-flow/open-points.md）を interview.js と catalog.js から作り直す。
// 見積の幅は決め打ちの%ではなく、決まっていない論点の「いちばん安い選び方」と
// 「いちばん高い選び方」の差から出る。その差を論点ごとに測って表にする。
//   node scripts/build-open-points.js
const fs = require("fs");
const path = require("path");
const Catalog = require("../catalog.js");
const Engine = require("../engine.js");
const Interview = require("../interview.js");
const Range = require("../range.js");

const TARGET = path.join(__dirname, "..", ".claude", "skills", "mitsumori-flow", "open-points.md");
const k = (n) => Math.round(Number(n || 0) / 1000);

function total(answers) {
  const direct = Interview.selectedFeatures(answers);
  const all = [...new Set([...direct, ...Catalog.mandatoryFeatureIds])];
  const selection = Engine.computeSelection(Catalog.features, all);
  const pricing = Engine.applyPricingRules(Catalog.features, selection);
  return Engine.calculateEstimate(pricing.features, selection.selected, Catalog.rateProfiles.company.rates, 0).totalCost;
}

// 条件つきの論点は、前提を満たす最小の答えを置いてから測る。
// そうしないと「前提がないので0円」という嘘の幅になる。
function contextFor(question) {
  if (!question.when) return {};
  for (const other of Interview.questions) {
    if (other.id === question.id) continue;
    for (const choice of other.choices) {
      const context = {};
      context[other.id] = other.multi ? [choice.value] : choice.value;
      if (question.when(context)) return context;
    }
  }
  throw new Error("前提を満たす答えが見つからない論点: " + question.id);
}

function measure(question) {
  const context = contextFor(question);
  const base = total(context);
  const set = (value) => {
    const next = JSON.parse(JSON.stringify(context));
    next[question.id] = value;
    return total(next) - base;
  };
  const costs = question.choices.map((choice) => ({
    label: choice.label,
    price: set(question.multi ? [choice.value] : choice.value),
    dig: choice.dig || "",
  }));
  const min = Math.min(...costs.map((c) => c.price));
  const max = question.multi
    ? set(question.choices.map((c) => c.value))
    : Math.max(...costs.map((c) => c.price));
  return { question, costs, min, max, band: max - min };
}

function buildOpenPoints() {
  // 並び順と幅は range.js の実測に合わせる。条件つきの論点は、前提が満たされて
  // はじめて現れるので、その前提を置いた状態で測り直して順位に入れる。
  const whole = Range.computeRange({});
  const bandOf = new Map(whole.open.map((p) => [p.id, p.band]));
  const points = Interview.questions.map((question) => {
    const measured = measure(question);
    measured.band = bandOf.has(question.id) ? bandOf.get(question.id) : measured.max - measured.min;
    return measured;
  }).sort((a, b) => b.band - a.band);
  const base = whole.floor;

  const out = [
    "# 論点表（幅の出どころ・千円）",
    "",
    "見積の幅は決め打ちではない。**まだ決まっていない論点の、いちばん安い選び方と",
    "いちばん高い選び方の差**が幅になる。論点が1つ決まるたびに、その差の分だけ幅が縮む。",
    "",
    "- **下限** ＝ 決まった分の金額 ＋ 未決の論点それぞれの最小",
    "- **上限** ＝ 決まった分の金額 ＋ 未決の論点それぞれの最大",
    "- 未決がゼロになれば、上限と下限が一致する。幅は自然に消える。",
    "",
    "何も決まっていない状態では **" + k(base) + "千円 〜 " + k(whole.ceiling) + "千円**（幅 " +
      k(whole.band) + "千円）。必ず入る項目だけで " + k(base) + "千円あるので、下限がそれを下回ることはない。",
    "",
    "**下の「幅」を足し算してはならない。** 足すと " + k(points.reduce((s, p) => s + p.band, 0)) +
      "千円になるが、実際の上限は " + k(whole.ceiling - base) + "千円ぶんしか増えない。",
    "複数の論点が同じ土台を共有しているためで、足し算は二重に数えてしまう。",
    "合計は必ず `price-table.md` で組み直すこと。",
    "",
    "**グリルは、この表の上から順に潰す。** 幅の大きい論点を1つ決めるほうが、小さい論点を",
    "5つ決めるより幅が縮む。顧客が付き合ってくれる時間は有限なので、金額が動く順に聞く。",
    "",
    "各論点の「幅」は、**ほかの論点をすべていちばん安い選び方にしたうえで、この論点だけを",
    "いちばん高い選び方にしたときの差**である。つまり「この論点を決めると、上限が最大いくら",
    "下がるか」を表す。選び方ごとの金額も、その論点だけを単独で入れたときの額である。",
    "",
    "| 幅 | 論点 | 範囲 | 聞くこと |",
    "|---:|---|---|---|",
  ];
  for (const p of points) {
    out.push("| " + k(p.band) + " | " + p.question.id + "（" + p.question.section + "） | " +
      k(p.min) + "〜" + k(p.max) + " | " + p.question.prompt + " |");
  }
  out.push("");

  for (const p of points) {
    out.push("## " + p.question.prompt + "　`" + p.question.id + "`", "");
    out.push("幅 **" + k(p.band) + "千円**（" + k(p.min) + "〜" + k(p.max) + "）／" + p.question.section +
      (p.question.multi ? "／いくつでも当てはまる" : "／どれか1つ"), "");
    if (p.question.help) out.push("> " + p.question.help, "");
    out.push("| 選び方 | 金額 | 決まっていなければ掘ること |");
    out.push("|---|---:|---|");
    for (const c of p.costs) {
      out.push("| " + c.label + " | " + k(c.price) + " | " + (c.dig || "—") + " |");
    }
    if (p.question.multi) {
      out.push("| **すべて当てはまる場合** | **" + k(p.max) + "** | — |");
    }
    out.push("");
  }
  return out.join("\n") + "\n";
}

module.exports = { buildOpenPoints, TARGET };

if (require.main === module) {
  fs.writeFileSync(TARGET, buildOpenPoints());
  console.log("wrote " + TARGET + " (" + Interview.questions.length + " points)");
}
