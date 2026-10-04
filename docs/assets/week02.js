(() => {
  "use strict";

  const Charts = window.EconCharts;
  const byId = (id) => document.getElementById(id);
  const colours = {
    red: "#a6192e",
    blue: "#3d6f8e",
    green: "#3f7d6a",
    gold: "#c99700"
  };

  const specialization = [
    { label: "Fertilizers", ratio: 6.1944, canada: 1.6828, us: 0.2717 },
    { label: "Wood", ratio: 5.0186, canada: 2.3634, us: 0.4709 },
    { label: "Aluminum", ratio: 3.1405, canada: 2.2214, us: 0.7073 },
    { label: "Mineral fuels", ratio: 1.5740, canada: 25.2001, us: 16.0101 },
    { label: "Vehicles", ratio: 1.4762, canada: 11.1764, us: 7.5711 },
    { label: "Machinery", ratio: 0.6476, canada: 7.4755, us: 11.5435 },
    { label: "Pharmaceuticals", ratio: 0.3786, canada: 1.6940, us: 4.4739 },
    { label: "Aircraft", ratio: 0.3352, canada: 2.0742, us: 6.1881 },
    { label: "Electrical equipment", ratio: 0.2838, canada: 2.8216, us: 9.9406 },
    { label: "Precision instruments", ratio: 0.2798, canada: 1.4568, us: 5.2071 }
  ];

  const bilateral = {
    exports: {
      label: "Canadian domestic exports to the United States",
      rows: [
        ["Energy products", 171.8],
        ["Motor vehicles & parts", 75.6],
        ["Forestry products", 39.3],
        ["Industrial machinery", 32.0],
        ["Electrical equipment", 18.8]
      ]
    },
    imports: {
      label: "Canadian imports of United States origin",
      rows: [
        ["Motor vehicles & parts", 82.0],
        ["Industrial machinery", 42.1],
        ["Energy products", 29.1],
        ["Electrical equipment", 24.6],
        ["Forestry products", 23.3]
      ]
    }
  };

  const fallback = (id) => {
    const node = byId(id);
    if (!node) return;
    const message = document.createElement("p");
    message.className = "chart-error";
    message.textContent = "The chart could not load. Reload the page or use the key values printed beside it.";
    node.replaceChildren(message);
  };

  const ratioAxis = (value) => {
    const ratio = 2 ** Number(value);
    if (Math.abs(Number(value)) < 0.001) return "1×";
    return `${ratio < 1 ? ratio.toFixed(2) : ratio.toFixed(1)}×`;
  };

  function renderSpecialization() {
    const node = byId("specialization-chart");
    if (!node || !Charts) return;
    Charts.horizontalBars(node, specialization.map((row) => ({
      label: row.label,
      value: Math.log2(row.ratio),
      display: `${row.ratio.toFixed(2)}×`,
      color: row.ratio >= 1 ? colours.red : colours.blue,
      detail: `${row.label}: ${row.canada.toFixed(2)}% of Canada's export basket and ${row.us.toFixed(2)}% of the U.S. basket; relative specialization ${row.ratio.toFixed(2)}. Values are HS 2022 chapter shares for 2023.`
    })), {
      title: "Selected product shares in Canada's export basket relative to the United States",
      description: "Bars to the right of one indicate greater prominence in Canada's merchandise-export basket; bars to the left indicate greater prominence in the U.S. basket. The horizontal scale is logarithmic in the displayed ratio.",
      xLabel: "Canada export share ÷ U.S. export share (ratio; log₂ spacing)",
      domain: [-3, 3],
      axisFormat: ratioAxis,
      leftMargin: 225,
      rightMargin: 90,
      rowHeight: 35,
      labelSize: 17
    });
  }

  function renderPPF() {
    const node = byId("ppf-chart");
    if (!node || !Charts) return;
    Charts.lineChart(node, [
      {
        label: "Canada",
        color: colours.red,
        values: [
          { x: 0, y: 3, label: "0 lumber", display: "3 machinery", detail: "Canada uses all 24 hours to make machinery." },
          { x: 12, y: 0, label: "12 lumber", display: "0 machinery", detail: "Canada uses all 24 hours to make lumber." }
        ]
      },
      {
        label: "United States",
        color: colours.blue,
        values: [
          { x: 0, y: 8, label: "0 lumber", display: "8 machinery", detail: "The United States uses all 24 hours to make machinery." },
          { x: 24, y: 0, label: "24 lumber", display: "0 machinery", detail: "The United States uses all 24 hours to make lumber." }
        ]
      }
    ], {
      title: "Production possibility frontiers with 24 labour hours",
      description: "Canada's frontier runs from 3 machinery to 12 lumber and has slope minus one quarter. The United States frontier runs from 8 machinery to 24 lumber and has slope minus one third.",
      xLabel: "Lumber units",
      yLabel: "Machinery units",
      xDomain: [0, 24],
      yDomain: [0, 8.5],
      height: 450,
      xFormat: (value) => String(Math.round(value)),
      valueFormat: (value) => Number(value).toFixed(1),
      pointRadius: 7
    });
  }

  const setPressed = (selector, value, key) => {
    document.querySelectorAll(selector).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset[key] === value));
    });
  };

  function renderBilateral(mode = "exports") {
    const node = byId("bilateral-chart");
    const selected = bilateral[mode] || bilateral.exports;
    if (!node || !Charts) return;
    Charts.horizontalBars(node, selected.rows.map(([label, value]) => ({
      label,
      value,
      display: `C$${value.toFixed(1)}B`,
      color: mode === "exports" ? colours.red : colours.blue,
      detail: `${label}: C$${value.toFixed(1)} billion, ${selected.label.toLowerCase()}, 2024.`
    })), {
      title: `${selected.label}, 2024`,
      description: `${selected.label} for five selected product sections, measured in current Canadian dollars. Use the direction buttons to change the displayed flow.`,
      xLabel: "Current C$ billions",
      domain: [0, 190],
      valueFormat: (value) => `C$${Number(value).toFixed(0)}B`,
      leftMargin: 235,
      rowHeight: 41,
      labelSize: 17
    });
    setPressed("[data-bilateral-mode]", mode, "bilateralMode");
    const summary = document.querySelector("[data-bilateral-summary]");
    if (summary) {
      summary.textContent = mode === "exports"
        ? "Energy dominates the selected outward flows: C$171.8B of Canadian domestic exports to the United States."
        : "Motor vehicles and parts lead the selected inward flows: C$82.0B of imports classified as United States origin.";
    }
  }

  const techControls = {
    canL: byId("can-labour-l"),
    canM: byId("can-labour-m"),
    usL: byId("us-labour-l"),
    usM: byId("us-labour-m")
  };

  const readTechnology = () => ({
    canL: Number(techControls.canL?.value || 2),
    canM: Number(techControls.canM?.value || 8),
    usL: Number(techControls.usL?.value || 1),
    usM: Number(techControls.usM?.value || 3)
  });

  const setText = (id, value) => {
    const node = byId(id);
    if (node) node.textContent = value;
  };

  const fmtCost = (value) => {
    const magnitude = Math.abs(Number(value));
    return Number(value).toFixed(magnitude < 1 ? 3 : magnitude < 10 ? 2 : 1);
  };

  const absoluteHolder = (canadaHours, usHours, good) => {
    if (canadaHours < usHours) return `Canada in ${good}`;
    if (usHours < canadaHours) return `the United States in ${good}`;
    return `neither country in ${good} (tie)`;
  };

  function updateTechnology() {
    const tech = readTechnology();
    setText("can-labour-l-value", `${tech.canL} h`);
    setText("can-labour-m-value", `${tech.canM} h`);
    setText("us-labour-l-value", `${tech.usL} h`);
    setText("us-labour-m-value", `${tech.usM} h`);

    const canMachineCost = tech.canM / tech.canL;
    const usMachineCost = tech.usM / tech.usL;
    setText("can-machine-oc", `${fmtCost(canMachineCost)} L`);
    setText("us-machine-oc", `${fmtCost(usMachineCost)} L`);

    if (Math.abs(canMachineCost - usMachineCost) < 1e-9) {
      setText("comparative-result", "Equal relative costs");
      setText("comparative-detail", "No Ricardian trade direction");
    } else if (canMachineCost < usMachineCost) {
      setText("comparative-result", "CAN → machinery");
      setText("comparative-detail", "U.S. → lumber");
    } else {
      setText("comparative-result", "CAN → lumber");
      setText("comparative-detail", "U.S. → machinery");
    }

    const lumberHolder = absoluteHolder(tech.canL, tech.usL, "lumber");
    const machineHolder = absoluteHolder(tech.canM, tech.usM, "machinery");
    setText("absolute-result", `Absolute advantage: ${lumberHolder}; ${machineHolder}. Comparative advantage still comes from the ratios.`);
    updatePrice();
  }

  function updatePrice() {
    const priceInput = byId("machine-price");
    if (!priceInput) return;
    const tech = readTechnology();
    const canCost = tech.canM / tech.canL;
    const usCost = tech.usM / tech.usL;
    const low = Math.min(canCost, usCost);
    const high = Math.max(canCost, usCost);
    const exporter = canCost < usCost ? "Canada" : "The United States";
    const importer = canCost < usCost ? "the United States" : "Canada";

    const gap = high - low;
    const padding = Math.max(gap * 0.6, high < 1 ? 0.05 : 0.5);
    priceInput.min = String(Math.max(0, low - padding));
    priceInput.max = String(high + padding);
    priceInput.step = "0.001";

    // Updating a range input's bounds can clamp its value. Read the value only
    // after those bounds change so the displayed verdict cannot go stale.
    const price = Number(priceInput.value);
    setText("machine-price-value", `${fmtCost(price)} L`);
    setText("price-low", fmtCost(low));
    setText("price-current", fmtCost(price));
    setText("price-high", fmtCost(high));

    if (Math.abs(canCost - usCost) < 1e-9) {
      setText("price-verdict", "No cost gap");
      setText("price-explanation", "The two countries have equal relative costs, so this simple model has no interval that gives both sides a strict production-cost gain.");
    } else if (price > low && price < high) {
      setText("price-verdict", "Trade works");
      setText("price-explanation", `${exporter} can export machinery above its ${fmtCost(low)}-lumber domestic cost; ${importer} can import below its ${fmtCost(high)}-lumber domestic cost.`);
    } else if (Math.abs(price - low) < 1e-9 || Math.abs(price - high) < 1e-9) {
      setText("price-verdict", "One side is indifferent");
      setText("price-explanation", "At a domestic-cost endpoint, one country gets no strict cost saving. Mutual strict gains require a price inside the interval.");
    } else if (price < low) {
      setText("price-verdict", "Exporter rejects");
      setText("price-explanation", `${exporter} would receive less than its ${fmtCost(low)}-lumber domestic cost of making one machine.`);
    } else {
      setText("price-verdict", "Importer rejects");
      setText("price-explanation", `${importer} would pay more than its ${fmtCost(high)}-lumber domestic cost of making one machine.`);
    }
  }

  if (Charts) {
    renderSpecialization();
    renderPPF();
    renderBilateral();
  } else {
    ["specialization-chart", "ppf-chart", "bilateral-chart"].forEach(fallback);
  }

  Object.values(techControls).forEach((control) => control?.addEventListener("input", updateTechnology));
  byId("machine-price")?.addEventListener("input", updatePrice);
  document.querySelectorAll("[data-bilateral-mode]").forEach((button) => {
    button.addEventListener("click", () => renderBilateral(button.dataset.bilateralMode));
  });

  updateTechnology();
})();
