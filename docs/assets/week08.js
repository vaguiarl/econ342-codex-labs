(() => {
  "use strict";

  const Charts = window.EconCharts;
  const byId = (id) => document.getElementById(id);
  const colours = {
    red: "#a6192e",
    blue: "#3d6f8e",
    green: "#3f7d6a",
    gold: "#c99700",
    grey: "#8b9aa2"
  };

  const pct = (value, digits = 1) => `${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(digits)}%`;
  const plainPct = (value) => `${Number(value).toFixed(0)}%`;
  const ratioAxis = (value) => {
    const ratio = 2 ** Number(value);
    if (Math.abs(Number(value)) < 0.001) return "1×";
    return `${ratio < 1 ? ratio.toFixed(2) : ratio.toFixed(1)}×`;
  };

  const fallback = (id) => {
    const node = byId(id);
    if (!node) return;
    node.innerHTML = "<p class='chart-error'>The chart could not load. Reload the page or use the values printed beside it.</p>";
  };

  function renderSpecialization() {
    const node = byId("ho-specialization-chart");
    if (!node || !Charts) return;
    const rows = [
      ["Fertilizers", 6.1944, 1.6828, 0.2717],
      ["Wood", 5.0186, 2.3634, 0.4709],
      ["Aluminum", 3.1405, 2.2214, 0.7073],
      ["Cereals", 1.7119, 1.9798, 1.1565],
      ["Mineral fuels", 1.5740, 25.2001, 16.0101],
      ["Vehicles", 1.4762, 11.1764, 7.5711],
      ["Machinery", 0.6476, 7.4755, 11.5435],
      ["Electrical equipment", 0.2838, 2.8216, 9.9406]
    ];
    Charts.horizontalBars(node, rows.map(([label, ratio, canada, us]) => ({
      label,
      value: Math.log2(ratio),
      display: `${ratio.toFixed(2)}×`,
      color: ratio >= 1 ? colours.red : colours.blue,
      detail: `${label}: ${canada.toFixed(2)}% of Canada's export basket and ${us.toFixed(2)}% of the U.S. basket. The displayed ratio is ${ratio.toFixed(2)}.`
    })), {
      title: "Selected product shares in Canada's export basket relative to the United States",
      description: "Values above one indicate greater prominence in Canada's merchandise-export basket. The horizontal scale uses logarithmic spacing.",
      xLabel: "Canada export share ÷ U.S. export share (log₂ spacing)",
      domain: [-2.4, 3],
      axisFormat: ratioAxis,
      leftMargin: 205,
      rightMargin: 90,
      rowHeight: 38,
      labelSize: 17
    });
  }

  function renderTrefler() {
    const node = byId("trefler-chart");
    if (!node || !Charts) return;
    Charts.horizontalBars(node, [
      { label: "Employment", value: -12, display: "−12%", color: colours.red, detail: "Industries with the deepest Canadian tariff cuts." },
      { label: "Industry labour productivity", value: 15, display: "+15%", color: colours.green, detail: "Industries with the deepest Canadian tariff cuts." },
      { label: "Plant labour productivity", value: 14, display: "+14%", color: colours.blue, detail: "Industries with the largest U.S. tariff cuts." }
    ], {
      title: "Adjustment and productivity after the Canada–U.S. FTA",
      description: "Estimated changes for the most exposed Canadian manufacturing industries. The three bars refer to two different tariff-exposure measures.",
      xLabel: "Estimated percentage change",
      domain: [-16, 20],
      axisFormat: (value) => `${Number(value).toFixed(0)}%`,
      leftMargin: 245,
      rightMargin: 90,
      rowHeight: 60,
      labelSize: 17
    });
  }

  function renderRecentExposure() {
    const node = byId("recent-exposure-chart");
    if (!node || !Charts) return;
    Charts.horizontalBars(node, [
      { label: "Industries highly dependent on U.S. demand", value: -1.4, display: "−1.4%", color: colours.red },
      { label: "Less-dependent industries", value: 0.2, display: "+0.2%", color: colours.green },
      { label: "Motor-vehicle-parts manufacturing", value: -7.8, display: "−7.8%", color: colours.blue, detail: "A decline of 5,600 payroll jobs." }
    ], {
      title: "Payroll employment change, December 2024 to August 2025",
      description: "Recent Canadian employment losses were concentrated in industries exposed to U.S. demand. These descriptive changes are not a clean causal tariff estimate.",
      xLabel: "Cumulative payroll-employment change",
      domain: [-9.5, 2],
      axisFormat: (value) => `${Number(value).toFixed(1)}%`,
      leftMargin: 330,
      rightMargin: 90,
      rowHeight: 62,
      labelSize: 16
    });
  }

  function renderAttitudes() {
    const node = byId("attitudes-chart");
    if (!node || !Charts) return;
    Charts.horizontalBars(node, [
      { label: "Bad for Canada", value: 59, display: "59%", color: colours.green },
      { label: "Neither", value: 18, display: "18%", color: colours.blue },
      { label: "Good for Canada", value: 17, display: "17%", color: colours.red },
      { label: "Do not know / no response", value: 6, display: "6%", color: colours.grey }
    ], {
      title: "Views of growing protectionism, February 2021",
      description: "Share of respondents who considered growing protectionism a good thing, a bad thing, or neither for Canada.",
      xLabel: "Share of respondents",
      domain: [0, 70],
      axisFormat: plainPct,
      valueFormat: plainPct,
      leftMargin: 235,
      rowHeight: 54,
      labelSize: 17
    });
  }

  function setText(id, value) {
    const node = byId(id);
    if (node) node.textContent = value;
  }

  function updateFactorPrices() {
    const input = byId("grain-price");
    if (!input) return;
    const grainPrice = Number(input.value);
    const apparelPrice = 6;
    const rent = (2 * grainPrice - apparelPrice) / 3;
    const wage = (2 * apparelPrice - grainPrice) / 3;
    const rentChange = ((rent - 2) / 2) * 100;
    const wageChange = ((wage - 2) / 2) * 100;
    setText("grain-price-value", grainPrice.toFixed(1));
    setText("land-rent-result", rent.toFixed(2));
    setText("wage-result", wage.toFixed(2));
    setText("land-rent-change", pct(rentChange));
    setText("wage-change", pct(wageChange));
    setText("wage-grain-result", (wage / grainPrice).toFixed(3));
    setText("wage-apparel-result", (wage / apparelPrice).toFixed(3));
  }

  function updateSpecificFactors() {
    const input = byId("resource-price");
    if (!input) return;
    const price = Number(input.value);
    const labourR = (20 * price - 6) / (0.2 * price + 0.1);
    const boundedR = Math.max(0, Math.min(100, labourR));
    const labourM = 100 - boundedR;
    const wage = 6 + 0.1 * boundedR;
    const baselineLabourR = 46.6666667;
    const baselineWage = 10.6666667;
    setText("resource-price-value", price.toFixed(2));
    setText("resource-labour-result", boundedR.toFixed(1));
    setText("manufacturing-labour-result", labourM.toFixed(1));
    setText("specific-wage-result", wage.toFixed(2));
    setText("specific-wage-change", pct(((wage - baselineWage) / baselineWage) * 100));
    setText("specific-labour-shift", (boundedR - baselineLabourR).toFixed(1));
    setText("resource-real-wage", (wage / price).toFixed(2));
  }

  let abundanceFrame = 0;
  let abundancePlaying = false;
  let abundancePaused = false;
  const abundanceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function abundanceTradeText(ratio) {
    if (ratio > 1.005) {
      return "Home is relatively land abundant. H–O predicts grain exports and apparel imports.";
    }
    if (ratio < 0.995) {
      return "Home is relatively labour abundant. H–O predicts apparel exports and grain imports.";
    }
    return "Home and partner have the same factor ratio. H–O alone gives no clear trade direction.";
  }

  function updateAbundance(announce = false) {
    const input = byId("abundance-ratio");
    if (!input) return;

    const ratio = Math.max(0.5, Math.min(2, Number(input.value)));
    const grain = Math.max(0, 20 * ratio - 10);
    const apparel = Math.max(0, 40 - 20 * ratio);
    const maximumOutput = 30;
    const grainWidth = Math.max(0, Math.min(100, (grain / maximumOutput) * 100));
    const apparelWidth = Math.max(0, Math.min(100, (apparel / maximumOutput) * 100));
    const grainBar = byId("abundance-grain-bar");
    const apparelBar = byId("abundance-apparel-bar");
    const bars = byId("abundance-bars");
    const tradeResult = byId("abundance-trade-result");
    const tradeBox = tradeResult?.closest(".abundance-trade-result");
    const productionResult = byId("abundance-production-result");

    setText("abundance-ratio-value", ratio.toFixed(2));
    setText("abundance-grain-value", grain.toFixed(1));
    setText("abundance-apparel-value", apparel.toFixed(1));

    if (grainBar) {
      grainBar.style.width = `${grainWidth}%`;
      grainBar.setAttribute("aria-valuenow", grain.toFixed(1));
      grainBar.setAttribute("aria-label", `Grain output ${grain.toFixed(1)} teaching units`);
    }
    if (apparelBar) {
      apparelBar.style.width = `${apparelWidth}%`;
      apparelBar.setAttribute("aria-valuenow", apparel.toFixed(1));
      apparelBar.setAttribute("aria-label", `Apparel output ${apparel.toFixed(1)} teaching units`);
    }

    const tradeText = abundanceTradeText(ratio);
    if (tradeResult) {
      tradeResult.textContent = tradeText;
      tradeBox?.setAttribute("data-state", ratio > 1.005 ? "land" : ratio < 0.995 ? "labour" : "equal");
    }
    if (productionResult) {
      const outputDifference = Math.abs(20 * (ratio - 1));
      productionResult.textContent = ratio > 1.005
        ? `Relative to the partner, grain output is ${outputDifference.toFixed(1)} units higher and apparel output is ${outputDifference.toFixed(1)} units lower.`
        : ratio < 0.995
          ? `Relative to the partner, grain output is ${outputDifference.toFixed(1)} units lower and apparel output is ${outputDifference.toFixed(1)} units higher.`
          : "At the partner ratio, home and partner produce the same mix in this teaching model.";
    }

    const summary = `At land per worker ${ratio.toFixed(2)}, grain output is ${grain.toFixed(1)} and apparel output is ${apparel.toFixed(1)} teaching units. ${tradeText}`;
    bars?.setAttribute("aria-label", summary);
    if (announce) setText("abundance-live", summary);

    document.querySelectorAll("[data-abundance-value]").forEach((button) => {
      const selected = Math.abs(Number(button.dataset.abundanceValue) - ratio) < 0.006;
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function stopAbundanceAnimation(announce = false, preservePosition = false) {
    if (abundanceFrame) cancelAnimationFrame(abundanceFrame);
    abundanceFrame = 0;
    abundancePlaying = false;
    abundancePaused = preservePosition;
    const button = byId("abundance-play");
    if (button) {
      button.textContent = "Play endowment change";
      button.setAttribute("aria-pressed", "false");
    }
    if (announce) updateAbundance(true);
  }

  function playAbundanceAnimation() {
    const input = byId("abundance-ratio");
    const button = byId("abundance-play");
    if (!input || !button) return;

    if (abundancePlaying) {
      stopAbundanceAnimation(true, true);
      return;
    }

    if (abundanceMotionQuery.matches) {
      abundancePaused = false;
      input.value = "1.75";
      updateAbundance(true);
      return;
    }

    const startRatio = abundancePaused ? Number(input.value) : 0.55;
    abundancePaused = false;
    input.value = startRatio.toFixed(2);
    updateAbundance(false);
    const endRatio = 1.85;
    const fullDuration = 4200;
    const duration = Math.max(900, fullDuration * ((endRatio - startRatio) / 1.3));
    const startTime = performance.now();
    abundancePlaying = true;
    button.textContent = "Pause endowment change";
    button.setAttribute("aria-pressed", "true");

    const step = (time) => {
      if (!abundancePlaying) return;
      const progress = Math.min(1, (time - startTime) / duration);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - ((-2 * progress + 2) ** 2) / 2;
      input.value = (startRatio + (endRatio - startRatio) * eased).toFixed(2);
      updateAbundance(false);
      if (progress < 1) {
        abundanceFrame = requestAnimationFrame(step);
      } else {
        stopAbundanceAnimation(true, false);
      }
    };

    abundanceFrame = requestAnimationFrame(step);
  }

  if (!Charts) {
    ["ho-specialization-chart", "trefler-chart", "recent-exposure-chart", "attitudes-chart"].forEach(fallback);
  } else {
    renderSpecialization();
    renderTrefler();
    renderRecentExposure();
    renderAttitudes();
  }

  byId("grain-price")?.addEventListener("input", updateFactorPrices);
  byId("resource-price")?.addEventListener("input", updateSpecificFactors);
  byId("abundance-ratio")?.addEventListener("input", () => {
    if (abundancePlaying) stopAbundanceAnimation(false, false);
    abundancePaused = false;
    updateAbundance(false);
  });
  byId("abundance-ratio")?.addEventListener("change", () => updateAbundance(true));
  document.querySelectorAll("[data-abundance-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = byId("abundance-ratio");
      if (!input) return;
      if (abundancePlaying) stopAbundanceAnimation(false, false);
      abundancePaused = false;
      input.value = button.dataset.abundanceValue;
      updateAbundance(true);
    });
  });
  byId("abundance-play")?.addEventListener("click", playAbundanceAnimation);
  updateFactorPrices();
  updateSpecificFactors();
  updateAbundance();
})();
