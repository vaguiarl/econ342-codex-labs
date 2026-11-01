(() => {
  "use strict";

  const Charts = window.EconCharts;
  const colours = { red:"#a6192e", blue:"#3d6f8e", green:"#3f7d6a", gold:"#c99700", grey:"#8b9aa2" };
  const percent = (value) => `${Number(value).toFixed(1)}%`;

  function renderConcentration() {
    const node = document.getElementById("concentration-chart");
    if (!node || !Charts) return;
    Charts.horizontalBars(node, [
      { label:"Top 500 exporters", value:77.7, color:colours.red, display:"77.7%", detail:"About 1% of Canadian exporting enterprises." },
      { label:"Other 47,536 exporters", value:22.3, color:colours.grey, display:"22.3%", detail:"The remaining roughly 99% of exporting enterprises." }
    ], {
      title:"Canadian goods-export value is highly concentrated, 2024",
      description:"The top 500 exporters generated 77.7 percent of export value and all other exporters generated 22.3 percent.",
      xLabel:"Share of identified goods-export value",
      domain:[0,100], axisFormat:percent, valueFormat:percent, height:270
    });
  }

  function renderSMEComparison() {
    const node = document.getElementById("sme-comparison-chart");
    if (!node || !Charts) return;
    Charts.stackedHorizontalBars(node, [
      { label:"Canada · exporter count", segments:[{label:"SME",value:97.4,color:colours.blue},{label:"Large",value:2.6,color:colours.gold}] },
      { label:"Canada · export value", segments:[{label:"SME",value:40.0,color:colours.blue},{label:"Large",value:60.0,color:colours.gold}] },
      { label:"U.S. · exporter count", segments:[{label:"SME",value:97.1,color:colours.blue},{label:"Large",value:2.9,color:colours.gold}] },
      { label:"U.S. · export value", segments:[{label:"SME",value:33.4,color:colours.blue},{label:"Large",value:66.6,color:colours.gold}] }
    ], {
      title:"SMEs dominate exporter counts but not export value, 2024",
      description:"In Canada and the United States SMEs represent about 97 percent of identified exporters, but 40.0 and 33.4 percent of export value respectively.",
      xLabel:"Share within each row", domain:[0,100], axisFormat:percent, valueFormat:percent, height:300
    });
  }

  function renderSurvival() {
    const node = document.getElementById("survival-chart");
    if (!node || !Charts) return;
    const rates = [59.8,45.5,37.9,33.4,30.2,28.1];
    Charts.lineChart(node, [{
      label:"Active export spells", color:colours.red,
      values:rates.map((rate,index)=>({x:index+1,y:rate,label:`Year ${index+1}`,display:percent(rate),detail:`${percent(rate)} of export spells remain active.`}))
    }], {
      title:"Survival of Canadian export spells",
      description:"The share of export spells still active falls from 59.8 percent in year one to 28.1 percent in year six.",
      xLabel:"Year of exporting", yLabel:"Share of export spells active",
      xDomain:[1,6], yDomain:[0,70], xFormat:(v)=>Number(v).toFixed(0), yFormat:percent, valueFormat:percent,
      pointRadius:6, height:350
    });
  }

  function signed(value, digits=0) {
    const rounded = Number(value).toFixed(digits);
    if (Number(value) > 0) return `+${rounded}`;
    if (Number(value) < 0) return rounded.replace("-","−");
    return rounded;
  }

  function updateFirmCalculator() {
    const productivityInput = document.getElementById("firm-productivity");
    const fixedExportInput = document.getElementById("export-fixed-cost");
    if (!productivityInput || !fixedExportInput) return;
    const productivity = Number(productivityInput.value);
    const fixedExportCost = Number(fixedExportInput.value);
    const wage = 96;
    const unitCost = wage / productivity;
    const domesticOutput = Math.max(0, 30 - unitCost);
    const domesticProfit = (domesticOutput ** 2) / 2 - 120;
    const exportOutput = Math.max(0, 32 - unitCost);
    const exportPrice = 34 - exportOutput / 2;
    const exportProfit = (exportOutput ** 2) / 2 - fixedExportCost;
    const cutoffDenominator = 32 - Math.sqrt(2 * fixedExportCost);
    const exportCutoff = cutoffDenominator > 0 ? wage / cutoffDenominator : Infinity;
    const tolerance = 1e-9;
    let status;
    if (Math.abs(domesticProfit) <= tolerance) status = "Indifferent: operate or exit";
    else if (domesticProfit < 0) status = "Exit";
    else if (Math.abs(exportProfit) <= tolerance) status = "Indifferent: export or domestic only";
    else if (exportProfit > 0) status = "Exporter";
    else status = "Domestic only";

    document.getElementById("firm-productivity-value").value = productivity.toFixed(1);
    document.getElementById("export-fixed-cost-value").value = fixedExportCost.toFixed(0);
    document.getElementById("unit-cost-result").textContent = unitCost.toFixed(1);
    document.getElementById("domestic-output-result").textContent = domesticOutput.toFixed(1);
    document.getElementById("domestic-profit-result").textContent = signed(domesticProfit,0);
    document.getElementById("export-output-result").textContent = exportOutput.toFixed(1);
    document.getElementById("export-price-result").textContent = exportPrice.toFixed(1);
    document.getElementById("export-profit-result").textContent = signed(exportProfit,0);
    document.getElementById("export-cutoff-result").textContent = Number.isFinite(exportCutoff) ? exportCutoff.toFixed(2) : "none";
    const statusNode = document.getElementById("firm-status-result");
    statusNode.textContent = status;
    statusNode.style.background = status === "Exit" ? colours.red : status === "Domestic only" ? colours.blue : status.startsWith("Indifferent") ? colours.gold : colours.green;
  }

  if (!Charts) {
    document.querySelectorAll(".chart").forEach((node) => {
      node.innerHTML = "<p class='chart-error'>The interactive chart could not load. Reload the page or use the values printed beside it.</p>";
    });
  } else {
    renderConcentration();
    renderSMEComparison();
    renderSurvival();
  }
  document.getElementById("firm-productivity")?.addEventListener("input", updateFirmCalculator);
  document.getElementById("export-fixed-cost")?.addEventListener("input", updateFirmCalculator);
  updateFirmCalculator();
})();
