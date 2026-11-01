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
  updateFactorPrices();
  updateSpecificFactors();
})();
