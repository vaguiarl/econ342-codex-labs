(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const names = ['Atlantic US', 'Pacific US', 'Pacific Asia'];
  let selected = 'on';
  let result;
  const number = (value, digits = 1) => Number(value).toLocaleString('en-CA', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const signed = (value, digits = 2) => `${Math.abs(value) < .5 * 10 ** -digits ? '' : value > 0 ? '+' : '−'}${number(Math.abs(value) < .5 * 10 ** -digits ? 0 : Math.abs(value), digits)}`;
  const values = () => ({ theta: Number($('#theta').value), freight: Number($('#freight').value) / 100 });
  function render() {
    try {
      const parameters = values();
      if (!window.PanamaModel || typeof PanamaModel.run !== 'function') throw new Error('The model engine is unavailable. Keep model.js beside this page and reload.');
      result = PanamaModel.run(parameters);
      const state = result[selected];
      if (!state || !state.diagnostics.converged) throw new Error('The model could not solve these assumptions. Try resetting the controls.');
      $('#model-error').hidden = true;
      $('#theta-value').textContent = number(parameters.theta, Number.isInteger(parameters.theta) ? 0 : 2);
      $('#freight-value').textContent = `${number(parameters.freight * 100, 0)}%`;
      $('#theta').setAttribute('aria-valuetext', `${parameters.theta}, trade elasticity`);
      $('#freight').setAttribute('aria-valuetext', `${parameters.freight * 100} percent extra shipping resources at 10,000 nautical miles`);
      document.querySelectorAll('[data-state]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.state === selected)));
      const label = `Canal ${selected}`;
      $('#state-label').textContent = label;
      $('#network-title').textContent = `${label} route network`;
      $('#distance-pacific').textContent = number(state.distances[0][1], 0);
      $('#distance-asia').textContent = number(state.distances[0][2], 0);
      $('#network-description').textContent = `New York to San Francisco: ${state.distances[0][1]} nautical miles. New York to Yokohama: ${state.distances[0][2]} nautical miles. San Francisco to Yokohama: 4600 nautical miles, an unchanged assumption.`;
      $('#comparison-label').textContent = `${label} compared with canal off`;
      const changes = selected === 'on' ? result.changes.realIncomePct : [0, 0, 0];
      document.querySelectorAll('[data-income]').forEach(node => { const value = changes[Number(node.dataset.income)]; node.textContent = `${signed(value)}%`; node.classList.toggle('negative', value < -.005); });
      $('#result-summary').textContent = parameters.freight === 0 ? 'With zero shipping resource costs, distance changes have no effect: all real-income and spending-share changes are zero.' : selected === 'off' ? 'The canal-off economy is the baseline. Its changes are zero; select Canal on to compare the shorter-route economy.' : `Illustrative changes from canal off: ${names.map((name, i) => `${name} ${signed(changes[i])}%`).join('; ')}.`;
      $('#trade-caption').textContent = `${label} spending shares; changes from canal off in percentage points`;
      $('#trade-body').replaceChildren(...names.map((name, i) => {
        const tr = document.createElement('tr'); const th = document.createElement('th'); th.scope = 'row'; th.textContent = name; tr.append(th);
        names.forEach((_, j) => { const td = document.createElement('td'); if (i === j) td.className = 'same-region'; const share = document.createElement('span'); share.className = 'share-value'; share.textContent = `${number(state.shares[i][j] * 100)}%`; const change = document.createElement('span'); change.className = 'share-change'; change.textContent = `${signed(selected === 'on' ? result.changes.sharePp[i][j] : 0)} pp`; td.append(share, change); tr.append(td); });
        return tr;
      }));
      $('#cross-region-summary').textContent = `Across all regions, ${number(state.crossRegionShare * 100)}% of spending buys goods from another model region (${signed(selected === 'on' ? result.changes.crossRegionSharePp : 0)} percentage points versus canal off). US coast-to-coast purchases are included.`;
      $('#download-json').disabled = false; $('#download-csv').disabled = false;
    } catch (error) {
      $('#model-error').textContent = error.message; $('#model-error').hidden = false;
      $('#download-json').disabled = true; $('#download-csv').disabled = true;
    }
  }
  function download(text, type, filename) {
    const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  document.querySelectorAll('[data-state]').forEach(button => button.addEventListener('click', () => { selected = button.dataset.state; render(); }));
  ['theta', 'freight'].forEach(id => $(`#${id}`).addEventListener('input', render));
  $('#reset').addEventListener('click', () => { $('#theta').value = '4'; $('#freight').value = '20'; selected = 'on'; render(); });
  $('#download-json').addEventListener('click', () => download(JSON.stringify({ label: 'Illustrative model • historical route inputs. Not a historical estimate.', selectedState: selected, historicalRouteSource: 'https://etc.usf.edu/maps/pages/10400/10479/10479.htm', assumptions: { labor: [2, 1, 3], productivity: [1, 1, 1], sanFranciscoYokohamaNauticalMiles: 4600, fixedLabor: true, constantReturns: true, tolls: false, firmEntry: false }, ...result }, null, 2), 'application/json', 'panama-illustrative-model.json'));
  $('#download-csv').addEventListener('click', () => {
    const rows = [['label', 'Illustrative model; historical route inputs; not a historical estimate'], ['selected_state', selected], ['theta', result.parameters.theta], ['shipping_parameter', result.parameters.freight], [], ['region', 'off_real_income_per_worker', 'on_real_income_per_worker', 'on_vs_off_change_percent']];
    names.forEach((name, i) => rows.push([name, result.off.realIncome[i], result.on.realIncome[i], result.changes.realIncomePct[i]])); rows.push([], ['supplier', 'buyer', 'off_spending_share', 'on_spending_share', 'on_vs_off_change_percentage_points']);
    names.forEach((supplier, i) => names.forEach((buyer, j) => rows.push([supplier, buyer, result.off.shares[i][j], result.on.shares[i][j], result.changes.sharePp[i][j]])));
    download(rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n'), 'text/csv;charset=utf-8', 'panama-illustrative-comparisons.csv');
  });
  window.addEventListener('beforeprint', () => document.querySelectorAll('details').forEach(detail => { detail.dataset.openBeforePrint = detail.open ? '1' : '0'; detail.open = true; }));
  window.addEventListener('afterprint', () => document.querySelectorAll('details').forEach(detail => { detail.open = detail.dataset.openBeforePrint === '1'; }));
  render();
})();
