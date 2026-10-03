(() => {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  if (!slides.length) return;

  const count = document.querySelector("[data-slide-count]");
  const currentTitle = document.querySelector("[data-current-title]");
  const progress = document.querySelector("[data-progress]");
  const figureDialog = document.querySelector("#figure-dialog");
  const figureDialogTitle = figureDialog?.querySelector("[data-dialog-title]");
  const figureDialogContent = figureDialog?.querySelector("[data-dialog-content]");
  const overviewDialog = document.querySelector("#overview-dialog");
  const overviewGrid = overviewDialog?.querySelector("[data-overview-grid]");
  let activeIndex = 0;
  let movedContent = null;
  let placeholder = null;
  let expandTrigger = null;
  let touchStartX = null;
  let touchStartY = null;
  let touchStartedOnControl = false;

  const isInteractiveTarget = (target) => Boolean(target?.closest?.(
    "button, a, input, textarea, select, summary, [contenteditable='true'], [role='button'], [tabindex]:not(.slide)"
  ));

  const parseHash = () => {
    const match = location.hash.match(/slide(?:=|-)(\d+)/i);
    const value = match ? Number(match[1]) - 1 : 0;
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), slides.length - 1) : 0;
  };

  const updateHash = () => {
    const nextHash = `#slide=${activeIndex + 1}`;
    history.replaceState(null, "", nextHash);
  };

  const setSlide = (index, { updateUrl = true } = {}) => {
    activeIndex = Math.min(Math.max(index, 0), slides.length - 1);
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.setAttribute("aria-roledescription", "slide");
      slide.tabIndex = active ? 0 : -1;
    });

    const slide = slides[activeIndex];
    const title = slide.dataset.slideTitle || slide.querySelector("h1, h2")?.textContent?.trim() || "Slide";
    if (count) count.textContent = `${activeIndex + 1} / ${slides.length}`;
    if (currentTitle) currentTitle.textContent = title;
    slides[activeIndex].setAttribute("aria-label", `${activeIndex + 1} of ${slides.length}: ${title}`);
    if (progress) {
      progress.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
      progress.parentElement?.setAttribute("aria-valuenow", String(activeIndex + 1));
      progress.parentElement?.setAttribute("aria-valuemax", String(slides.length));
    }
    document.title = `${title} · ECON 342`;
    if (updateUrl) updateHash();
    slide.scrollTop = 0;
    slide.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent("econ342:slidechange", { detail: { index: activeIndex, slide } }));
  };

  const next = () => setSlide(activeIndex + 1);
  const previous = () => setSlide(activeIndex - 1);

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "next") next();
    if (action === "previous") previous();
    if (action === "overview") overviewDialog?.showModal();
    if (action === "fullscreen") {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
    if (action === "close-dialog") event.target.closest("dialog")?.close();

    const expandButton = event.target.closest("[data-expand]");
    if (expandButton && figureDialog && figureDialogContent) {
      const card = expandButton.closest("[data-expandable]");
      const content = card?.querySelector(".expandable-content");
      if (!content) return;
      placeholder = document.createComment("expanded-content-placeholder");
      content.parentNode.insertBefore(placeholder, content);
      movedContent = content;
      expandTrigger = expandButton;
      figureDialogContent.append(content);
      if (figureDialogTitle) figureDialogTitle.textContent = card.querySelector(".figure-title")?.textContent || "Expanded figure";
      figureDialog.showModal();
      window.dispatchEvent(new Event("resize"));
    }
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (isInteractiveTarget(target)) return;
    if (document.querySelector("dialog[open]")) return;
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      next();
    } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      previous();
    } else if (event.key === "Home") {
      event.preventDefault();
      setSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setSlide(slides.length - 1);
    } else if (event.key.toLowerCase() === "o") {
      event.preventDefault();
      overviewDialog?.showModal();
    } else if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") return;
    touchStartedOnControl = isInteractiveTarget(event.target) || Boolean(event.target.closest?.("[data-no-swipe], .interactive-figure"));
    if (touchStartedOnControl) return;
    touchStartX = event.clientX;
    touchStartY = event.clientY;
  }, { passive: true });

  document.addEventListener("pointerup", (event) => {
    if (touchStartedOnControl || touchStartX === null || touchStartY === null || event.pointerType === "mouse") {
      touchStartedOnControl = false;
      return;
    }
    const dx = event.clientX - touchStartX;
    const dy = event.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    if (dx < 0) next();
    else previous();
  }, { passive: true });

  window.addEventListener("hashchange", () => setSlide(parseHash(), { updateUrl: false }));

  figureDialog?.addEventListener("close", () => {
    if (movedContent && placeholder?.parentNode) placeholder.parentNode.insertBefore(movedContent, placeholder);
    placeholder?.remove();
    movedContent = null;
    placeholder = null;
    expandTrigger?.focus({ preventScroll: true });
    expandTrigger = null;
    window.dispatchEvent(new Event("resize"));
  });

  for (const dialog of document.querySelectorAll("dialog")) {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  if (overviewGrid) {
    overviewGrid.replaceChildren(...slides.map((slide, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "overview-button";
      button.innerHTML = `<span>Slide ${index + 1}</span>${slide.dataset.slideTitle || slide.querySelector("h1, h2")?.textContent?.trim() || "Untitled"}`;
      button.addEventListener("click", () => {
        overviewDialog.close();
        setSlide(index);
      });
      return button;
    }));
  }

  window.EconDeck = { next, previous, setSlide, get index() { return activeIndex; }, slides };
  setSlide(parseHash(), { updateUrl: !location.hash });
})();
