const test = require("node:test");
const assert = require("node:assert");

const Catalog = require("../catalog.js");
const Engine = require("../engine.js");
const Interview = require("../interview.js");

const byId = new Map(Catalog.features.map((feature) => [feature.id, feature]));
const mandatory = new Set(Catalog.mandatoryFeatureIds);

function reachableIds() {
  const ids = new Set(Interview.alwaysAdded);
  for (const question of Interview.questions) {
    for (const choice of question.choices) choice.adds.forEach((id) => ids.add(id));
  }
  return ids;
}

function estimate(featureIds) {
  const selection = Engine.computeSelection(Catalog.features, [...new Set([...featureIds, ...Catalog.mandatoryFeatureIds])]);
  const pricing = Engine.applyPricingRules(Catalog.features, selection);
  return {
    selection,
    pricing,
    total: Engine.calculateEstimate(pricing.features, selection.selected, Catalog.rateProfiles.company.rates, 0).totalCost,
  };
}

test("骨格の木が足す項目はすべてカタログに実在する", () => {
  const unknown = [...reachableIds()].filter((id) => !byId.has(id));
  assert.deepEqual(unknown, []);
});

test("誰も選ばない基盤と必須項目は質問しない", () => {
  const asked = [...reachableIds()];
  const foundation = asked.filter((id) => byId.get(id).pricingClass === "foundation");
  const required = asked.filter((id) => mandatory.has(id));
  assert.deepEqual(foundation, [], "foundation を質問してはいけない");
  assert.deepEqual(required, [], "必須項目を質問してはいけない");
});

test("質問対象は foundation15件と必須6件を除いた76件で、うち74件へ到達する", () => {
  const target = Catalog.features.filter((f) => f.pricingClass !== "foundation" && !mandatory.has(f.id));
  assert.equal(target.length, 76);

  const reach = reachableIds();
  const missed = target.filter((f) => !reach.has(f.id)).map((f) => f.id);
  // 単体・結合・画面操作テストは標準QA一式（必須項目）に内包され、単独では常に0円になる。
  // 選ばせても金額が動かないため、質問を立てない。
  assert.deepEqual(missed.sort(), ["e2e-tests", "integration-tests", "unit-tests"]);
});

test("金額が動かない選択肢を置かない", () => {
  const dead = [];
  for (const question of Interview.questions) {
    for (const choice of question.choices) {
      if (!choice.adds.length) continue;
      const { pricing } = estimate(choice.adds);
      const own = choice.adds.reduce((sum, id) => sum + Number(pricing.pricingInfo.get(id)?.appliedPrice || 0), 0);
      if (own === 0) dead.push(`${question.id}.${choice.value}`);
    }
  }
  assert.deepEqual(dead, []);
});

test("条件つきの質問は前提が満たされたときだけ出る", () => {
  assert.equal(Interview.visibleQuestions({}).some((q) => q.id === "mfa"), false);
  assert.equal(Interview.visibleQuestions({ login: ["email"] }).some((q) => q.id === "mfa"), true);
  assert.equal(Interview.visibleQuestions({ records: "no" }).some((q) => q.id === "master"), false);
  assert.equal(Interview.visibleQuestions({ records: "yes" }).some((q) => q.id === "master"), true);
});

test("一問も答えなくても設計工程だけは積まれ、必須項目と重ならない", () => {
  const ids = Interview.selectedFeatures({});
  assert.deepEqual(ids.sort(), [...Interview.alwaysAdded].sort());
  assert.deepEqual(ids.filter((id) => mandatory.has(id)), []);
  assert.ok(estimate(ids).total > 190_000, "必須のみの190,000円より増える");
});

test("掘り下げが要る選択肢は、用語表に残す問いを持つ", () => {
  const digs = Interview.pendingDigs({ migrate: "yes", flow: "approve", calc: "yes" });
  assert.deepEqual(digs.map((d) => d.questionId).sort(), ["calc", "flow", "migrate"]);
  assert.ok(digs.every((d) => typeof d.ask === "string" && d.ask.length > 0));
});

test("現場写真アプリの回答が、依存込みの金額まで通る", () => {
  const answers = {
    who: ["partner"], login: ["email"], mfa: "no", scope: ["role"], volume: "mid",
    records: "yes", find: ["filter"], master: "yes", history: "yes", migrate: "yes",
    flow: "approve", calc: "yes", business: ["estimate"], money: ["no"],
    screens: ["dashboard", "admin"], device: ["mobile"], brand: ["none"],
    files: ["camera"], field: "yes", place: "map", notify: ["mail", "push"], timer: "yes",
    output: ["pdf", "excel"], external: ["none"], quality: ["security"], after: ["manual"], domain: "yes",
  };
  assert.equal(Interview.answeredCount(answers), Interview.visibleQuestions(answers).length);

  const ids = Interview.selectedFeatures(answers);
  const { selection, total } = estimate(ids);
  assert.ok(selection.selected.size > ids.length, "依存が自動で足される");
  assert.ok(total > 1_000_000, "実案件規模の金額になる");
  assert.equal(total % 5000, 0, "5,000円単位に揃う");
});

test("質問文と選択肢は用語表の言い換え禁止語を使わない", () => {
  const banned = ["お客様", "一緒に必要", "必須固定", "やりたいこと", "提示価格", "原本単価"];
  const texts = Interview.questions.flatMap((q) => [q.prompt, q.help, ...q.choices.map((c) => c.label)]);
  const hits = banned.filter((word) => texts.some((text) => String(text).includes(word)));
  assert.deepEqual(hits, []);
});
