(() => {
  "use strict";

  const Charts = window.EconCharts;
  const colours = { red: "#a6192e", blue: "#3d6f8e", green: "#3f7d6a", slate: "#2f4858", gold: "#c99700" };

  const specializationRows = [
    ["Fertilizers", 6.1944],
    ["Wood", 5.0186],
    ["Aluminum", 3.1405],
    ["Mineral fuels", 1.5740],
    ["Vehicles", 1.4762],
    ["Machinery", 0.6476],
    ["Electrical equipment", 0.2838],
    ["Precision & medical instruments", 0.2798]
  ];

  const cases = [
    ["Electrical control panels", 26.4, 0.94, 0.76, "US$2.22B"],
    ["Rail parts", 25.9, 0.60, 0.99, "US$192M"],
    ["Filtering machinery", 24.1, 0.73, 0.84, "US$1.64B"],
    ["Diagnostic reagents", 23.9, 0.69, 1.18, "US$551M"],
    ["Radar/navigation equipment", 23.3, 0.94, 0.80, "US$513M"]
  ];

  function renderSpecialization() {
    const node = document.getElementById("study-specialization-chart");
    if (!node || !Charts) return;
    const ticks = new Map([[-2, "¼×"], [-1, "½×"], [0, "1×"], [1, "2×"], [2, "4×"], [3, "8×"]]);
    Charts.horizontalBars(node, specializationRows.map(([label, ratio]) => ({
      label,
      value: Math.log2(ratio),
      display: `${ratio.toFixed(2)}×`,
      color: ratio >= 1 ? colours.red : colours.slate,
      detail: `${label}'s share of Canadian merchandise exports was ${ratio.toFixed(2)} times its share of U.S. merchandise exports in 2023.`
    })), {
      title: "Selected Canadian relative-export-specialization values",
      description: "Bars show Canadian export-basket share divided by U.S. export-basket share on a base-two logarithmic scale.",
      xLabel: "Canada export share ÷ U.S. export share (log scale)",
      domain: [-2, 3],
      tickCount: 6,
      axisFormat: (value) => ticks.get(Math.round(value)) || `${(2 ** value).toFixed(2)}×`,
      leftMargin: 280,
      rowHeight: 43,
      labelSize: 17
    });
  }

  function updateRca() {
    const country = document.getElementById("study-rca-country");
    const world = document.getElementById("study-rca-world");
    if (!country || !world) return;
    const countryValue = Number(country.value);
    const worldValue = Number(world.value);
    const rca = countryValue / worldValue;
    document.getElementById("study-rca-country-value").textContent = `${countryValue.toFixed(3)}%`;
    document.getElementById("study-rca-world-value").textContent = `${worldValue.toFixed(3)}%`;
    document.getElementById("study-rca-formula").textContent = `${countryValue.toFixed(3)} ÷ ${worldValue.toFixed(3)} = ${rca.toFixed(2)}`;
    document.getElementById("study-rca-result").textContent = rca.toFixed(2);
    document.getElementById("study-rca-interpretation").textContent = rca >= 1
      ? `Its share of Canadian exports exceeds its share of world exports, so binary presence M = 1.`
      : `Its share of Canadian exports is ${(rca * 100).toFixed(0)}% of its share of world exports, so binary presence M = 0.`;
  }

  function updateProximity() {
    const p = document.getElementById("study-proximity-p");
    const q = document.getElementById("study-proximity-q");
    const both = document.getElementById("study-proximity-both");
    if (!p || !q || !both) return;
    const maximumBoth = Math.min(Number(p.value), Number(q.value));
    both.max = String(maximumBoth);
    if (Number(both.value) > maximumBoth) both.value = String(maximumBoth);
    const pValue = Number(p.value);
    const qValue = Number(q.value);
    const bothValue = Number(both.value);
    const first = bothValue / qValue;
    const second = bothValue / pValue;
    const proximity = Math.min(first, second);
    document.getElementById("study-proximity-p-value").textContent = String(pValue);
    document.getElementById("study-proximity-q-value").textContent = String(qValue);
    document.getElementById("study-proximity-both-value").textContent = String(bothValue);
    document.getElementById("study-proximity-result").textContent = proximity.toFixed(2);
    document.getElementById("study-proximity-detail").textContent = `min{${bothValue}/${qValue}, ${bothValue}/${pValue}} = min{${first.toFixed(2)}, ${second.toFixed(2)}} = ${proximity.toFixed(2)}`;
  }

  function updateDensity() {
    const boxes = Array.from(document.querySelectorAll("[data-study-density]"));
    if (!boxes.length) return;
    const denominator = boxes.reduce((sum, box) => sum + Number(box.dataset.studyDensity), 0);
    const selected = boxes.filter((box) => box.checked).map((box) => Number(box.dataset.studyDensity));
    const numerator = selected.reduce((sum, weight) => sum + weight, 0);
    const density = denominator ? numerator / denominator : 0;
    document.getElementById("study-density-result").textContent = `${Math.round(density * 100)}%`;
    document.getElementById("study-density-detail").textContent = `(${selected.length ? selected.map((value) => value.toFixed(2)).join(" + ") : "0"}) ÷ ${denominator.toFixed(2)} = ${density.toFixed(2)}`;
  }

  function renderCases() {
    const node = document.getElementById("study-case-chart");
    if (!node || !Charts) return;
    Charts.horizontalBars(node, cases.map(([label, density, rca, pci, exports], index) => ({
      label,
      value: density,
      display: `${density.toFixed(1)}%`,
      color: [colours.red, colours.blue, colours.green, colours.gold, colours.slate][index],
      detail: `Canadian RCA ${rca.toFixed(2)}; PCI ${pci.toFixed(2)}; Canadian exports ${exports} in 2024.`
    })), {
      title: "Density of five Canadian discussion cases",
      description: "Higher density means a larger proximity-weighted share of the product's neighbours is already in Canada's revealed-specialization basket.",
      xLabel: "Canadian density (%)",
      domain: [0, 30],
      valueFormat: (value) => `${value.toFixed(1)}%`,
      leftMargin: 285,
      rowHeight: 48,
      labelSize: 17
    });
  }

  function updateContinuous() {
    const input = document.getElementById("study-continuous-rca");
    if (!input) return;
    const rca = Number(input.value);
    document.getElementById("study-continuous-rca-value").textContent = rca.toFixed(2);
    document.getElementById("study-binary-result").textContent = rca >= 1 ? "1" : "0";
    document.getElementById("study-continuous-result").textContent = (rca / (1 + rca)).toFixed(3);
  }

  ["study-rca-country", "study-rca-world"].forEach((id) => document.getElementById(id)?.addEventListener("input", updateRca));
  ["study-proximity-p", "study-proximity-q", "study-proximity-both"].forEach((id) => document.getElementById(id)?.addEventListener("input", updateProximity));
  document.querySelectorAll("[data-study-density]").forEach((box) => box.addEventListener("change", updateDensity));
  document.getElementById("study-continuous-rca")?.addEventListener("input", updateContinuous);

  if (!Charts) {
    ["study-specialization-chart", "study-case-chart"].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.innerHTML = "<p class='chart-error'>The study chart could not load. Reload the page or use the values printed on the slide.</p>";
    });
  } else {
    renderSpecialization();
    renderCases();
  }
  updateRca();
  updateProximity();
  updateDensity();
  updateContinuous();
})();
