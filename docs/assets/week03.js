(() => {
  "use strict";

  const Charts = window.EconCharts;
  const colours = {
    red: "#a6192e",
    blue: "#3d6f8e",
    green: "#3f7d6a",
    gold: "#c99700",
    slate: "#2f4858"
  };

  const specialization = {
    canada: [
      ["Fertilizers", 6.1944],
      ["Ores", 5.0190],
      ["Wood", 5.0186],
      ["Fish", 3.8440],
      ["Nickel", 3.7691],
      ["Aluminum", 3.1405],
      ["Wood pulp", 2.2460]
    ],
    us: [
      ["Machinery", 0.6476],
      ["Pharmaceuticals", 0.3786],
      ["Aircraft", 0.3352],
      ["Electrical equipment", 0.2838],
      ["Precision & medical instruments", 0.2798]
    ]
  };

  const candidates = {
    "8537": { label: "Electrical control panels", density: 0.2639927, pci: 0.7587, rca: 0.9422, exports: 2.2154, color: colours.red },
    "8607": { label: "Rail parts", density: 0.2585315, pci: 0.9876, rca: 0.6039, exports: 0.1916, color: colours.blue },
    "8421": { label: "Filtering machinery", density: 0.2409738, pci: 0.8432, rca: 0.7309, exports: 1.6412, color: colours.green },
    "3822": { label: "Diagnostic reagents", density: 0.2387887, pci: 1.1803, rca: 0.6884, exports: 0.5513, color: colours.gold },
    "8526": { label: "Radar/navigation equipment", density: 0.2329826, pci: 0.7997, rca: 0.9401, exports: 0.5129, color: colours.slate }
  };

  const setPressed = (selector, active, dataKey) => {
    document.querySelectorAll(selector).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset[dataKey] === active));
    });
  };

  const formatMoney = (billions) => billions >= 1
    ? `US$${billions.toFixed(2)}B`
    : `US$${Math.round(billions * 1000)}M`;

  function renderSpecialization(mode = "canada") {
    const node = document.getElementById("relative-specialization-chart");
    if (!node || !Charts) return;
    const rows = specialization[mode].map(([label, ratio]) => ({
      label,
      value: Math.log2(ratio),
      display: `${ratio.toFixed(2)}×`,
      color: ratio >= 1 ? colours.red : colours.slate,
      detail: `${label}'s share of Canadian merchandise exports was ${ratio.toFixed(2)} times its share of U.S. merchandise exports in 2023.`
    }));
    const tickLabels = new Map([[-2, "¼×"], [-1, "½×"], [0, "1×"], [1, "2×"], [2, "4×"], [3, "8×"]]);
    Charts.horizontalBars(node, rows, {
      title: mode === "canada" ? "Products more prominent in Canada's export basket" : "Products more prominent in the U.S. export basket",
      description: "Bars use a base-two logarithmic scale. One means equal prominence in the two export baskets.",
      xLabel: "Canada export share ÷ U.S. export share (log scale)",
      domain: [-2, 3],
      tickCount: 6,
      axisFormat: (value) => tickLabels.get(Math.round(value)) || `${(2 ** value).toFixed(2)}×`,
      leftMargin: mode === "us" ? 285 : 190,
      rowHeight: 38
    });
    const metric = document.getElementById("specialization-metric");
    const metricLabel = document.getElementById("specialization-metric-label");
    const note = document.getElementById("specialization-note");
    if (metric && metricLabel && note) {
      if (mode === "canada") {
        metric.textContent = "6.19×";
        metricLabel.textContent = "fertilizer: Canada share ÷ U.S. share";
        note.textContent = "A ratio above one describes greater prominence in Canada's basket. It does not prove a productivity cause or compare total export dollars.";
      } else {
        metric.textContent = "0.28×";
        metricLabel.textContent = "precision instruments: Canada share ÷ U.S. share";
        note.textContent = "A ratio below one describes greater prominence in the U.S. basket. It does not prove a productivity cause or compare total export dollars.";
      }
    }
    setPressed("[data-specialization-mode]", mode, "specializationMode");
  }

  function updateRca() {
    const country = document.getElementById("rca-country-share");
    const world = document.getElementById("rca-world-share");
    if (!country || !world) return;
    const countryValue = Number(country.value);
    const worldValue = Number(world.value);
    const rca = countryValue / worldValue;
    document.getElementById("rca-country-share-value").textContent = `${countryValue.toFixed(3)}%`;
    document.getElementById("rca-world-share-value").textContent = `${worldValue.toFixed(3)}%`;
    document.getElementById("rca-result").textContent = rca.toFixed(2);
    document.getElementById("rca-interpretation").textContent = rca >= 1
      ? `The product occupies a larger share of Canada's exports than of world exports; binary presence M = 1.`
      : `The product occupies a smaller share of Canada's exports than of world exports; binary presence M = 0.`;
  }

  function updateProximity(changedId = "") {
    const p = document.getElementById("proximity-p");
    const q = document.getElementById("proximity-q");
    const both = document.getElementById("proximity-both");
    if (!p || !q || !both) return;
    const maximumBoth = Math.min(Number(p.value), Number(q.value));
    both.max = String(maximumBoth);
    if (Number(both.value) > maximumBoth || changedId === "proximity-p" || changedId === "proximity-q") {
      both.value = String(Math.min(Number(both.value), maximumBoth));
    }
    const pValue = Number(p.value);
    const qValue = Number(q.value);
    const bothValue = Number(both.value);
    const givenQ = bothValue / qValue;
    const givenP = bothValue / pValue;
    const proximity = Math.min(givenQ, givenP);
    document.getElementById("proximity-p-value").textContent = String(pValue);
    document.getElementById("proximity-q-value").textContent = String(qValue);
    document.getElementById("proximity-both-value").textContent = String(bothValue);
    document.getElementById("proximity-result").textContent = proximity.toFixed(2);
    document.getElementById("proximity-detail").textContent = `min{${bothValue} ÷ ${qValue} = ${givenQ.toFixed(2)}, ${bothValue} ÷ ${pValue} = ${givenP.toFixed(2)}} = ${proximity.toFixed(2)}`;
  }

  function updateDensity() {
    const boxes = Array.from(document.querySelectorAll("[data-density-weight]"));
    if (!boxes.length) return;
    const denominator = boxes.reduce((sum, box) => sum + Number(box.dataset.densityWeight), 0);
    const selected = boxes.filter((box) => box.checked).map((box) => Number(box.dataset.densityWeight));
    const numerator = selected.reduce((sum, weight) => sum + weight, 0);
    const density = denominator ? numerator / denominator : 0;
    document.getElementById("density-result").textContent = `${Math.round(density * 100)}%`;
    document.getElementById("density-detail").textContent = `(${selected.length ? selected.map((value) => value.toFixed(2)).join(" + ") : "0"}) ÷ ${denominator.toFixed(2)} = ${density.toFixed(2)}`;
  }

  function renderCandidates() {
    const node = document.getElementById("candidate-chart");
    if (!node || !Charts) return;
    Charts.scatterWithFit(node, Object.entries(candidates).map(([code, item]) => ({
      x: item.density * 100,
      y: item.pci,
      label: `${code} ${item.label}`,
      display: `density ${(item.density * 100).toFixed(1)}%; PCI ${item.pci.toFixed(2)}`,
      color: item.color,
      radius: 10,
      detail: `Canadian RCA ${item.rca.toFixed(2)}; Canadian exports ${formatMoney(item.exports)} in 2024.`
    })), null, {
      title: "Five Canadian product-space discussion cases",
      description: "Density increases from left to right and product complexity increases from bottom to top. Focus a point to hear its product code, label, RCA, and exports.",
      xLabel: "Canadian density (%)",
      yLabel: "Atlas product complexity index (PCI)",
      xDomain: [22.5, 27],
      yDomain: [0.70, 1.23],
      height: 430,
      xFormat: (value) => `${value.toFixed(1)}%`,
      valueFormat: (value) => value.toFixed(2),
      pointRadius: 10
    });
  }

  function updateCandidate(code = "8537") {
    const item = candidates[code] || candidates["8537"];
    const select = document.getElementById("candidate-select");
    if (select) select.value = code;
    document.getElementById("candidate-density").textContent = `${(item.density * 100).toFixed(1)}%`;
    document.getElementById("candidate-rca").textContent = item.rca.toFixed(2);
    document.getElementById("candidate-pci").textContent = item.pci.toFixed(2);
    document.getElementById("candidate-summary").textContent = `Canada already exported ${formatMoney(item.exports)} of ${item.label.toLowerCase()} in 2024.`;
  }

  function updateContinuous() {
    const input = document.getElementById("continuous-rca");
    if (!input) return;
    const rca = Number(input.value);
    const binary = rca >= 1 ? 1 : 0;
    const continuous = rca / (1 + rca);
    document.getElementById("continuous-rca-value").textContent = rca.toFixed(2);
    document.getElementById("binary-result").textContent = String(binary);
    document.getElementById("continuous-result").textContent = continuous.toFixed(3);
  }

  document.querySelectorAll("[data-specialization-mode]").forEach((button) => {
    button.addEventListener("click", () => renderSpecialization(button.dataset.specializationMode));
  });
  ["rca-country-share", "rca-world-share"].forEach((id) => document.getElementById(id)?.addEventListener("input", updateRca));
  ["proximity-p", "proximity-q", "proximity-both"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => updateProximity(id));
  });
  document.querySelectorAll("[data-density-weight]").forEach((box) => box.addEventListener("change", updateDensity));
  document.getElementById("candidate-select")?.addEventListener("change", (event) => updateCandidate(event.target.value));
  document.getElementById("continuous-rca")?.addEventListener("input", updateContinuous);

  if (!Charts) {
    ["relative-specialization-chart", "candidate-chart"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.innerHTML = "<p class='chart-error'>The chart could not load. Reload the page or use the values printed beside it.</p>";
    });
  } else {
    renderSpecialization();
    renderCandidates();
  }
  updateRca();
  updateProximity();
  updateDensity();
  updateCandidate();
  updateContinuous();
})();
