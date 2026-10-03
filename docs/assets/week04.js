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

  const partnerShares = {
    export: [
      ["United States", 72.32584], ["United Kingdom", 6.00316],
      ["China", 4.50311], ["Japan", 1.87727], ["Mexico", 1.14328],
      ["Rest of world", 14.14733]
    ],
    import: [
      ["United States", 45.86175], ["China", 11.48831],
      ["Mexico", 6.77729], ["Japan", 2.67458], ["United Kingdom", 1.26089],
      ["Rest of world", 31.93719]
    ]
  };

  const distanceBins = [
    [813, 222.525, 1562], [1625, 57.470, 1562], [2377, 36.358, 1564], [3201, 22.020, 1560],
    [3987, 14.188, 1562], [4665, 14.833, 1561], [5270, 13.193, 1565], [5971, 11.171, 1560],
    [6686, 9.311, 1561], [7431, 9.640, 1565], [8081.5, 8.999, 1560], [8736, 7.768, 1561],
    [9511, 8.034, 1561], [10399, 6.408, 1561], [11548, 5.611, 1563], [12848, 4.237, 1562],
    [14517, 4.767, 1562], [16805, 6.349, 1561]
  ];

  const coefficients = {
    ols: [
      ["Exporter GDP", 1.324077, 1.310071, 1.338083],
      ["Importer GDP", 0.975365, 0.961566, 0.989163],
      ["Distance", -1.169471, -1.209859, -1.129082],
      ["Shared border", 1.054348, 0.851489, 1.257207],
      ["Official language", 0.872284, 0.785255, 0.959314],
      ["Trade agreement", 1.055191, 0.987887, 1.122494]
    ],
    ppml: [
      ["Exporter GDP", 0.852061, 0.819538, 0.884584],
      ["Importer GDP", 0.824075, 0.786171, 0.861980],
      ["Distance", -0.666348, -0.732050, -0.600647],
      ["Shared border", 0.362259, 0.133342, 0.591176],
      ["Official language", 0.145916, -0.023523, 0.315355],
      ["Trade agreement", 0.290018, 0.167956, 0.412080]
    ]
  };

  const canadaTrade = {
    exports: { actual: { us: 314.402, eu: 22.104 }, fitted: { us: 310.626, eu: 75.438 } },
    imports: { actual: { us: 258.583, eu: 45.528 }, fitted: { us: 333.203, eu: 74.446 } }
  };

  const waterfallData = {
    exports: {
      values: [-3.295837, 3.093871, 1.145915, 0.362259, 0.109068, 0, 1.239629],
      ratios: [0.037037, 0.817123, 2.570110, 3.692147, 4.117623, 4.117623, 14.223638]
    },
    imports: {
      values: [-3.295837, 3.177931, 1.145496, 0.362259, 0.108833, 0, 0.238213],
      ratios: [0.037037, 0.888779, 2.794323, 4.014244, 4.475785, 4.475785, 5.679681]
    }
  };
  const waterfallLabels = ["27 EU markets", "Partner GDP", "Distance", "Shared border", "Language", "Agreement", "Residual"];

  const usShareHistory = [
    [1999,86.6803,67.2812],[2000,86.9499,64.3320],[2001,87.0492,63.6210],
    [2002,87.1300,62.6145],[2003,85.7366,60.6358],[2004,84.4428,58.7230],
    [2005,83.8188,56.4922],[2006,81.5545,54.8668],[2007,78.9683,54.2327],
    [2008,77.6606,52.3610],[2009,75.0765,51.1287],[2010,74.8762,50.3698],
    [2011,73.6446,49.5727],[2012,74.5177,50.6174],[2013,75.8380,52.0951],
    [2014,76.8283,54.3752],[2015,76.7405,53.2209],[2016,76.2781,52.1717],
    [2017,75.8459,51.3954],[2018,74.9361,51.1157],[2019,75.3406,50.7119],
    [2020,73.2750,48.8463],[2021,75.3795,48.6255],[2022,76.5066,49.2232],
    [2023,77.3643,49.6363],[2024,76.3188,49.1993],[2025,72.3258,45.8617]
  ];

  const chartNode = (id) => document.getElementById(id);
  const fmt1 = (value) => Number(value).toFixed(1);
  const money = (value) => `US$${fmt1(value)}B`;
  const setPressed = (selector, value, attribute) => {
    document.querySelectorAll(selector).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset[attribute] === value));
    });
  };

  function renderPartners(mode = "export") {
    const node = chartNode("partner-chart");
    if (!node) return;
    const noun = mode === "export" ? "Canadian merchandise exports" : "Canadian merchandise imports";
    Charts.horizontalBars(node, partnerShares[mode].map(([label, value]) => ({
      label,
      value,
      display: `${fmt1(value)}%`,
      color: label === "United States" ? colours.red : label === "Rest of world" ? colours.grey : colours.blue,
      detail: `${label}: ${fmt1(value)}% of ${mode}s`
    })), {
      title: `${noun} by partner, 2025`,
      description: `The United States is highlighted. Values are shares of Canada's total merchandise ${mode}s.`,
      xLabel: "Share of total (%)",
      domain: [0, 80],
      valueFormat: (value) => `${fmt1(value)}%`
    });
    document.querySelector("[data-partner-summary]").textContent = mode === "export"
      ? "Nearly three of every four merchandise-export dollars went to the United States."
      : "Imports were less concentrated: the United States supplied just under half."
    setPressed("[data-partner-mode]", mode, "partnerMode");
  }

  function updateToyGravity() {
    const size = Number(document.getElementById("partner-size")?.value || 2);
    const distance = Number(document.getElementById("partner-distance")?.value || 2);
    const ratio = size / distance;
    const sizeOutput = document.querySelector("[data-size-output], #partner-size-value");
    const distanceOutput = document.querySelector("[data-distance-output], #partner-distance-value");
    const result = document.querySelector("[data-toy-result], #toy-gravity-result");
    const interpretation = document.querySelector("[data-toy-interpretation], #toy-gravity-interpretation");
    if (sizeOutput) sizeOutput.value = `${size.toFixed(1)}×`;
    if (distanceOutput) distanceOutput.value = `${distance.toFixed(1)}×`;
    if (result) result.textContent = `${ratio.toFixed(2)}×`;
    if (interpretation) {
      interpretation.textContent = ratio > 1.02
        ? "Size more than offsets distance: B is predicted to receive more trade."
        : ratio < 0.98
          ? "Distance dominates: B is predicted to receive less trade."
          : "The two forces almost exactly offset one another."
    }
  }

  function updateDistanceCalculator() {
    const multiple = Number(document.getElementById("distance-multiple")?.value || 2);
    const model = document.getElementById("distance-model")?.value || "ppml";
    const elasticity = model === "ppml" ? -0.666348 : -1.169471;
    const ratio = multiple ** elasticity;
    const multipleOutput = document.querySelector("[data-distance-multiple-output], #distance-multiple-value");
    const result = document.querySelector("[data-distance-result], #distance-result-ratio");
    const percent = document.querySelector("[data-distance-percent], #distance-result-change");
    const coefficient = document.querySelector("[data-distance-coefficient]");
    if (multipleOutput) multipleOutput.value = `${multiple.toFixed(1)}×`;
    if (result) result.textContent = `${ratio.toFixed(3)}×`;
    if (percent) percent.innerHTML = `<strong>${((1 - ratio) * 100).toFixed(1)}% less predicted trade</strong>, holding the included variables fixed.`;
    if (coefficient) coefficient.textContent = elasticity.toFixed(3);
  }

  function renderDistance() {
    const node = chartNode("distance-chart");
    if (!node) return;
    Charts.scatterWithFit(node,
      distanceBins.map(([x, y, n], index) => ({
        x, y,
        label: `${Math.round(x).toLocaleString()} km`,
        detail: `Bin ${index + 1}: median distance ${Math.round(x).toLocaleString()} km; geometric-mean trade US$${fmt1(y)}M; ${n.toLocaleString()} dyads`
      })),
      (x) => 100 * (x / 1000) ** -1.169470588,
      {
        title: "Trade falls sharply with distance",
        description: "Each point summarizes similarly distant positive-flow dyads. The line uses the log-OLS distance slope.",
        xLabel: "Population-weighted distance (km, log scale)",
        yLabel: "Geometric-mean trade (US$ millions, log scale)",
        logX: true,
        logY: true,
        color: colours.red,
        fitColor: colours.slate
      });
  }

  function renderCoefficients(model = "ppml") {
    const node = chartNode("coefficient-chart");
    if (!node) return;
    const n = model === "ppml" ? "39,402 eligible dyads, including verified zeros" : "28,113 positive-flow dyads";
    Charts.coefficientPlot(node, coefficients[model].map(([label, value, low, high]) => ({
      label, value, low, high,
      color: label === "Distance" ? colours.red : colours.blue,
      display: value.toFixed(3),
      detail: `${label}: coefficient ${value.toFixed(3)}; robust 95% interval ${low.toFixed(3)} to ${high.toFixed(3)}`
    })), {
      title: model === "ppml" ? "PPML gravity coefficients" : "Log-OLS gravity coefficients",
      description: `${n}. Whiskers are robust 95% confidence intervals; the vertical line marks zero.`,
      xLabel: "Estimated coefficient",
      reference: 0,
      domain: [-1.5, 1.55]
    });
    const note = document.querySelector("[data-coefficient-summary]");
    if (note) note.textContent = model === "ppml"
      ? "PPML retains eligible zero flows. The language interval crosses zero; the distance estimate is −0.666."
      : "Log-OLS uses only positive flows. Its distance estimate is larger in magnitude: −1.169."
    setPressed("[data-coefficient-model]", model, "coefficientModel");
  }

  function renderCanadaTrade(direction = "exports") {
    const node = chartNode("canada-trade-chart");
    if (!node) return;
    const data = canadaTrade[direction];
    Charts.horizontalBars(node, [
      { label: "United States · observed", value: data.actual.us, display: money(data.actual.us), color: colours.red },
      { label: "EU27 · observed", value: data.actual.eu, display: money(data.actual.eu), color: colours.red },
      { label: "United States · fitted", value: data.fitted.us, display: money(data.fitted.us), color: colours.blue },
      { label: "EU27 · fitted", value: data.fitted.eu, display: money(data.fitted.eu), color: colours.blue }
    ], {
      title: `Canadian ${direction}: observed and gravity-fitted trade, 2019`,
      description: "Observed values are shown in crimson and PPML fitted values in blue. EU27 values sum 27 country dyads.",
      xLabel: "US$ billions",
      domain: [0, 360],
      valueFormat: money
    });
    const observed = data.actual.us / data.actual.eu;
    const fitted = data.fitted.us / data.fitted.eu;
    const observedMetric = document.getElementById("canada-observed-ratio");
    const fittedMetric = document.getElementById("canada-fitted-ratio");
    if (observedMetric) observedMetric.textContent = `${observed.toFixed(1)}×`;
    if (fittedMetric) fittedMetric.textContent = `${fitted.toFixed(1)}×`;
    const summary = document.querySelector("[data-canada-summary]");
    if (summary) summary.innerHTML = `Observed U.S./EU27 ratio: <strong>${observed.toFixed(1)}×</strong>. Fitted ratio: <strong>${fitted.toFixed(1)}×</strong>. Residual orientation: <strong>${(observed / fitted).toFixed(1)}×</strong>.`;
    setPressed("[data-canada-direction]", direction, "canadaDirection");
  }

  function renderWaterfall(direction = "exports") {
    const node = chartNode("waterfall-chart");
    if (!node) return;
    const series = waterfallData[direction];
    Charts.waterfall(node, waterfallLabels.map((label, index) => ({
      label,
      value: series.values[index],
      cumulative: Math.log(series.ratios[index]),
      color: index === series.values.length - 1 ? colours.grey : series.values[index] >= 0 ? colours.blue : colours.red,
      display: `${series.values[index] >= 0 ? "+" : ""}${series.values[index].toFixed(2)} log points`,
      detail: `${label}: ${series.values[index] >= 0 ? "+" : ""}${series.values[index].toFixed(2)} log points; cumulative ratio ${series.ratios[index].toFixed(2)}×`
    })), {
      title: `Sequential accounting of Canada's ${direction} U.S./EU27 ratio`,
      description: "Each step changes the running log ratio. The final grey bar is residual orientation, not a causal policy effect.",
      yLabel: "Contribution to log U.S./EU27 ratio"
    });
    const result = document.querySelector("[data-waterfall-summary]");
    const residual = series.ratios.at(-1) / series.ratios.at(-2);
    if (result) result.textContent = direction === "exports"
      ? `Measured gravity reaches 4.12×; residual orientation multiplies it by ${residual.toFixed(2)} to reach 14.22×.`
      : `Measured gravity reaches 4.48×; a smaller ${residual.toFixed(2)} residual multiplier reaches 5.68×.`;
    setPressed("[data-waterfall-direction]", direction, "waterfallDirection");
  }

  function renderCeta() {
    const node = chartNode("ceta-chart");
    if (!node) return;
    Charts.horizontalBars(node, [
      { label: "Observed exports", value: 22.104, display: "US$22.1B", color: colours.red },
      { label: "Gravity fitted", value: 75.438, display: "US$75.4B", color: colours.blue }
    ], {
      title: "Canadian merchandise exports to the EU27, 2019",
      description: "The fitted value is a conditional regression benchmark, not a forecast and not exports guaranteed by CETA.",
      xLabel: "US$ billions",
      domain: [0, 82],
      valueFormat: money
    });
  }

  function renderProvinces() {
    const node = chartNode("province-chart");
    if (!node) return;
    Charts.stackedHorizontalBars(node, [
      { label: "Quebec", segments: [
        { label: "Exports", value: 12.499748, color: colours.red, display: "C$12.50B" },
        { label: "Imports", value: 30.364554, color: colours.blue, display: "C$30.36B" }
      ] },
      { label: "British Columbia", segments: [
        { label: "Exports", value: 1.948814, color: colours.red, display: "C$1.95B" },
        { label: "Imports", value: 5.320852, color: colours.blue, display: "C$5.32B" }
      ] }
    ], {
      title: "Provincial merchandise trade with the EU27, 2025",
      description: "Exports are crimson and imports blue. Province of import reflects customs clearance, so treat the comparison as illustrative.",
      xLabel: "C$ billions",
      domain: [0, 46],
      valueFormat: (value) => `C$${fmt1(value)}B`
    });
  }

  function renderHistory() {
    const node = chartNode("us-share-chart");
    if (!node) return;
    Charts.lineChart(node, [
      { label: "Exports to U.S.", color: colours.red, values: usShareHistory.map(([x, y]) => ({ x, y, detail: `${x}: ${fmt1(y)}%` })) },
      { label: "Imports from U.S.", color: colours.blue, values: usShareHistory.map(([x, , y]) => ({ x, y, detail: `${x}: ${fmt1(y)}%` })) }
    ], {
      title: "The U.S. share has declined, but remains large",
      description: "Annual shares of Canadian merchandise exports and imports, 1999–2025.",
      xLabel: "Year",
      yLabel: "Share of total merchandise trade (%)",
      yDomain: [40, 90],
      xFormat: (value) => String(Math.round(value)),
      valueFormat: (value) => `${fmt1(value)}%`
    });
  }

  document.querySelectorAll("[data-partner-mode]").forEach((button) => button.addEventListener("click", () => renderPartners(button.dataset.partnerMode)));
  document.querySelectorAll("[data-coefficient-model]").forEach((button) => button.addEventListener("click", () => renderCoefficients(button.dataset.coefficientModel)));
  document.querySelectorAll("[data-canada-direction]").forEach((button) => button.addEventListener("click", () => renderCanadaTrade(button.dataset.canadaDirection)));
  document.querySelectorAll("[data-waterfall-direction]").forEach((button) => button.addEventListener("click", () => renderWaterfall(button.dataset.waterfallDirection)));
  ["partner-size", "partner-distance"].forEach((id) => document.getElementById(id)?.addEventListener("input", updateToyGravity));
  ["distance-multiple", "distance-model"].forEach((id) => document.getElementById(id)?.addEventListener("input", updateDistanceCalculator));

  renderPartners();
  updateToyGravity();
  updateDistanceCalculator();
  renderDistance();
  renderCoefficients();
  renderCanadaTrade();
  renderWaterfall();
  renderCeta();
  renderProvinces();
  renderHistory();
})();
