(() => {
  "use strict";

  const Charts = window.EconCharts;
  if (!Charts) {
    document.querySelectorAll(".chart").forEach((node) => {
      node.innerHTML = "<p class='chart-error'>The interactive chart could not load. Reload the page or use the values printed beside it.</p>";
    });
    return;
  }

  const colours = {
    red: "#a6192e",
    blue: "#3d6f8e",
    green: "#3f7d6a",
    gold: "#c99700",
    slate: "#2f4858",
    grey: "#8b9aa2"
  };

  const autoTrade = [
    { label: "Exports to U.S.", value: 67.791, color: colours.red },
    { label: "Imports from U.S.", value: 72.973, color: colours.blue }
  ];

  const productFlows = [
    { label: "Plastic resins", exports: 7.67, imports: 7.65 },
    { label: "Aerospace equipment", exports: 9.34, imports: 8.92 },
    { label: "Passenger vehicles", exports: 48.33, imports: 36.32 },
    { label: "Vehicle engines & parts", exports: 22.00, imports: 30.52 },
    { label: "Crude oil & bitumen", exports: 143.79, imports: 15.42 },
    { label: "Unwrought aluminum", exports: 10.66, imports: 0.34 }
  ];

  const chartNode = (id) => document.getElementById(id);
  const formatBillions = (value) => `C$${Number(value).toFixed(1)}B`;
  const formatThousands = (value) => `C$${Number(value).toFixed(1)}k`;
  const glIndex = (exportsValue, importsValue) => {
    const total = exportsValue + importsValue;
    return total === 0 ? 0 : 1 - Math.abs(exportsValue - importsValue) / total;
  };

  function renderAutoTrade() {
    const node = chartNode("auto-trade-chart");
    if (!node) return;
    Charts.horizontalBars(node, autoTrade.map((row) => ({
      ...row,
      display: formatBillions(row.value),
      detail: `${row.label}: ${formatBillions(row.value)}, motor vehicles and parts, 2025`
    })), {
      title: "Canada–U.S. motor vehicles and parts trade, 2025",
      description: "Canadian exports and imports are both close to 70 billion Canadian dollars, indicating substantial two-way trade.",
      xLabel: "Current C$ billions",
      domain: [0, 80],
      height: 260,
      valueFormat: formatBillions
    });
  }

  function renderProductGL() {
    const node = chartNode("product-gl-chart");
    if (!node) return;
    Charts.horizontalBars(node, productFlows.map((row) => {
      const value = glIndex(row.exports, row.imports);
      return {
        label: row.label,
        value,
        display: value.toFixed(3),
        color: value >= 0.8 ? colours.green : value >= 0.4 ? colours.gold : colours.red,
        detail: `${row.label}: exports ${formatBillions(row.exports)}, imports ${formatBillions(row.imports)}, GL ${value.toFixed(3)}`
      };
    }), {
      title: "Selected product-level two-way trade with the United States, 2024",
      description: "Indices near one indicate similarly sized export and import flows; indices near zero indicate mostly one-way trade.",
      xLabel: "Grubel–Lloyd index (0 = one-way; 1 = balanced two-way)",
      domain: [0, 1],
      axisFormat: (value) => Number(value).toFixed(1),
      valueFormat: (value) => Number(value).toFixed(3),
      rowHeight: 43,
      height: 430
    });
  }

  function updateStressScenario(scenario = "integrated") {
    const output = scenario === "domestic" ? 35.4 : 150;
    const averageCost = 30 + 600 / output;
    const baselineCost = 34;
    const outputNode = document.getElementById("stress-output");
    const costNode = document.getElementById("stress-cost");
    const summaryNode = document.getElementById("stress-summary");
    const demandNode = document.getElementById("stress-demand");
    const chainOutputNode = document.getElementById("stress-output-chain");
    const fixedUnitNode = document.getElementById("stress-fixed-unit");
    const chainCostNode = document.getElementById("stress-cost-chain");
    if (outputNode) outputNode.textContent = `${Math.round(output * 1000).toLocaleString()}`;
    if (costNode) costNode.textContent = formatThousands(averageCost);
    if (demandNode) demandNode.textContent = scenario === "domestic" ? "23.6% remains" : "100% baseline";
    if (chainOutputNode) chainOutputNode.textContent = `${Math.round(output * 1000).toLocaleString()}`;
    if (fixedUnitNode) fixedUnitNode.textContent = formatThousands(600 / output);
    if (chainCostNode) chainCostNode.textContent = formatThousands(averageCost);
    if (summaryNode) summaryNode.textContent = scenario === "domestic"
      ? `Mechanical illustration: average cost rises ${((averageCost / baselineCost - 1) * 100).toFixed(1)}%. This is not a forecast.`
      : "Baseline integrated-market illustration.";
    document.querySelectorAll("[data-stress-scenario]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.stressScenario === scenario));
    });
  }

  function updateAverageCost() {
    const fixedCost = Number(document.getElementById("fixed-cost")?.value || 600);
    const marginalCost = Number(document.getElementById("marginal-cost")?.value || 30);
    const output = Number(document.getElementById("model-output")?.value || 60);
    const fixedOutput = document.getElementById("fixed-cost-value");
    const marginalOutput = document.getElementById("marginal-cost-value");
    const quantityOutput = document.getElementById("model-output-value");
    const result = document.getElementById("average-cost-result");
    const node = chartNode("average-cost-chart");

    if (fixedOutput) fixedOutput.value = `C$${fixedCost}M`;
    if (marginalOutput) marginalOutput.value = `C$${marginalCost}k`;
    if (quantityOutput) quantityOutput.value = `${output.toLocaleString()},000`;
    if (result) result.textContent = formatThousands(marginalCost + fixedCost / output);
    if (!node) return;

    const quantities = [];
    for (let q = 10; q <= 250; q += 10) quantities.push(q);
    const values = quantities.map((q) => ({
      x: q,
      y: marginalCost + fixedCost / q,
      label: `${q.toLocaleString()},000 vehicles`,
      display: formatThousands(marginalCost + fixedCost / q),
      detail: `At ${q.toLocaleString()},000 vehicles, fixed cost per vehicle is C$${(fixedCost / q).toFixed(1)}k.`
    }));
    const maximum = Math.ceil(Math.max(...values.map((point) => point.y)) / 10) * 10;

    Charts.lineChart(node, [{
      label: "Average cost",
      color: colours.green,
      values
    }], {
      title: `Average cost when F = C$${fixedCost}M and c = C$${marginalCost}k`,
      description: "Average cost declines as output spreads fixed cost across more vehicles and approaches marginal cost from above.",
      xLabel: "Output (thousand vehicles)",
      yLabel: "Average cost (C$000 per vehicle)",
      xDomain: [0, 250],
      yDomain: [0, maximum],
      xFormat: (value) => Number(value).toFixed(0),
      yFormat: (value) => Number(value).toFixed(0),
      valueFormat: formatThousands,
      pointRadius: 3,
      referenceLines: [
        { y: marginalCost, label: `marginal cost = C$${marginalCost}k`, color: colours.blue },
        { x: output, label: `q = ${output}k`, color: colours.red }
      ]
    });
  }

  document.querySelectorAll("[data-stress-scenario]").forEach((button) => {
    button.addEventListener("click", () => updateStressScenario(button.dataset.stressScenario));
  });
  ["fixed-cost", "marginal-cost", "model-output"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateAverageCost);
  });

  renderAutoTrade();
  renderProductGL();
  updateStressScenario();
  updateAverageCost();
})();
