(function attachEstimateEngine(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.EstimateEngine = api;
})(typeof window !== "undefined" ? window : null, function createEstimateEngine() {
  const ROLES = ["planning", "design", "frontend", "backend", "data", "infra", "qa", "pm"];

  function asMap(catalog) {
    return new Map(catalog.map((feature) => [feature.id, feature]));
  }

  function validateCatalog(catalog) {
    const map = asMap(catalog);
    const errors = [];
    for (const feature of catalog) {
      if (!feature.id || !feature.name) errors.push("IDまたは名称がない機能があります");
      for (const dependencyId of feature.dependencies || []) {
        if (!map.has(dependencyId)) errors.push(`${feature.name}: 依存先 ${dependencyId} がありません`);
      }
      for (const role of ROLES) {
        const value = Number(feature.hours?.[role] || 0);
        if (!Number.isFinite(value) || value < 0) errors.push(`${feature.name}: ${role} の工数が不正です`);
      }
    }
    return errors;
  }

  function computeSelection(catalog, directIds) {
    const map = asMap(catalog);
    const direct = new Set([...directIds].filter((id) => map.has(id)));
    const selected = new Set();
    const requiredBy = new Map();
    const cycles = [];

    function addRequiredBy(id, parentId) {
      if (!requiredBy.has(id)) requiredBy.set(id, new Set());
      if (parentId) requiredBy.get(id).add(parentId);
    }

    function visit(id, parentId, path) {
      const feature = map.get(id);
      if (!feature) return;
      addRequiredBy(id, parentId);
      if (path.includes(id)) {
        cycles.push([...path, id]);
        return;
      }
      if (selected.has(id)) return;
      selected.add(id);
      for (const dependencyId of feature.dependencies || []) {
        visit(dependencyId, id, [...path, id]);
      }
    }

    for (const id of direct) visit(id, null, []);

    return {
      direct,
      selected,
      automatic: new Set([...selected].filter((id) => !direct.has(id))),
      requiredBy,
      cycles,
    };
  }

  function additionImpact(catalog, directIds, featureId) {
    const before = computeSelection(catalog, directIds);
    const afterDirect = new Set(directIds);
    afterDirect.add(featureId);
    const after = computeSelection(catalog, afterDirect);
    return {
      added: [...after.selected].filter((id) => !before.selected.has(id)),
      selection: after,
    };
  }

  function removalImpact(catalog, directIds, featureId) {
    const before = computeSelection(catalog, directIds);
    const afterDirect = new Set(directIds);
    afterDirect.delete(featureId);
    const after = computeSelection(catalog, afterDirect);
    return {
      removed: [...before.selected].filter((id) => !after.selected.has(id)),
      kept: [...before.selected].filter((id) => after.selected.has(id)),
      selection: after,
    };
  }

  function dependencyTree(catalog, featureId) {
    const map = asMap(catalog);
    function walk(id, path) {
      const feature = map.get(id);
      if (!feature) return null;
      if (path.includes(id)) return { id, name: feature.name, cycle: true, children: [] };
      return {
        id,
        name: feature.name,
        layer: feature.layer,
        children: (feature.dependencies || []).map((dep) => walk(dep, [...path, id])).filter(Boolean),
      };
    }
    return walk(featureId, []);
  }

  function reverseDependents(catalog, selectedIds, featureId) {
    const selected = new Set(selectedIds);
    return catalog
      .filter((feature) => selected.has(feature.id) && (feature.dependencies || []).includes(featureId))
      .map((feature) => feature.id);
  }

  function setBranchSelection(selectedIds, branchIds, checked) {
    const next = new Set(selectedIds);
    for (const id of branchIds) checked ? next.add(id) : next.delete(id);
    return next;
  }

  function calculateEstimate(catalog, selectedIds, rates, contingencyPercent) {
    const map = asMap(catalog);
    const roleHours = Object.fromEntries(ROLES.map((role) => [role, 0]));
    const featureRows = [];

    for (const id of selectedIds) {
      const feature = map.get(id);
      if (!feature) continue;
      let featureHours = 0;
      let featureCost = 0;
      for (const role of ROLES) {
        const hours = Number(feature.hours?.[role] || 0);
        const rate = Number(rates[role] || 0);
        roleHours[role] += hours;
        featureHours += hours;
        featureCost += hours * rate;
      }
      featureRows.push({ id, hours: featureHours, cost: featureCost });
    }

    const baseHours = Object.values(roleHours).reduce((sum, value) => sum + value, 0);
    const baseCost = ROLES.reduce((sum, role) => sum + roleHours[role] * Number(rates[role] || 0), 0);
    const multiplier = 1 + Math.max(0, Number(contingencyPercent || 0)) / 100;
    return {
      roleHours,
      baseHours,
      baseCost,
      totalCost: Math.round(baseCost * multiplier),
      contingencyCost: Math.round(baseCost * (multiplier - 1)),
      featureRows,
    };
  }

  function calculateDurationMonths(hours, hoursPerMonth, teamSize = 3.25) {
    const totalHours = Math.max(0, Number(hours || 0));
    const monthlyHours = Math.max(1, Number(hoursPerMonth || 0));
    const people = Math.max(1, Number(teamSize || 0));
    if (!totalHours) return 0;
    return Math.max(1, Math.ceil(totalHours / (monthlyHours * people)));
  }

  return {
    ROLES,
    validateCatalog,
    computeSelection,
    additionImpact,
    removalImpact,
    dependencyTree,
    reverseDependents,
    setBranchSelection,
    calculateEstimate,
    calculateDurationMonths,
  };
});
