(function attachRange(root, factory) {
  const data = factory(
    typeof require === "function" ? require("./catalog.js") : root.EstimateCatalog,
    typeof require === "function" ? require("./engine.js") : root.EstimateEngine,
    typeof require === "function" ? require("./interview.js") : root.EstimateInterview
  );
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  if (root) root.EstimateRange = data;
})(typeof window !== "undefined" ? window : null, function createRange(Catalog, Engine, Interview) {
  // 見積の幅は、決まっていない論点から出る（docs/adr/0005）。
  //   下限 ＝ 決まった分 ＋ 未決の論点すべてを「いちばん安い選び方」にした場合
  //   上限 ＝ 決まった分 ＋ 未決の論点すべてを「いちばん高い選び方」にした場合
  // 論点を1つ決めると、その論点の最小と最大が同じ値になり、幅がその分だけ消える。
  //
  // 論点ごとの金額を足し算するのではなく、毎回まるごと組み直して引き算する。
  // 複数の答えが同じ土台を共有するため、足し算では二重に数えてしまう。

  function total(answers) {
    const direct = Interview.selectedFeatures(answers);
    const all = [...new Set([...direct, ...Catalog.mandatoryFeatureIds])];
    const selection = Engine.computeSelection(Catalog.features, all);
    const pricing = Engine.applyPricingRules(Catalog.features, selection);
    return Engine.calculateEstimate(
      pricing.features, selection.selected, Catalog.rateProfiles.company.rates, 0
    ).totalCost;
  }

  function answered(answers, id) {
    const picked = answers[id];
    return Array.isArray(picked) ? picked.length > 0 : picked !== undefined && picked !== null;
  }

  function clone(answers) {
    const next = {};
    Object.keys(answers).forEach(function (id) {
      next[id] = Array.isArray(answers[id]) ? answers[id].slice() : answers[id];
    });
    return next;
  }

  // 未決の論点を、その質問だけ見て「安い側」「高い側」に寄せた答え。
  // 安い側は選択肢のうち何も足さないもの、高い側は複数選択ならすべて選んだ場合。
  function extremeAnswer(question, side) {
    if (side === "dear") {
      return question.multi
        ? question.choices.map(function (c) { return c.value; })
        : dearestSingle(question);
    }
    const free = question.choices.filter(function (c) { return !c.adds.length; })[0];
    return question.multi ? (free ? [free.value] : []) : (free ? free.value : cheapestSingle(question));
  }

  function priceOf(question, value) {
    const answers = {};
    answers[question.id] = question.multi ? [value] : value;
    return total(answers);
  }
  function cheapestSingle(question) {
    return question.choices.slice().sort(function (a, b) { return priceOf(question, a.value) - priceOf(question, b.value); })[0].value;
  }
  function dearestSingle(question) {
    return question.choices.slice().sort(function (a, b) { return priceOf(question, b.value) - priceOf(question, a.value); })[0].value;
  }

  // 答えを1つ置くと、条件つきの論点が新しく現れることがある。
  // 現れなくなるまで繰り返す。
  function fillOpen(answers, side) {
    const filled = clone(answers);
    for (let round = 0; round < 8; round += 1) {
      const open = Interview.visibleQuestions(filled).filter(function (q) { return !answered(filled, q.id); });
      if (!open.length) return filled;
      open.forEach(function (q) { filled[q.id] = extremeAnswer(q, side); });
    }
    return filled;
  }

  function computeRange(answers) {
    const given = clone(answers || {});
    const floorAnswers = fillOpen(given, "cheap");
    const floor = total(floorAnswers);
    const ceiling = total(fillOpen(given, "dear"));

    // 論点ごとの幅は「ほかを全部いちばん安くしたうえで、その論点だけ高くしたときの差」。
    // 決めたときに上限がいくら下がるか、という読み方をする。
    const open = Interview.visibleQuestions(given)
      .filter(function (q) { return !answered(given, q.id); })
      .map(function (q) {
        const dear = clone(floorAnswers);
        dear[q.id] = extremeAnswer(q, "dear");
        const high = total(fillOpen(dear, "cheap"));
        return {
          id: q.id, section: q.section, prompt: q.prompt, help: q.help,
          min: floor, max: high, band: high - floor
        };
      })
      .filter(function (point) { return point.band > 0; })
      .sort(function (a, b) { return b.band - a.band; });

    return {
      floor: floor,
      ceiling: ceiling,
      band: ceiling - floor,
      settled: Interview.visibleQuestions(given).filter(function (q) { return answered(given, q.id); }).map(function (q) { return q.id; }),
      open: open,
      total: total
    };
  }

  return { computeRange: computeRange, total: total, extremeAnswer: extremeAnswer };
});
