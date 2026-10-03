(() => {
  "use strict";

  const Charts = window.EconCharts;
  const chartIds = [
    "study-partner-chart",
    "study-distance-chart",
    "study-canada-chart",
    "study-history-chart",
    "study-province-chart"
  ];

  if (!Charts) {
    chartIds.forEach((id) => {
      const node = document.getElementById(id);
      if (node) {
        node.innerHTML = "<p class='chart-error'>The study chart could not load. Reload the page or use the key values printed on the slide.</p>";
      }
    });
    return;
  }

  const colours = {
    red: "#a6192e",
    blue: "#3d6f8e",
    slate: "#2f4858",
    grey: "#8b9aa2"
  };
  const fmt1 = (value) => Number(value).toFixed(1);

  const partnerShares = [
    ["United States", 72.3],
    ["United Kingdom", 6.0],
    ["China", 4.5],
    ["Japan", 1.9],
    ["Mexico", 1.1],
    ["Rest of world", 14.1]
  ];

  const distanceBins = [
    [813, 222.525, 1562], [1625, 57.470, 1562], [2377, 36.358, 1564], [3201, 22.020, 1560],
    [3987, 14.188, 1562], [4665, 14.833, 1561], [5270, 13.193, 1565], [5971, 11.171, 1560],
    [6686, 9.311, 1561], [7431, 9.640, 1565], [8081.5, 8.999, 1560], [8736, 7.768, 1561],
    [9511, 8.034, 1561], [10399, 6.408, 1561], [11548, 5.611, 1563], [12848, 4.237, 1562],
    [14517, 4.767, 1562], [16805, 6.349, 1561]
  ];

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

  function renderPartners() {
    const node = document.getElementById("study-partner-chart");
    if (!node) return;
    Charts.horizontalBars(node, partnerShares.map(([label, value]) => ({
      label,
      value,
      display: `${fmt1(value)}%`,
      color: label === "United States" ? colours.red : label === "Rest of world" ? colours.grey : colours.blue,
      detail: `${label} received ${fmt1(value)}% of Canada's merchandise exports in 2025.`
    })), {
      title: "Where Canadian merchandise exports went in 2025",
      description: "Horizontal bars show each partner's share of Canadian merchandise exports. The United States is highlighted in crimson and accounted for 72.3 percent.",
      xLabel: "Share of Canadian merchandise exports (%)",
      domain: [0, 80],
      valueFormat: (value) => `${fmt1(value)}%`
    });
  }

  function renderDistance() {
    const node = document.getElementById("study-distance-chart");
    if (!node) return;
    Charts.scatterWithFit(node,
      distanceBins.map(([x, y, n], index) => ({
        x,
        y,
        label: `${Math.round(x).toLocaleString("en-CA")} kilometres`,
        display: `US$${fmt1(y)} million`,
        detail: `Distance group ${index + 1}: median distance ${Math.round(x).toLocaleString("en-CA")} kilometres; geometric-mean trade US$${fmt1(y)} million; ${n.toLocaleString("en-CA")} country pairs.`
      })),
      (distance) => 100 * (distance / 1000) ** -1.169470588,
      {
        title: "More distant country pairs tend to trade less",
        description: "Eighteen distance groups are shown on logarithmic axes. The fitted line is 100 times distance in thousands of kilometres raised to minus 1.169. Points can be focused to hear their values.",
        xLabel: "Distance between partners (km, log scale)",
        yLabel: "Typical bilateral trade (US$ millions, log scale)",
        logX: true,
        logY: true,
        pointColor: colours.blue,
        fitColor: colours.red,
        fitLabel: "Fitted gravity relationship"
      }
    );
  }

  function renderCanadaComparison() {
    const node = document.getElementById("study-canada-chart");
    if (!node) return;
    const rows = [
      ["U.S. · observed", 314.4, colours.red],
      ["EU27 · observed", 22.1, colours.red],
      ["U.S. · gravity fitted", 310.6, colours.blue],
      ["EU27 · gravity fitted", 75.4, colours.blue]
    ];
    Charts.horizontalBars(node, rows.map(([label, value, color]) => ({
      label,
      value,
      color,
      display: `US$${fmt1(value)}B`,
      detail: `${label}: US$${fmt1(value)} billion of Canadian merchandise exports in 2019.`
    })), {
      title: "Canadian exports to the United States and EU27: observed versus gravity fitted",
      description: "Crimson bars are observed 2019 exports and blue bars are values fitted by the gravity regression. The EU27 fitted value is a benchmark, not a forecast.",
      xLabel: "Canadian merchandise exports (US$ billions, 2019)",
      domain: [0, 360],
      valueFormat: (value) => `US$${fmt1(value)}B`
    });
  }

  function renderHistory() {
    const node = document.getElementById("study-history-chart");
    if (!node) return;
    Charts.lineChart(node, [
      {
        label: "Exports to U.S.",
        color: colours.red,
        values: usShareHistory.map(([year, exports]) => ({
          x: year,
          y: exports,
          label: String(year),
          display: `${fmt1(exports)}%`,
          detail: `${year}: ${fmt1(exports)}% of Canadian merchandise exports went to the United States.`
        }))
      },
      {
        label: "Imports from U.S.",
        color: colours.blue,
        values: usShareHistory.map(([year, , imports]) => ({
          x: year,
          y: imports,
          label: String(year),
          display: `${fmt1(imports)}%`,
          detail: `${year}: ${fmt1(imports)}% of Canadian merchandise imports came from the United States.`
        }))
      }
    ], {
      title: "Canada's merchandise trade remains U.S.-oriented, but less than before",
      description: "Two lines show the United States share of Canadian merchandise exports and imports from 1999 through 2025. Both shares declined over the period.",
      xLabel: "Year",
      yLabel: "U.S. share of Canada's merchandise trade (%)",
      yDomain: [40, 90],
      xFormat: (value) => String(Math.round(value)),
      valueFormat: (value) => `${fmt1(value)}%`
    });
  }

  function renderProvinceComparison() {
    const node = document.getElementById("study-province-chart");
    if (!node) return;
    Charts.stackedHorizontalBars(node, [
      {
        label: "Quebec",
        segments: [
          { label: "Exports", value: 12.50, color: colours.red, display: "C$12.50B" },
          { label: "Imports", value: 30.36, color: colours.blue, display: "C$30.36B" }
        ]
      },
      {
        label: "British Columbia",
        segments: [
          { label: "Exports", value: 1.95, color: colours.red, display: "C$1.95B" },
          { label: "Imports", value: 5.32, color: colours.blue, display: "C$5.32B" }
        ]
      }
    ], {
      title: "Quebec and British Columbia merchandise trade with the EU27 in 2025",
      description: "Quebec traded considerably more with the EU27 than British Columbia. Exports are crimson and imports blue.",
      xLabel: "Merchandise trade with EU27 (C$ billions)",
      domain: [0, 46],
      valueFormat: (value) => `C$${fmt1(value)}B`
    });
  }

  renderPartners();
  renderDistance();
  renderCanadaComparison();
  renderHistory();
  renderProvinceComparison();
})();
