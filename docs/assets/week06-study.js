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
    gold: "#c99700"
  };
  const money = (value) => `C$${Number(value).toFixed(1)}B`;
  const cost = (value) => `C$${Number(value).toFixed(1)}k`;

  function renderAutoTrade() {
    const node = document.getElementById("study-auto-trade-chart");
    if (!node) return;
    Charts.horizontalBars(node, [
      { label: "Exports to U.S.", value: 67.791, color: colours.red, display: "C$67.8B" },
      { label: "Imports from U.S.", value: 72.973, color: colours.blue, display: "C$73.0B" }
    ], {
      title: "Canada–U.S. motor vehicles and parts trade, 2025",
      description: "Canadian auto exports and imports were similar in size, demonstrating substantial two-way trade.",
      xLabel: "Current C$ billions",
      domain: [0, 80],
      height: 260,
      valueFormat: money
    });
  }

  function updateAverageCost() {
    const fixedCost = 600;
    const marginalCost = 30;
    const output = Number(document.getElementById("study-output")?.value || 60);
    const outputLabel = document.getElementById("study-output-value");
    const result = document.getElementById("study-average-cost-result");
    const working = document.getElementById("study-average-cost-working");
    const node = document.getElementById("study-average-cost-chart");

    if (outputLabel) outputLabel.value = `${output.toLocaleString()},000`;
    if (result) result.textContent = cost(marginalCost + fixedCost / output);
    if (working) working.textContent = `${marginalCost} + ${fixedCost} ÷ ${output} = ${(marginalCost + fixedCost / output).toFixed(1)}`;
    if (!node) return;

    const values = [];
    for (let q = 10; q <= 250; q += 10) {
      values.push({
        x: q,
        y: marginalCost + fixedCost / q,
        label: `${q},000 vehicles`,
        display: cost(marginalCost + fixedCost / q),
        detail: `Fixed cost per vehicle is C$${(fixedCost / q).toFixed(1)}k.`
      });
    }
    Charts.lineChart(node, [{ label: "Average cost", color: colours.green, values }], {
      title: "Average cost falls as output spreads fixed cost",
      description: "With a fixed cost of 600 million dollars and marginal cost of 30 thousand dollars, average cost falls toward 30 thousand dollars as vehicle output rises.",
      xLabel: "Output (thousand vehicles)",
      yLabel: "Average cost (C$000 per vehicle)",
      xDomain: [0, 250],
      yDomain: [0, 100],
      xFormat: (value) => Number(value).toFixed(0),
      yFormat: (value) => Number(value).toFixed(0),
      valueFormat: cost,
      pointRadius: 3,
      referenceLines: [
        { y: marginalCost, label: "marginal cost = C$30k", color: colours.blue },
        { x: output, label: `q = ${output}k`, color: colours.red }
      ]
    });
  }

  document.getElementById("study-output")?.addEventListener("input", updateAverageCost);
  renderAutoTrade();
  updateAverageCost();
})();
