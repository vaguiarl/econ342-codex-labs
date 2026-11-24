(() => {
  "use strict";
  // Classroom bargaining experiment. Payoff units are illustrative.
  // Two countries split 100, each has a 50% chance of winning and a
  // direct fighting cost of 10. L is each country's expected trade loss.
  document.querySelectorAll("[data-bargaining]").forEach((example) => {
    const slider = example.querySelector("input[type=range]");
    const setText = (key, value) => example.querySelectorAll(`[data-${key}]`)
      .forEach((node) => { node.textContent = String(value); });
    const toX = (value) => 60 + 6.4 * value;
    const render = () => {
      const loss = Math.max(0, Math.min(20, Number(slider.value)));
      const lower = 40 - loss;
      const upper = 60 + loss;
      setText("loss", loss);
      setText("war-payoff", 40 - loss);
      setText("lower", lower);
      setText("upper", upper);
      setText("width", upper - lower);
      const band = example.querySelector("[data-range-band]");
      band.setAttribute("x", toX(lower));
      band.setAttribute("width", toX(upper) - toX(lower));
      for (const [key, value] of [["lower", lower], ["upper", upper]]) {
        example.querySelectorAll(`[data-${key}-line]`).forEach((node) => {
          node.setAttribute("x1", toX(value));
          node.setAttribute("x2", toX(value));
        });
        example.querySelectorAll(`[data-${key}-label]`).forEach((node) => {
          node.setAttribute("x", toX(value));
          node.textContent = String(value);
        });
      }
      example.querySelector("[data-range-description]").textContent =
        `With trade losses of ${loss} for each country, both accept a settlement when A receives between ${lower} and ${upper} out of 100. The interval has width ${upper - lower}. Without trade losses it runs from 40 to 60.`;
      slider.setAttribute("aria-valuetext", `${loss} payoff units of trade loss for each country`);
    };
    slider.addEventListener("input", render);
    render();
  });
})();
