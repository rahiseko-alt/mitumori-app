(function runEstimateApp() {
  "use strict";

  const Engine = window.EstimateEngine;
  const Catalog = window.EstimateCatalog;
  const STORAGE_KEY = "development-estimate-navigator-v2";
  const STORAGE_CONSENT_KEY = "development-estimate-navigator-autosave-consent";
  const ESTIMATE_TEAM_SIZE = 3.25;
  const money = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 });
  const el = (id) => document.getElementById(id);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const localDate = (date = new Date()) => {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 10);
  };
  const newEstimateNumber = () => {
    const now = new Date();
    const stamp = `${localDate(now).replaceAll("-", "")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    return `EST-${stamp}`;
  };
  const defaultState = () => {
    const created = new Date();
    const validUntil = new Date(created);
    validUntil.setDate(validUntil.getDate() + 30);
    return ({
      projectName: "新規システム",
      customerName: "",
      issuerName: "",
      profile: "company",
      manual: [],
      answers: [],
      excluded: [],
      customFeatures: [],
      profileRates: {
        company: clone(Catalog.rateProfiles.company.rates),
      },
      contingencies: {
        company: Catalog.rateProfiles.company.contingency,
      },
      hoursPerMonth: 160,
      notes: "",
      autoSave: false,
      estimateNumber: newEstimateNumber(),
      createdAt: localDate(created),
      validUntil: localDate(validUntil),
      activePage: "interview",
      dependencyFocus: "project-management",
    });
  };

  const normalizeCustomFeatures = (items) => (Array.isArray(items) ? items : []).map((feature) => {
    const hasFixedPrice = Object.prototype.hasOwnProperty.call(feature, "fixedPrice");
    const fixedPrice = hasFixedPrice ? Math.max(0, Number(feature.fixedPrice || 0)) : 0;
    return {
      ...feature,
      fixedPrice,
      priceSize: feature.priceSize || "—",
      priceSourceName: feature.priceSourceName || (fixedPrice > 0 ? "案件固有（手入力）" : "該当なし（仮0円）"),
      priceStatus: feature.priceStatus || (fixedPrice > 0 ? "manual" : "temporary"),
    };
  });

  function loadState() {
    try {
      if (localStorage.getItem(STORAGE_CONSENT_KEY) !== "true") {
        localStorage.removeItem(STORAGE_KEY);
        return defaultState();
      }
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return defaultState();
      const base = defaultState();
      return {
        ...base,
        ...saved,
        manual: Array.isArray(saved.manual) ? saved.manual : base.manual,
        answers: Array.isArray(saved.answers) ? saved.answers : [],
        excluded: Array.isArray(saved.excluded) ? saved.excluded : [],
        customFeatures: normalizeCustomFeatures(saved.customFeatures),
        profileRates: base.profileRates,
        contingencies: { company: Number(saved.contingencies?.company ?? base.contingencies.company) },
        profile: "company",
        autoSave: true,
        activePage: saved.activePage === "estimate" ? "estimate" : "interview",
      };
    } catch {
      return defaultState();
    }
  }

  let state = loadState();
  let selection = null;
  let estimate = null;
  let customDependencyDraft = new Set();

  function allFeatures() {
    return [...Catalog.features, ...state.customFeatures];
  }

  function featureMap() {
    return new Map(allFeatures().map((feature) => [feature.id, feature]));
  }

  function displayName(featureOrId) {
    const feature = typeof featureOrId === "string" ? featureMap().get(featureOrId) : featureOrId;
    return feature?.plainName || feature?.name || String(featureOrId || "");
  }

  function technicalName(featureOrId) {
    const feature = typeof featureOrId === "string" ? featureMap().get(featureOrId) : featureOrId;
    const name = feature?.name || "";
    return name && name !== displayName(feature) ? name : "";
  }

  function itemNumber(featureOrId) {
    const id = typeof featureOrId === "string" ? featureOrId : featureOrId?.id;
    const index = allFeatures().findIndex((feature) => feature.id === id);
    return index >= 0 ? index + 1 : null;
  }

  function itemNumbers(ids) {
    return ids.map((id) => itemNumber(id)).filter(Boolean).map((number) => `項目${number}`).join(" ・ ");
  }

  function selectedParents(featureId) {
    return [...(selection?.requiredBy?.get(featureId) || [])].filter((id) => selection.selected.has(id));
  }

  function choiceEntries() {
    return Catalog.questions.flatMap((question) => [...question.choices, {
      id: "none",
      label: "該当なし・まだ不明",
      features: [],
    }].map((choice) => ({
      ...choice,
      key: `${question.id}:${choice.id}`,
      questionTitle: question.title,
    })));
  }

  function answerFeatures() {
    const selectedAnswers = new Set(state.answers);
    return new Set(choiceEntries()
      .filter((choice) => selectedAnswers.has(choice.key))
      .flatMap((choice) => choice.features));
  }

  function directIds() {
    const excluded = new Set(state.excluded);
    return new Set([...state.manual, ...answerFeatures()].filter((id) => !excluded.has(id)));
  }

  function answerSources(featureId) {
    const selectedAnswers = new Set(state.answers);
    return choiceEntries()
      .filter((choice) => selectedAnswers.has(choice.key) && choice.features.includes(featureId))
      .map((choice) => choice.label);
  }

  function saveState() {
    try {
      if (state.autoSave) {
        localStorage.setItem(STORAGE_CONSENT_KEY, "true");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } else {
        localStorage.removeItem(STORAGE_CONSENT_KEY);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      state.autoSave = false;
    }
  }

  function currentRates() {
    return Catalog.rateProfiles.company.rates;
  }

  function compute(ids = directIds()) {
    const result = Engine.computeSelection(allFeatures(), ids);
    const value = Engine.calculateEstimate(allFeatures(), result.selected, currentRates(), 0);
    return { selection: result, estimate: value };
  }

  function directFeatureMetrics(feature) {
    const hours = Engine.ROLES.reduce((sum, role) => sum + Number(feature.hours?.[role] || 0), 0);
    const calculatedCost = Engine.ROLES.reduce((sum, role) => sum + Number(feature.hours?.[role] || 0) * Number(currentRates()[role] || 0), 0);
    const cost = Object.prototype.hasOwnProperty.call(feature, "fixedPrice") ? Math.max(0, Number(feature.fixedPrice || 0)) : calculatedCost;
    return { hours, cost };
  }

  function isTemporaryPrice(feature) {
    return feature?.priceStatus === "temporary";
  }

  function maintenanceEstimate() {
    return Math.round(estimate.totalCost * Number(Catalog.priceMasterMeta?.maintenanceRate || 10) / 100);
  }

  function durationMonths(hours) {
    return Engine.calculateDurationMonths(hours, state.hoursPerMonth, ESTIMATE_TEAM_SIZE);
  }

  function questionProgress() {
    const answered = new Set(state.answers.map((key) => key.split(":")[0]));
    return { answered: answered.size, total: Catalog.questions.length, unanswered: Math.max(0, Catalog.questions.length - answered.size) };
  }

  function names(ids, limit = 6) {
    const map = featureMap();
    const values = ids.map((id) => displayName(map.get(id) || id));
    return `${values.slice(0, limit).join("、")}${values.length > limit ? ` ほか${values.length - limit}件` : ""}`;
  }

  function setImpact(title, description, removal = false) {
    const panel = el("impact-panel");
    panel.classList.toggle("removal", removal);
    panel.querySelector("strong").textContent = title;
    panel.querySelector("span").textContent = description;
  }

  function describeChange(before, after, label) {
    const added = [...after.selection.selected].filter((id) => !before.selection.selected.has(id));
    const removed = [...before.selection.selected].filter((id) => !after.selection.selected.has(id));
    const delta = after.estimate.totalCost - before.estimate.totalCost;
    const price = delta === 0 ? "金額変更なし" : `${delta > 0 ? "+" : "-"}${money.format(Math.abs(delta))}`;
    if (added.length) {
      setImpact(`${label}：${price}`, `${added.length}件追加：${names(added)}`);
    } else if (removed.length) {
      setImpact(`${label}：${price}`, `${removed.length}件解除：${names(removed)}`, true);
    } else {
      setImpact(`${label}：${price}`, "他の項目でも使う準備は、まだ必要なため残っています。", delta <= 0);
    }
  }

  function switchPage(page) {
    state.activePage = page === "estimate" ? "estimate" : "interview";
    document.querySelectorAll("[data-page]").forEach((button) => {
      const active = button.dataset.page === state.activePage;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    ["interview", "estimate"].forEach((name) => {
      const panel = el(`page-${name}`);
      const active = name === state.activePage;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    saveState();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderPresets() {
    el("preset-buttons").innerHTML = Catalog.presets
      .map((preset) => `<button type="button" data-preset="${preset.id}">${escapeHtml(preset.name)}に置き換え</button>`)
      .join("");
  }

  function renderQuestions() {
    const answers = new Set(state.answers);
    el("questions").innerHTML = Catalog.questions.map((question, index) => `
      <section class="question-card">
        <div class="question-number">${String(index + 1).padStart(2, "0")}</div>
        <div>
          <h3>${escapeHtml(question.title)}</h3>
          <p>${escapeHtml(question.help)}</p>
          <div class="choice-grid">${[...question.choices, { id: "none", label: "該当なし・まだ不明" }].map((choice) => {
            const key = `${question.id}:${choice.id}`;
            return `<label><input type="checkbox" data-answer-key="${key}" ${answers.has(key) ? "checked" : ""}><span>${escapeHtml(choice.label)}</span></label>`;
          }).join("")}</div>
        </div>
      </section>`).join("");
  }

  function renderInterviewSummary() {
    el("interview-count").textContent = `${selection.selected.size}件`;
    el("interview-cost").textContent = money.format(estimate.totalCost);
    const answerCount = state.answers.filter((key) => !key.endsWith(":none")).length;
    const progress = questionProgress();
    el("interview-note").textContent = answerCount
      ? `${answerCount}個の該当回答から候補を作成中。${progress.answered}/${progress.total}問を確認済みです。`
      : `該当項目を選ぶと自動更新されます。${progress.answered}/${progress.total}問を確認済みです。`;
    el("interview-progress").textContent = progress.unanswered
      ? `未確認が${progress.unanswered}問あります。各質問で該当項目または「該当なし・まだ不明」を選んでください。`
      : "全質問を確認済みです。必要な作業と金額を確認して次へ進めます。";
    el("go-estimate").classList.toggle("has-warning", progress.unanswered > 0);
  }

  function renderSummary() {
    const temporaryCount = [...selection.selected].filter((id) => isTemporaryPrice(featureMap().get(id))).length;
    el("summary-count").textContent = `${selection.selected.size}件`;
    el("summary-count-detail").textContent = `自分で選択${selection.direct.size}・一緒に必要${selection.automatic.size}`;
    el("summary-hours").textContent = `${number.format(estimate.baseHours)}時間`;
    el("summary-months").textContent = `1人換算 ${number.format(estimate.baseHours / state.hoursPerMonth)}か月分`;
    el("summary-cost").textContent = money.format(estimate.totalCost);
    el("summary-price-note").textContent = temporaryCount
      ? `固定単価合計・仮0円 ${temporaryCount}件を含む`
      : `固定単価合計・年間保守目安 ${money.format(maintenanceEstimate())}は別途`;
    el("summary-duration").textContent = `${durationMonths(estimate.baseHours)}か月`;
    el("summary-team").textContent = "中小規模システム会社・平均3～4名で並行";
  }

  function featureSource(featureId) {
    if (state.manual.includes(featureId)) return { label: "商談で選択", className: "direct" };
    const sources = answerSources(featureId);
    if (sources.length && !state.excluded.includes(featureId)) return { label: `初回回答：${sources[0]}`, className: "answer" };
    if (selection.automatic.has(featureId)) return { label: "一緒に必要", className: "auto" };
    return null;
  }

  function incrementalCost(featureId) {
    const direct = directIds();
    if (direct.has(featureId)) {
      const afterDirect = new Set(direct);
      afterDirect.delete(featureId);
      const after = compute(afterDirect);
      return { amount: Math.max(0, estimate.totalCost - after.estimate.totalCost), mode: "remove" };
    }
    if (selection.selected.has(featureId)) return { amount: 0, mode: "locked" };
    const afterDirect = new Set(direct);
    afterDirect.add(featureId);
    const after = compute(afterDirect);
    return { amount: Math.max(0, after.estimate.totalCost - estimate.totalCost), mode: "add" };
  }

  function hierarchyModel() {
    const features = allFeatures();
    const map = new Map(features.map((feature) => [feature.id, feature]));
    return Catalog.featureHierarchy.map((layer) => {
      const configured = new Set(layer.groups.flatMap((group) => group.features));
      const groups = layer.groups.map((group) => ({
        ...group,
        featureObjects: group.features.map((id) => map.get(id)).filter(Boolean),
      }));
      const extra = features.filter((feature) => feature.layer === layer.id && !configured.has(feature.id));
      if (extra.length) groups.push({ id: `${layer.id}-custom`, name: "この案件だけの追加項目", features: extra.map((feature) => feature.id), featureObjects: extra });
      return { ...layer, groups, featureObjects: groups.flatMap((group) => group.featureObjects) };
    });
  }

  function branchFeatureIds(branchKey) {
    const [type, id] = branchKey.split(":");
    const hierarchy = hierarchyModel();
    if (type === "layer") return hierarchy.find((layer) => layer.id === id)?.featureObjects.map((feature) => feature.id) || [];
    if (type === "group") return hierarchy.flatMap((layer) => layer.groups).find((group) => group.id === id)?.featureObjects.map((feature) => feature.id) || [];
    return [];
  }

  function renderFeatureTree() {
    const query = el("feature-search").value.trim().toLowerCase();
    const selectedOnly = el("selected-only").checked;
    const direct = directIds();
    const features = allFeatures();
    const visible = features.filter((feature) => {
      const haystack = `${displayName(feature)} ${feature.name} ${feature.description} ${feature.priceSourceName || ""} ${feature.priceSize || ""} ${(feature.tags || []).join(" ")}`.toLowerCase();
      return (!query || haystack.includes(query)) && (!selectedOnly || selection.selected.has(feature.id));
    });

    const visibleIds = new Set(visible.map((feature) => feature.id));
    const html = hierarchyModel().map((layer) => {
      const visibleGroups = layer.groups.map((group) => ({ ...group, visibleFeatures: group.featureObjects.filter((feature) => visibleIds.has(feature.id)) }))
        .filter((group) => group.visibleFeatures.length);
      if (!visibleGroups.length) return "";
      const selectedCount = layer.featureObjects.filter((feature) => selection.selected.has(feature.id)).length;
      return `<section class="tree-group" data-layer="${layer.id}">
        <div class="tree-group-heading">
          <label>
            <input type="checkbox" data-branch-toggle="layer:${layer.id}" aria-label="${escapeHtml(layer.name)}を一括選択">
            <span class="tree-line"></span>
            <span><strong>${escapeHtml(layer.name)}</strong><small>${selectedCount}/${layer.featureObjects.length}件を見積中</small></span>
          </label>
          <span class="branch-rule">まとめて選択</span>
        </div>
        <ul class="tree-subgroups">${visibleGroups.map((group) => {
          const groupSelected = group.featureObjects.filter((feature) => selection.selected.has(feature.id)).length;
          return `<li class="subgroup-node">
            <div class="subgroup-heading">
              <label><input type="checkbox" data-branch-toggle="group:${group.id}" aria-label="${escapeHtml(group.name)}を一括選択"><span><strong>${escapeHtml(group.name)}</strong><small>${groupSelected}/${group.featureObjects.length}件</small></span></label>
              <span>このまとまりだけ選択</span>
            </div>
            <ul class="tree-children">${group.visibleFeatures.map((feature) => {
          const selected = selection.selected.has(feature.id);
          const isDirect = direct.has(feature.id);
          const parents = selectedParents(feature.id);
          const locked = selected && (!isDirect || parents.length > 0);
          const source = featureSource(feature.id);
          const directCost = directFeatureMetrics(feature).cost;
          const temporaryPrice = isTemporaryPrice(feature);
          const delta = incrementalCost(feature.id);
          const deltaText = delta.mode === "add" ? `枝ごと追加 +${money.format(delta.amount)}`
            : delta.mode === "remove"
              ? (delta.amount > 0 ? `この枝を外すと -${money.format(delta.amount)}` : `${itemNumbers(parents)}でも使うため金額は変わらない`)
              : (parents.length ? `${itemNumbers(parents)}で使うため選べません` : "他の項目で使っている");
          const isCustom = feature.id.startsWith("custom-");
          const label = displayName(feature);
          return `<li class="feature-node ${selected ? "is-selected" : ""} ${locked ? "is-locked" : ""}">
            <div class="feature-node-row">
              <label class="node-check">
                <input type="checkbox" data-feature-toggle="${feature.id}" data-locked="${locked}" aria-label="${escapeHtml(label)}を見積に含める" ${selected ? "checked" : ""} ${locked ? `aria-disabled="true" tabindex="-1"` : ""}>
                ${locked ? `<span class="check-lock" aria-label="${itemNumbers(parents) || "必要項目"}が使用中">🔒</span>` : ""}
                <span class="tree-line"></span>
              </label>
              <button type="button" class="feature-focus" data-focus="${feature.id}" aria-label="${escapeHtml(label)}を選ぶと一緒に必要になる項目を表示">
                <span class="feature-title-line"><span class="item-number">#${itemNumber(feature)}</span> <span class="feature-name">${escapeHtml(label)}</span></span>
                ${technicalName(feature) ? `<span class="technical-name">技術名：${escapeHtml(technicalName(feature))}</span>` : ""}
              </button>
              <div class="feature-price ${temporaryPrice ? "is-temporary" : ""}">
                <strong>${money.format(directCost)}${temporaryPrice ? "（仮）" : ""}</strong><small>${temporaryPrice ? "価格表に該当なし・要確認" : `${escapeHtml(feature.priceSourceName)}・税別`}</small>
                <span class="delta ${delta.mode}">${deltaText}</span>
              </div>
            </div>
            <div class="feature-badges">
              ${source ? `<span class="badge ${source.className}">${escapeHtml(source.label)}</span>` : ""}
              <span class="badge ${temporaryPrice ? "price-temporary" : "price-master"}">${temporaryPrice ? "仮0円" : `規模 ${escapeHtml(feature.priceSize)}`}</span>
              <span class="badge">${number.format(Engine.ROLES.reduce((sum, role) => sum + Number(feature.hours?.[role] || 0), 0))}時間</span>
              ${(feature.dependencies || []).length ? `<span class="badge locked-badge">🔒 一緒に必要 ${feature.dependencies.length}件</span>` : `<span class="badge">この項目だけ</span>`}
              ${isCustom ? `<button type="button" class="custom-delete" data-delete-custom="${feature.id}">追加項目を削除</button>` : ""}
            </div>
          </li>`;
            }).join("")}</ul>
          </li>`;
        }).join("")}</ul>
      </section>`;
    }).join("");

    el("feature-tree").innerHTML = html || `<div class="empty-state">条件に合う項目がありません。</div>`;
    el("feature-tree").querySelectorAll("[data-branch-toggle]").forEach((input) => {
      const ids = branchFeatureIds(input.dataset.branchToggle);
      const selectedCount = ids.filter((id) => selection.selected.has(id)).length;
      input.checked = ids.length > 0 && selectedCount === ids.length;
      input.indeterminate = selectedCount > 0 && selectedCount < ids.length;
      input.setAttribute("aria-checked", input.indeterminate ? "mixed" : String(input.checked));
    });
  }

  function renderDependencyNode(node, depth = 0) {
    if (!node) return "";
    const map = featureMap();
    const feature = map.get(node.id);
    if (!feature) return "";
    const direct = directIds();
    const selected = selection.selected.has(node.id);
    const parents = selectedParents(node.id);
    const locked = selected && (!direct.has(node.id) || parents.length > 0);
    const dependents = Engine.reverseDependents(allFeatures(), selection.selected, node.id);
    const shared = dependents.length > 1;
    const directCost = directFeatureMetrics(feature).cost;
    const temporaryPrice = isTemporaryPrice(feature);
    return `<li class="dependency-node ${locked ? "is-locked" : ""}">
      <div class="dependency-row">
        <label>
          <input type="checkbox" data-tree-toggle="${node.id}" data-locked="${locked}" aria-label="${escapeHtml(displayName(feature))}を見積に含める" ${selected ? "checked" : ""} ${locked ? `aria-disabled="true" tabindex="-1"` : ""}>
          <span class="check-lock">${locked ? "🔒" : ""}</span>
        </label>
        <div><strong><span class="item-number">#${itemNumber(feature)}</span> ${escapeHtml(displayName(feature))}</strong>${technicalName(feature) ? `<span class="technical-name">技術名：${escapeHtml(technicalName(feature))}</span>` : ""}<small>${escapeHtml(Catalog.plainLayers[feature.layer] || feature.layer)}・${temporaryPrice ? `${money.format(0)}（仮・要確認）` : `規模${escapeHtml(feature.priceSize)} ${money.format(directCost)}（税別）`}</small></div>
        ${shared ? `<span class="shared-badge">${itemNumbers(dependents)}でも使用</span>` : locked && parents.length ? `<span class="shared-badge">${itemNumbers(parents)}が使用中</span>` : ""}
      </div>
      ${node.children?.length ? `<ul>${node.children.map((child) => renderDependencyNode(child, depth + 1)).join("")}</ul>` : ""}
    </li>`;
  }

  function renderDependencyInspector() {
    const map = featureMap();
    let feature = map.get(state.dependencyFocus);
    if (!feature) {
      const fallbackId = [...selection.direct][0] || allFeatures()[0]?.id;
      state.dependencyFocus = fallbackId;
      feature = map.get(fallbackId);
    }
    if (!feature) {
      el("dependency-tree").innerHTML = `<div class="empty-state">表示できる項目がありません。</div>`;
      el("reverse-dependencies").innerHTML = "";
      return;
    }
    const selected = selection.selected.has(feature.id);
    el("dependency-help").innerHTML = `<strong>#${itemNumber(feature)} ${escapeHtml(displayName(feature))}</strong>${technicalName(feature) ? `<span class="technical-name">技術名：${escapeHtml(technicalName(feature))}</span>` : ""}<br>${selected ? "現在の見積に含まれています。下へ進むほど、一緒に必要になる準備です。" : "未選択です。チェックすると下の準備も一緒に追加されます。"}`;
    const tree = Engine.dependencyTree(allFeatures(), feature.id);
    el("dependency-tree").innerHTML = `<ul class="dependency-root">${renderDependencyNode(tree)}</ul>`;
    const parents = Engine.reverseDependents(allFeatures(), selection.selected, feature.id);
    el("reverse-dependencies").innerHTML = parents.length
      ? `<strong>この準備を一緒に使っている項目</strong><div class="dependent-tags">${parents.map((id) => { const item = map.get(id); return `<button type="button" data-focus="${id}">#${itemNumber(id)} ${escapeHtml(displayName(item || id))}${technicalName(item) ? `<small>${escapeHtml(technicalName(item))}</small>` : ""}</button>`; }).join("")}</div>`
      : `<strong>他の項目との共用</strong><p>選択中の他の項目からは直接使われていません。</p>`;
  }

  function renderEstimateDetails() {
    el("hours-per-month").value = state.hoursPerMonth;
    el("project-notes").value = state.notes;

    el("role-table").querySelector("tbody").innerHTML = Engine.ROLES.map((role) => {
      const hours = estimate.roleHours[role];
      return `<tr><td>${escapeHtml(Catalog.roles[role])}</td><td class="numeric">${number.format(hours)}時間</td><td class="numeric">${number.format(hours / state.hoursPerMonth)}</td></tr>`;
    }).join("")
      + `<tr class="total-row"><th>参考工数合計</th><th class="numeric">${number.format(estimate.baseHours)}時間</th><th class="numeric">${number.format(estimate.baseHours / state.hoursPerMonth)}</th></tr>`;

    const map = featureMap();
    el("feature-table").querySelector("tbody").innerHTML = [...selection.selected]
      .map((id) => map.get(id)).filter(Boolean)
      .sort((a, b) => `${a.layer}${a.name}`.localeCompare(`${b.layer}${b.name}`, "ja"))
      .map((feature) => {
        const source = featureSource(feature.id);
        const metrics = directFeatureMetrics(feature);
        const temporaryPrice = isTemporaryPrice(feature);
        return `<tr class="${temporaryPrice ? "temporary-price-row" : ""}"><td>#${itemNumber(feature)}</td><td>${escapeHtml(source?.label || "一緒に必要")}</td><td>${escapeHtml(Catalog.plainLayers[feature.layer] || feature.layer)}</td><td>${escapeHtml(displayName(feature))}</td><td>${escapeHtml(feature.priceSourceName || "該当なし")}</td><td>${escapeHtml(feature.priceSize || "—")}</td><td class="numeric">${number.format(metrics.hours)}時間</td><td class="numeric">${money.format(metrics.cost)}${temporaryPrice ? "（仮）" : ""}</td></tr>`;
      }).join("") + (selection.selected.size
        ? `<tr class="total-row"><th colspan="6">機能単価合計（消費税別）</th><th class="numeric">${number.format(estimate.baseHours)}時間</th><th class="numeric">${money.format(estimate.totalCost)}</th></tr><tr><th colspan="7">年間保守費目安（10%・別途）</th><th class="numeric">${money.format(maintenanceEstimate())}</th></tr>`
        : `<tr><td colspan="8">見積項目が選択されていません。</td></tr>`);

    el("print-project-name").textContent = state.projectName || "—";
    el("print-customer-name").textContent = state.customerName || "—";
    el("print-issuer-name").textContent = state.issuerName || "—";
    el("print-estimate-number").textContent = state.estimateNumber || "—";
    el("print-created-at").textContent = state.createdAt || "—";
    el("print-valid-until").textContent = state.validUntil || "—";
    el("print-project-notes").textContent = state.notes || "記載なし";
  }

  function renderCustomHours() {
    el("custom-layer").innerHTML = Object.entries(Catalog.plainLayers)
      .map(([id, label]) => `<option value="${id}">${escapeHtml(label)}</option>`)
      .join("");
    el("custom-hours").innerHTML = Engine.ROLES.map((role) => `<label><span>${escapeHtml(Catalog.roles[role])}</span><input type="number" min="0" step="1" value="0" data-custom-hour="${role}"></label>`).join("");
  }

  function renderCustomDependencies() {
    const query = el("custom-dependency-search").value.trim().toLowerCase();
    el("custom-dependencies").innerHTML = allFeatures()
      .filter((feature) => !query || `${feature.name} ${feature.description}`.toLowerCase().includes(query))
      .map((feature) => `<label><input type="checkbox" value="${feature.id}" ${customDependencyDraft.has(feature.id) ? "checked" : ""}><span>#${itemNumber(feature)} ${escapeHtml(displayName(feature))}${technicalName(feature) ? `<small>技術名：${escapeHtml(technicalName(feature))}</small>` : ""}</span></label>`)
      .join("");
  }

  function renderAll() {
    const errors = Engine.validateCatalog(allFeatures());
    if (errors.length) setImpact("見積項目を確認してください", errors[0], true);
    ({ selection, estimate } = compute());
    renderInterviewSummary();
    renderSummary();
    renderFeatureTree();
    renderDependencyInspector();
    renderEstimateDetails();
    el("project-name").value = state.projectName;
    el("customer-name").value = state.customerName;
    el("issuer-name").value = state.issuerName;
    el("auto-save").checked = Boolean(state.autoSave);
    saveState();
  }

  function toggleAnswer(answerKey, checked) {
    const before = compute();
    const answers = new Set(state.answers);
    const questionId = answerKey.split(":")[0];
    if (checked) {
      [...answers].filter((key) => key.startsWith(`${questionId}:`)).forEach((key) => {
        if (answerKey.endsWith(":none") || key.endsWith(":none")) answers.delete(key);
      });
      answers.add(answerKey);
    } else {
      answers.delete(answerKey);
    }
    state.answers = [...answers];
    const choice = choiceEntries().find((item) => item.key === answerKey);
    if (checked && choice) {
      const excluded = new Set(state.excluded);
      choice.features.forEach((id) => excluded.delete(id));
      state.excluded = [...excluded];
    }
    const after = compute();
    describeChange(before, after, `${choice?.label || "回答"}を${checked ? "選択" : "解除"}`);
    renderQuestions();
    renderAll();
  }

  function setFeature(featureId, checked, label) {
    const before = compute();
    const manual = new Set(state.manual);
    const excluded = new Set(state.excluded);
    if (checked) {
      manual.add(featureId);
      excluded.delete(featureId);
      state.dependencyFocus = featureId;
    } else {
      manual.delete(featureId);
      excluded.add(featureId);
    }
    state.manual = [...manual];
    state.excluded = [...excluded];
    const after = compute();
    describeChange(before, after, label || `${displayName(featureId) || "項目"}を${checked ? "追加" : "解除"}`);
    renderAll();
  }

  function toggleBranch(branchKey, checked) {
    const before = compute();
    const targetIds = branchFeatureIds(branchKey);
    const manual = Engine.setBranchSelection(state.manual, targetIds, checked);
    const excluded = new Set(state.excluded);
    targetIds.forEach((featureId) => {
      if (checked) {
        excluded.delete(featureId);
      } else {
        excluded.add(featureId);
      }
    });
    state.manual = [...manual];
    state.excluded = [...excluded];
    const after = compute();
    const [type, id] = branchKey.split(":");
    const hierarchy = hierarchyModel();
    const label = type === "layer"
      ? hierarchy.find((layer) => layer.id === id)?.name
      : hierarchy.flatMap((layer) => layer.groups).find((group) => group.id === id)?.name;
    describeChange(before, after, `${label || "選択した枝"}配下を${checked ? "一括追加" : "一括解除"}`);
    renderAll();
  }

  function applyPreset(presetId) {
    const preset = Catalog.presets.find((item) => item.id === presetId);
    if (!preset) return;
    const hasCurrentWork = state.answers.length > 0 || state.manual.length > 0 || state.excluded.length > 0;
    if (hasCurrentWork && !window.confirm(`現在のヒアリング回答と選択項目を「${preset.name}」の構成に置き換えますか？`)) return;
    const before = compute();
    state.answers = [];
    state.manual = [...preset.features];
    state.excluded = [];
    state.dependencyFocus = preset.features[0] || state.dependencyFocus;
    const after = compute();
    describeChange(before, after, `${preset.name}へ置き換え`);
    renderQuestions();
    renderAll();
  }

  function openCustomDialog() {
    el("custom-feature-form").reset();
    customDependencyDraft = new Set();
    renderCustomHours();
    renderCustomDependencies();
    el("custom-error").textContent = "";
    el("custom-dialog").showModal();
  }

  function createCustomFeature(event) {
    event.preventDefault();
    const name = el("custom-name").value.trim();
    const description = el("custom-description").value.trim() || "この案件だけの追加項目です。";
    const layer = el("custom-layer").value;
    const fixedPrice = Math.max(0, Number(el("custom-price").value || 0));
    const priceSize = el("custom-price-size").value || "—";
    const hours = Object.fromEntries(Engine.ROLES.map((role) => [role, Number(document.querySelector(`[data-custom-hour="${role}"]`).value || 0)]));
    if (!name) { el("custom-error").textContent = "項目名を入力してください。"; return; }
    const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    state.customFeatures.push({
      id, layer, name, plainName: name, description, hours,
      dependencies: [...customDependencyDraft], tags: ["独自"],
      fixedPrice, priceSize,
      priceSourceName: fixedPrice > 0 ? "案件固有（手入力）" : "該当なし（仮0円）",
      priceStatus: fixedPrice > 0 ? "manual" : "temporary",
    });
    state.manual.push(id);
    state.excluded = state.excluded.filter((item) => item !== id);
    state.dependencyFocus = id;
    el("custom-dialog").close();
    setImpact(`${name}を追加`, customDependencyDraft.size ? `一緒に必要な項目${customDependencyDraft.size}件も加えました。` : "この項目だけを追加しました。");
    renderAll();
  }

  function deleteCustomFeature(featureId) {
    const dependents = state.customFeatures.filter((feature) => (feature.dependencies || []).includes(featureId));
    if (dependents.length) { setImpact("追加項目を削除できません", `${names(dependents.map((feature) => feature.id))}で使っているためです。`, true); return; }
    const feature = featureMap().get(featureId);
    state.customFeatures = state.customFeatures.filter((item) => item.id !== featureId);
    state.manual = state.manual.filter((id) => id !== featureId);
    state.excluded = state.excluded.filter((id) => id !== featureId);
    state.dependencyFocus = "project-management";
    setImpact(`${displayName(feature) || "追加項目"}を削除`, "この案件だけの項目を見積から削除しました。", true);
    renderAll();
  }

  function download(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    download(`${state.projectName || "案件"}-estimate.json`, JSON.stringify({ version: 3, ...state }, null, 2), "application/json");
  }

  function csvCell(value) {
    return `"${String(value).replaceAll('"', '""')}"`;
  }

  function exportCsv() {
    const map = featureMap();
    const rows = [
      ["案件名", state.projectName],
      ["顧客名", state.customerName || "未入力"],
      ["発行者", state.issuerName || "未入力"],
      ["見積番号", state.estimateNumber],
      ["作成日", state.createdAt],
      ["有効期限", state.validUntil],
      ["金額区分", "参考概算・消費税別"],
      ["価格マスタ", `${Catalog.priceMasterMeta.name}（${Catalog.priceMasterMeta.createdAt}）`],
      ["1人の月間作業時間", state.hoursPerMonth],
      ["年間保守費目安", `機能単価合計の${Catalog.priceMasterMeta.maintenanceRate}%前後・別途`],
      ["前提・除外事項・ヒアリングメモ", state.notes || "未入力"],
      [],
      ["項目番号", "状態", "分類", "見積項目", "技術名", "価格表の対応項目", "規模", "価格状態", "参考工数", "固定単価（消費税別）"],
    ];
    [...selection.selected].forEach((id) => {
      const feature = map.get(id);
      if (!feature) return;
      const metrics = directFeatureMetrics(feature);
      rows.push([itemNumber(feature), featureSource(id)?.label || "一緒に必要", Catalog.plainLayers[feature.layer] || feature.layer, displayName(feature), technicalName(feature), feature.priceSourceName, feature.priceSize, isTemporaryPrice(feature) ? "仮0円・要確認" : "価格マスタ", metrics.hours, metrics.cost]);
    });
    rows.push(
      [],
      ["", "機能単価合計（消費税別）", "", "", "", "", "", "", estimate.baseHours, estimate.totalCost],
      ["", "年間保守費目安（10%・別途）", "", "", "", "", "", "", "", maintenanceEstimate()],
    );
    download(`${state.projectName || "案件"}-estimate.csv`, `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`, "text/csv;charset=utf-8");
  }

  function importJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object") throw new Error("invalid data");
        if (!window.confirm(`現在の案件「${state.projectName}」を、読込ファイルの内容で置き換えますか？\n必要なら先に「案件保存」でバックアップしてください。`)) return;
        const base = defaultState();
        const keepAutoSave = state.autoSave;
        state = {
          ...base,
          ...parsed,
          manual: Array.isArray(parsed.manual) ? parsed.manual : [],
          answers: Array.isArray(parsed.answers) ? parsed.answers : [],
          excluded: Array.isArray(parsed.excluded) ? parsed.excluded : [],
          customFeatures: normalizeCustomFeatures(parsed.customFeatures),
          profileRates: base.profileRates,
          contingencies: { company: Number(parsed.contingencies?.company ?? base.contingencies.company) },
          profile: "company",
          autoSave: keepAutoSave,
          estimateNumber: String(parsed.estimateNumber || base.estimateNumber),
          createdAt: String(parsed.createdAt || base.createdAt),
          validUntil: String(parsed.validUntil || base.validUntil),
        };
        renderQuestions();
        switchPage("estimate");
        setImpact("案件データを読み込みました", "見積項目、金額、メモを復元しました。");
        renderAll();
      } catch {
        setImpact("読込に失敗しました", "このアプリから保存したJSONファイルを選択してください。", true);
      }
    };
    reader.readAsText(file);
  }

  function requestEstimatePage() {
    const progress = questionProgress();
    if (progress.unanswered > 0 && !window.confirm(`未確認の質問が${progress.unanswered}問あります。参考精度が低い状態で見積画面へ進みますか？`)) return;
    switchPage("estimate");
  }

  function bindEvents() {
    document.querySelector(".page-nav").addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (button) button.dataset.page === "estimate" ? requestEstimatePage() : switchPage("interview");
    });
    document.querySelector(".page-nav").addEventListener("keydown", (event) => {
      if (!event.target.matches('[role="tab"]') || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const targetPage = event.target.dataset.page === "interview" ? "estimate" : "interview";
      const target = document.querySelector(`[data-page="${targetPage}"]`);
      target.focus();
      target.click();
    });
    el("go-estimate").addEventListener("click", requestEstimatePage);

    el("questions").addEventListener("change", (event) => {
      if (event.target.matches("[data-answer-key]")) toggleAnswer(event.target.dataset.answerKey, event.target.checked);
    });
    el("preset-buttons").addEventListener("click", (event) => {
      const button = event.target.closest("[data-preset]");
      if (button) applyPreset(button.dataset.preset);
    });
    el("clear-answers").addEventListener("click", () => {
      if (!state.answers.length) return;
      if (!window.confirm("ヒアリング回答だけをすべてクリアしますか？見積画面で直接選んだ項目は残ります。")) return;
      const before = compute();
      state.answers = [];
      renderQuestions();
      const after = compute();
      describeChange(before, after, "ヒアリング回答をクリア");
      renderAll();
    });

    el("feature-tree").addEventListener("change", (event) => {
      if (event.target.matches("[data-feature-toggle]")) setFeature(event.target.dataset.featureToggle, event.target.checked);
      if (event.target.matches("[data-branch-toggle]")) toggleBranch(event.target.dataset.branchToggle, event.target.checked);
    });
    el("feature-tree").addEventListener("click", (event) => {
      const focus = event.target.closest("[data-focus]");
      const remove = event.target.closest("[data-delete-custom]");
      if (focus) { state.dependencyFocus = focus.dataset.focus; renderDependencyInspector(); saveState(); }
      if (remove) deleteCustomFeature(remove.dataset.deleteCustom);
    });
    el("dependency-tree").addEventListener("change", (event) => {
      if (event.target.matches("[data-tree-toggle]")) setFeature(event.target.dataset.treeToggle, event.target.checked);
    });
    el("reverse-dependencies").addEventListener("click", (event) => {
      const focus = event.target.closest("[data-focus]");
      if (focus) { state.dependencyFocus = focus.dataset.focus; renderDependencyInspector(); saveState(); }
    });
    el("feature-search").addEventListener("input", renderFeatureTree);
    el("selected-only").addEventListener("change", renderFeatureTree);

    el("project-name").addEventListener("change", (event) => { state.projectName = event.target.value.trim() || "新規システム"; renderAll(); });
    el("customer-name").addEventListener("change", (event) => { state.customerName = event.target.value.trim(); renderAll(); });
    el("issuer-name").addEventListener("change", (event) => { state.issuerName = event.target.value.trim(); renderAll(); });
    el("auto-save").addEventListener("change", (event) => {
      state.autoSave = event.target.checked;
      saveState();
      setImpact(
        state.autoSave ? "この端末への自動保存を有効にしました" : "この端末の自動保存データを削除しました",
        state.autoSave ? "共有PCでは、利用後にオフへ戻すか案件を初期化してください。" : "現在の画面内容は残っています。必要なら案件保存でJSONをダウンロードしてください。",
        !state.autoSave,
      );
    });
    el("hours-per-month").addEventListener("change", (event) => { state.hoursPerMonth = Math.max(80, Math.min(200, Number(event.target.value || 160))); renderAll(); });
    el("project-notes").addEventListener("change", (event) => { state.notes = event.target.value; saveState(); });

    el("open-custom-dialog").addEventListener("click", openCustomDialog);
    ["close-custom-dialog", "cancel-custom"].forEach((id) => el(id).addEventListener("click", () => el("custom-dialog").close()));
    el("custom-feature-form").addEventListener("submit", createCustomFeature);
    el("custom-dependencies").addEventListener("change", (event) => {
      if (!event.target.matches('input[type="checkbox"]')) return;
      event.target.checked ? customDependencyDraft.add(event.target.value) : customDependencyDraft.delete(event.target.value);
    });
    el("custom-dependency-search").addEventListener("input", renderCustomDependencies);

    el("export-json").addEventListener("click", exportJson);
    el("export-csv").addEventListener("click", exportCsv);
    el("import-json").addEventListener("click", () => el("import-file").click());
    el("import-file").addEventListener("change", (event) => { if (event.target.files[0]) importJsonFile(event.target.files[0]); event.target.value = ""; });
    el("print-estimate").addEventListener("click", () => {
      document.querySelector(".estimate-details").open = true;
      window.print();
    });
    el("reset-project").addEventListener("click", () => {
      if (!window.confirm("案件名、回答、見積項目、単価をすべて初期化しますか？")) return;
      state = defaultState();
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_CONSENT_KEY);
      renderQuestions();
      switchPage("interview");
      renderAll();
    });
  }

  renderPresets();
  renderQuestions();
  renderCustomHours();
  renderCustomDependencies();
  bindEvents();
  switchPage(state.activePage);
  renderAll();
})();
