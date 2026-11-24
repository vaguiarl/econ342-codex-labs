/* Illustrative three-region Armington equilibrium. No historical calibration.
 * Matrices: exporter rows, importer columns. See research/week11_structural_model.md.
 * Works from file:// and in Node; no dependencies or network requests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PanamaModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '1.0.0';
  const sum = xs => xs.reduce((a, b) => a + b, 0);
  const matrix = (n, fn) => Array.from({length: n}, (_, i) =>
    Array.from({length: n}, (_, j) => fn(i, j)));

  function validateNumber(value, name, low, high) {
    if (!Number.isFinite(value) || value < low || value > high)
      throw new RangeError(name + ' must be finite and between ' + low + ' and ' + high);
  }

  function solve(options) {
    const {labor, distances, theta = 4, freight = 0.2} = options || {};
    validateNumber(theta, 'theta', 2, 8);
    validateNumber(freight, 'freight', 0, 0.5);
    if (!Array.isArray(labor) || labor.length < 2 || labor.length > 20 ||
        labor.some(x => !Number.isFinite(x) || x <= 0))
      throw new RangeError('labor must contain 2 to 20 positive finite entries');
    const n = labor.length;
    if (!Array.isArray(distances) || distances.length !== n ||
        distances.some((row, i) => !Array.isArray(row) || row.length !== n ||
          row.some((x, j) => !Number.isFinite(x) || x < 0 || (i === j && x !== 0))))
      throw new RangeError('distances must be a nonnegative square matrix with zero diagonal');
    const worldIncome = options.worldIncome === undefined ? sum(labor) : options.worldIncome;
    if (!Number.isFinite(worldIncome) || worldIncome <= 0)
      throw new RangeError('worldIncome must be positive and finite');
    const tau = matrix(n, (i, j) => i === j ? 1 : 1 + freight * distances[i][j] / 10000);
    const logW = labor.map(() => Math.log(worldIncome / sum(labor)));
    const damping = 0.8 / (1 + theta);
    const tolerance = 1e-12;
    const maxIterations = 20000;
    let last;
    for (let iterations = 0; iterations <= maxIterations; iterations++) {
      const wages = logW.map(Math.exp);
      const income = wages.map((w, i) => w * labor[i]);
      const shares = matrix(n, () => 0);
      const priceIndex = Array(n);
      for (let j = 0; j < n; j++) {
        const logTerms = logW.map((w, i) => -theta * (w + Math.log(tau[i][j])));
        const largest = Math.max(...logTerms);
        const scaled = logTerms.map(x => Math.exp(x - largest));
        const denominator = sum(scaled);
        for (let i = 0; i < n; i++) shares[i][j] = scaled[i] / denominator;
        // Equal CES expenditure weights 1/n fix the utility-unit normalization.
        priceIndex[j] = Math.exp(-(largest + Math.log(denominator / n)) / theta);
      }
      const tradeFlows = matrix(n, (i, j) => shares[i][j] * income[j]);
      const revenue = tradeFlows.map(sum);
      const maxRelativeMarketError = Math.max(...revenue.map((r, i) => Math.abs(r / income[i] - 1)));
      const maxShareSumError = Math.max(...labor.map((_, j) =>
        Math.abs(sum(shares.map(row => row[j])) - 1)));
      last = {iterations, maxRelativeMarketError};
      if (!Number.isFinite(maxRelativeMarketError)) throw new Error('Equilibrium solver produced nonfinite values');
      if (maxRelativeMarketError < tolerance) {
        const domesticShares = labor.map((_, i) => shares[i][i]);
        return {
          distances: distances.map(row => row.slice()), tau, wages, income, priceIndex,
          realIncome: wages.map((w, i) => w / priceIndex[i]),
          shares, tradeFlows, domesticShares,
          crossRegionShare: 1 - sum(domesticShares.map((s, j) => s * income[j])) / worldIncome,
          diagnostics: {converged: true, iterations, maxRelativeMarketError,
            maxShareSumError, worldIncome: sum(income), targetWorldIncome: worldIncome}
        };
      }
      if (iterations === maxIterations) break;
      for (let i = 0; i < n; i++) logW[i] += damping * Math.log(revenue[i] / income[i]);
      const normalizer = Math.log(worldIncome / sum(logW.map((w, i) => Math.exp(w) * labor[i])));
      for (let i = 0; i < n; i++) logW[i] += normalizer;
    }
    throw new Error('Equilibrium did not converge: ' + JSON.stringify(last));
  }

  function run({theta = 4, freight = 0.2} = {}) {
    const regions = [
      {id: 'atlantic', name: 'Atlantic US (New York)', labor: 2},
      {id: 'pacific', name: 'Pacific US (San Francisco)', labor: 1},
      {id: 'asia', name: 'Pacific Asia (Yokohama)', labor: 3}
    ];
    const labor = regions.map(r => r.labor);
    const off = solve({labor, theta, freight,
      distances: [[0, 13135, 13079], [13135, 0, 4600], [13079, 4600, 0]]});
    const on = solve({labor, theta, freight,
      distances: [[0, 5262, 9798], [5262, 0, 4600], [9798, 4600, 0]]});
    const percent = key => on[key].map((v, i) => 100 * (v / off[key][i] - 1));
    return {
      version: VERSION, parameters: {theta, sigma: theta + 1, freight}, regions, off, on,
      changes: {
        realIncomePct: percent('realIncome'), wagesPct: percent('wages'), priceIndexPct: percent('priceIndex'),
        domesticSharePp: on.domesticShares.map((v, i) => 100 * (v - off.domesticShares[i])),
        crossRegionSharePp: 100 * (on.crossRegionShare - off.crossRegionShare),
        sharePp: matrix(3, (i, j) => 100 * (on.shares[i][j] - off.shares[i][j]))
      },
      diagnostics: {
        converged: off.diagnostics.converged && on.diagnostics.converged,
        maxRelativeMarketError: Math.max(off.diagnostics.maxRelativeMarketError, on.diagnostics.maxRelativeMarketError),
        interpretation: 'Illustrative comparative statics; not calibrated historical effects or project net benefits.'
      }
    };
  }
  return {version: VERSION, run, solve};
});
