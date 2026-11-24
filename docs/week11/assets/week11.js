(() => {
  "use strict";
  document.querySelectorAll("[data-substitution]").forEach((example) => {
    const slider = example.querySelector("input[type=range]");
    const render = () => {
      const preserved = Number(slider.value);
      const lost = 12 - preserved;
      example.querySelectorAll("[data-preserved]").forEach((node) => { node.textContent = preserved; });
      example.querySelectorAll("[data-lost]").forEach((node) => { node.textContent = lost; });
      example.querySelectorAll("[data-net]").forEach((node) => { node.textContent = 7 - 4 - lost; });
      example.querySelector(".preserved-bar").style.width = `${preserved / 12 * 100}%`;
      example.querySelector(".lost-bar").style.width = `${lost / 12 * 100}%`;
      slider.setAttribute("aria-valuetext", `${preserved} units preserved, ${lost} units lost out of 12`);
    };
    slider.addEventListener("input", render);
    render();
  });
})();
