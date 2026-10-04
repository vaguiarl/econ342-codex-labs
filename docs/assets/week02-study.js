(() => {
  "use strict";

  const Charts = window.EconCharts;
  const byId = (id) => document.getElementById(id);
  const colours = { red: "#a6192e", blue: "#3d6f8e" };

  const specialization = [
    { label: "Fertilizers", ratio: 6.1944, canada: 1.6828, us: 0.2717 },
    { label: "Wood", ratio: 5.0186, canada: 2.3634, us: 0.4709 },
    { label: "Aluminum", ratio: 3.1405, canada: 2.2214, us: 0.7073 },
    { label: "Mineral fuels", ratio: 1.5740, canada: 25.2001, us: 16.0101 },
    { label: "Machinery", ratio: 0.6476, canada: 7.4755, us: 11.5435 },
    { label: "Electrical equipment", ratio: 0.2838, canada: 2.8216, us: 9.9406 },
    { label: "Precision instruments", ratio: 0.2798, canada: 1.4568, us: 5.2071 }
  ];

  const fallback = (id) => {
    const node = byId(id);
    if (!node) return;
    const message = document.createElement("p");
    message.className = "chart-error";
    message.textContent = "The chart could not load. Reload the page or use the key values printed on the slide.";
    node.replaceChildren(message);
  };

  const ratioAxis = (value) => {
    const ratio = 2 ** Number(value);
    if (Math.abs(Number(value)) < 0.001) return "1×";
    return `${ratio < 1 ? ratio.toFixed(2) : ratio.toFixed(1)}×`;
  };

  function renderPPF() {
    const node = byId("study-ppf-chart");
    if (!node || !Charts) return;
    Charts.lineChart(node, [
      {
        label: "Canada",
        color: colours.red,
        values: [
          { x: 0, y: 3, label: "0 lumber", display: "3 machinery" },
          { x: 12, y: 0, label: "12 lumber", display: "0 machinery" }
        ]
      },
      {
        label: "United States",
        color: colours.blue,
        values: [
          { x: 0, y: 8, label: "0 lumber", display: "8 machinery" },
          { x: 24, y: 0, label: "24 lumber", display: "0 machinery" }
        ]
      }
    ], {
      title: "Production possibility frontiers with 24 labour hours",
      description: "Canada's frontier has slope minus one quarter and the United States frontier has slope minus one third. Focus an endpoint to hear its value.",
      xLabel: "Lumber units",
      yLabel: "Machinery units",
      xDomain: [0, 24],
      yDomain: [0, 8.5],
      xFormat: (value) => String(Math.round(value)),
      valueFormat: (value) => Number(value).toFixed(1),
      pointRadius: 7
    });
  }

  function renderSpecialization() {
    const node = byId("study-specialization-chart");
    if (!node || !Charts) return;
    Charts.horizontalBars(node, specialization.map((row) => ({
      label: row.label,
      value: Math.log2(row.ratio),
      display: `${row.ratio.toFixed(2)}×`,
      color: row.ratio >= 1 ? colours.red : colours.blue,
      detail: `${row.label}: ${row.canada.toFixed(2)}% of Canada's export basket and ${row.us.toFixed(2)}% of the U.S. basket; ratio ${row.ratio.toFixed(2)}. HS 2022 chapter data for 2023.`
    })), {
      title: "Selected product shares in Canada's export basket relative to the United States",
      description: "Crimson bars indicate categories more prominent in Canada's basket and blue bars indicate categories more prominent in the U.S. basket. The horizontal spacing is logarithmic in the ratio.",
      xLabel: "Canada export share ÷ U.S. export share (ratio; log₂ spacing)",
      domain: [-3, 3],
      axisFormat: ratioAxis,
      leftMargin: 225,
      rightMargin: 90,
      rowHeight: 46,
      labelSize: 17
    });
  }

  function updatePrice() {
    const input = byId("study-machine-price");
    if (!input) return;
    const price = Number(input.value);
    byId("study-machine-price-value").textContent = `${price.toFixed(1)} L`;

    if (price > 3 && price < 4) {
      byId("study-price-verdict").textContent = "Both gain";
      byId("study-price-explanation").textContent = "The U.S. sells above its 3-lumber domestic cost; Canada buys below its 4-lumber domestic cost.";
    } else if (Math.abs(price - 3) < 1e-9 || Math.abs(price - 4) < 1e-9) {
      byId("study-price-verdict").textContent = "One is indifferent";
      byId("study-price-explanation").textContent = "At a domestic-cost endpoint, one side receives no strict cost saving. Strict gains for both require 3 < price < 4.";
    } else if (price < 3) {
      byId("study-price-verdict").textContent = "U.S. rejects";
      byId("study-price-explanation").textContent = "The U.S. would receive less than the 3 lumber it gives up to make one machine.";
    } else {
      byId("study-price-verdict").textContent = "Canada rejects";
      byId("study-price-explanation").textContent = "Canada would pay more than the 4 lumber it gives up to make one machine itself.";
    }
  }

  if (Charts) {
    renderPPF();
    renderSpecialization();
  } else {
    ["study-ppf-chart", "study-specialization-chart"].forEach(fallback);
  }

  byId("study-machine-price")?.addEventListener("input", updatePrice);
  updatePrice();
})();
