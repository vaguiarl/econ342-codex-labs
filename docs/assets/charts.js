(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const PALETTE = [
    "#a6192e",
    "#3d6f8e",
    "#3f7d6a",
    "#c99700",
    "#76558f",
    "#cf6f3c",
    "#607d8b"
  ];
  const INK = "#172a35";
  const MUTED = "#5f707a";
  const GRID = "#d6e0e5";
  const SOFT = "#edf1f3";
  let chartId = 0;
  let tooltip;

  const el = (tag, attrs = {}, text) => {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([name, value]) => {
      if (value !== undefined && value !== null) node.setAttribute(name, String(value));
    });
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };

  const resolve = (target) => {
    if (typeof target === "string") return document.querySelector(target);
    return target instanceof Element ? target : null;
  };

  const finite = (value) => Number.isFinite(Number(value));
  const numeric = (value, fallback = 0) => finite(value) ? Number(value) : fallback;
  const clamp = (value, low, high) => Math.min(Math.max(value, low), high);
  const identity = (value) => value;
  const compactFormatter = new Intl.NumberFormat("en-CA", {
    notation: "compact",
    maximumFractionDigits: 1
  });
  const standardFormatter = new Intl.NumberFormat("en-CA", {
    maximumFractionDigits: 2
  });

  const formatter = (format, fallback = standardFormatter.format) => {
    if (typeof format === "function") return format;
    if (format === "compact") return compactFormatter.format;
    if (format === "percent") return (value) => `${standardFormatter.format(value)}%`;
    return fallback;
  };

  const getTooltip = () => {
    if (tooltip?.isConnected) return tooltip;
    tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    tooltip.hidden = true;
    tooltip.style.whiteSpace = "pre-line";
    tooltip.setAttribute("role", "status");
    tooltip.setAttribute("aria-live", "polite");
    document.body.append(tooltip);
    return tooltip;
  };

  const positionTooltip = (x, y) => {
    const tip = getTooltip();
    const offset = 14;
    const width = tip.offsetWidth || 220;
    const height = tip.offsetHeight || 70;
    tip.style.left = `${clamp(x + offset, 8, window.innerWidth - width - 8)}px`;
    tip.style.top = `${clamp(y + offset, 8, window.innerHeight - height - 8)}px`;
    tip.style.transform = "none";
  };

  const bindTooltip = (node, label, detail) => {
    const content = typeof detail === "function" ? detail : () => detail || label;
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", label);
    node.style.cursor = "help";

    const show = (event) => {
      const tip = getTooltip();
      tip.textContent = content() || label;
      tip.hidden = false;
      const bounds = node.getBoundingClientRect();
      const x = finite(event?.clientX) && event.clientX !== 0 ? event.clientX : bounds.left + bounds.width / 2;
      const y = finite(event?.clientY) && event.clientY !== 0 ? event.clientY : bounds.top + bounds.height / 2;
      positionTooltip(x, y);
      node.dataset.previousStroke = node.getAttribute("stroke") || "";
      node.dataset.previousStrokeWidth = node.getAttribute("stroke-width") || "";
      node.setAttribute("stroke", "#c99700");
      node.setAttribute("stroke-width", "4");
    };
    const hide = () => {
      const tip = getTooltip();
      tip.hidden = true;
      if (node.dataset.previousStroke) node.setAttribute("stroke", node.dataset.previousStroke);
      else node.removeAttribute("stroke");
      if (node.dataset.previousStrokeWidth) node.setAttribute("stroke-width", node.dataset.previousStrokeWidth);
      else node.removeAttribute("stroke-width");
    };

    node.addEventListener("pointerenter", show);
    node.addEventListener("pointermove", (event) => positionTooltip(event.clientX, event.clientY));
    node.addEventListener("pointerleave", hide);
    node.addEventListener("focus", show);
    node.addEventListener("blur", hide);
  };

  const svgBase = (target, options, width, height) => {
    const container = resolve(target);
    if (!container) return null;
    container.replaceChildren();
    container.classList.add("chart");
    const id = `econ-chart-${++chartId}`;
    const svg = el("svg", {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-labelledby": `${id}-title ${id}-desc`
    });
    const title = el("title", { id: `${id}-title` }, options.title || "Interactive chart");
    const description = el(
      "desc",
      { id: `${id}-desc` },
      options.description || "Use Tab to focus chart marks and reveal their values."
    );
    svg.append(title, description);
    container.append(svg);
    return { container, svg, width, height };
  };

  const padDomain = (domain, fraction = 0.07) => {
    let [low, high] = domain.map(Number);
    if (!finite(low) || !finite(high)) return [0, 1];
    if (low > high) [low, high] = [high, low];
    if (low === high) {
      const amount = Math.abs(low || 1) * 0.5;
      return [low - amount, high + amount];
    }
    const amount = (high - low) * fraction;
    return [low - amount, high + amount];
  };

  const makeScale = (domain, range, log = false) => {
    let [d0, d1] = domain.map(Number);
    const [r0, r1] = range.map(Number);
    if (log) {
      d0 = Math.max(d0, Number.MIN_VALUE);
      d1 = Math.max(d1, d0 * 1.000001);
      const a = Math.log(d0);
      const b = Math.log(d1);
      return (value) => r0 + ((Math.log(Math.max(Number(value), Number.MIN_VALUE)) - a) / (b - a)) * (r1 - r0);
    }
    if (d0 === d1) return () => (r0 + r1) / 2;
    return (value) => r0 + ((Number(value) - d0) / (d1 - d0)) * (r1 - r0);
  };

  const ticks = (domain, count = 5, log = false) => {
    const [low, high] = domain;
    if (log) {
      const a = Math.log(low);
      const b = Math.log(high);
      return Array.from({ length: count }, (_, index) => Math.exp(a + ((b - a) * index) / (count - 1)));
    }
    return Array.from({ length: count }, (_, index) => low + ((high - low) * index) / (count - 1));
  };

  const appendText = (parent, x, y, text, attrs = {}) => {
    const node = el("text", {
      x,
      y,
      fill: MUTED,
      "font-family": "Inter, system-ui, sans-serif",
      "font-size": 16,
      ...attrs
    }, text);
    parent.append(node);
    return node;
  };

  const drawXAxis = (svg, scale, domain, bounds, options = {}) => {
    const values = ticks(domain, options.tickCount || 5, options.log);
    const format = formatter(options.format, compactFormatter.format);
    values.forEach((value) => {
      const x = scale(value);
      svg.append(el("line", {
        x1: x,
        y1: bounds.top,
        x2: x,
        y2: bounds.bottom,
        stroke: GRID,
        "stroke-width": 1
      }));
      appendText(svg, x, bounds.bottom + 27, format(value), {
        "text-anchor": "middle",
        "font-size": 18
      });
    });
    svg.append(el("line", {
      x1: bounds.left,
      y1: bounds.bottom,
      x2: bounds.right,
      y2: bounds.bottom,
      stroke: MUTED,
      "stroke-width": 1.5
    }));
    if (options.label) {
      appendText(svg, (bounds.left + bounds.right) / 2, bounds.bottom + 57, options.label, {
        "text-anchor": "middle",
        fill: INK,
        "font-size": 20,
        "font-weight": 700
      });
    }
  };

  const drawYAxis = (svg, scale, domain, bounds, options = {}) => {
    const values = ticks(domain, options.tickCount || 5, options.log);
    const format = formatter(options.format, compactFormatter.format);
    values.forEach((value) => {
      const y = scale(value);
      svg.append(el("line", {
        x1: bounds.left,
        y1: y,
        x2: bounds.right,
        y2: y,
        stroke: GRID,
        "stroke-width": 1
      }));
      appendText(svg, bounds.left - 12, y + 5, format(value), {
        "text-anchor": "end",
        "font-size": 18
      });
    });
    svg.append(el("line", {
      x1: bounds.left,
      y1: bounds.top,
      x2: bounds.left,
      y2: bounds.bottom,
      stroke: MUTED,
      "stroke-width": 1.5
    }));
    if (options.label) {
      const label = appendText(svg, 22, (bounds.top + bounds.bottom) / 2, options.label, {
        "text-anchor": "middle",
        fill: INK,
        "font-size": 20,
        "font-weight": 700,
        transform: `rotate(-90 22 ${(bounds.top + bounds.bottom) / 2})`
      });
      label.setAttribute("aria-hidden", "true");
    }
  };

  const dataMessage = (target, options, message = "No data available") => {
    const base = svgBase(target, options, 900, 360);
    if (!base) return null;
    appendText(base.svg, 450, 180, message, {
      "text-anchor": "middle",
      fill: MUTED,
      "font-size": 22,
      "font-weight": 700
    });
    return base.svg;
  };

  const legend = (svg, entries, x, y, maxWidth = 760) => {
    let cursorX = x;
    let cursorY = y;
    entries.forEach((entry) => {
      const itemWidth = Math.min(maxWidth, 36 + String(entry.label).length * 9);
      if (cursorX + itemWidth > x + maxWidth) {
        cursorX = x;
        cursorY += 26;
      }
      svg.append(el("rect", {
        x: cursorX,
        y: cursorY - 12,
        width: 16,
        height: 16,
        rx: 3,
        fill: entry.color
      }));
      appendText(svg, cursorX + 23, cursorY + 1, entry.label, {
        fill: INK,
        "font-size": 17,
        "font-weight": 650
      });
      cursorX += itemWidth;
    });
    return cursorY;
  };

  const horizontalBars = (target, data, options = {}) => {
    const rows = (Array.isArray(data) ? data : []).filter((d) => finite(d?.value));
    if (!rows.length) return dataMessage(target, options);
    const valueFormat = formatter(options.valueFormat);
    const left = options.leftMargin || clamp(Math.max(...rows.map((d) => String(d.label || "").length)) * 9 + 28, 150, 285);
    const rowHeight = options.rowHeight || 48;
    const width = options.width || 960;
    const margin = { top: 24, right: options.rightMargin || 110, bottom: 72, left };
    const height = Math.max(options.height || 0, margin.top + margin.bottom + rows.length * rowHeight);
    const base = svgBase(target, options, width, height);
    if (!base) return null;
    const values = rows.map((d) => Number(d.value));
    const requested = options.domain?.map(Number);
    let domain = requested?.length === 2 ? requested : [Math.min(0, ...values), Math.max(0, ...values)];
    if (!requested) {
      const span = domain[1] - domain[0] || 1;
      domain = [domain[0] - (domain[0] < 0 ? span * 0.04 : 0), domain[1] + span * 0.08];
    }
    const scale = makeScale(domain, [margin.left, width - margin.right]);
    const bounds = { left: margin.left, right: width - margin.right, top: margin.top, bottom: height - margin.bottom };
    drawXAxis(base.svg, scale, domain, bounds, {
      label: options.xLabel,
      format: options.axisFormat || options.valueFormat,
      tickCount: options.tickCount
    });
    if (domain[0] <= 0 && domain[1] >= 0) {
      base.svg.append(el("line", {
        x1: scale(0), y1: bounds.top, x2: scale(0), y2: bounds.bottom,
        stroke: INK, "stroke-width": 2
      }));
    }

    const band = (bounds.bottom - bounds.top) / rows.length;
    rows.forEach((row, index) => {
      const value = Number(row.value);
      const y = bounds.top + index * band + band * 0.16;
      const barHeight = band * 0.68;
      const x0 = scale(Math.min(0, value));
      const x1 = scale(Math.max(0, value));
      appendText(base.svg, margin.left - 13, y + barHeight / 2 + 6, row.label || "", {
        "text-anchor": "end",
        fill: INK,
        "font-size": options.labelSize || 19,
        "font-weight": 650
      });
      const bar = el("rect", {
        x: Math.min(x0, x1),
        y,
        width: Math.max(2, Math.abs(x1 - x0)),
        height: barHeight,
        rx: Math.min(6, barHeight / 4),
        fill: row.color || options.color || (value >= 0 ? PALETTE[0] : PALETTE[1])
      });
      base.svg.append(bar);
      const display = row.display ?? valueFormat(value);
      appendText(base.svg, value >= 0 ? x1 + 10 : x0 - 10, y + barHeight / 2 + 6, display, {
        "text-anchor": value >= 0 ? "start" : "end",
        fill: INK,
        "font-size": 18,
        "font-weight": 800
      });
      const aria = `${row.label}: ${display}`;
      bindTooltip(bar, aria, options.tooltip ? () => options.tooltip(row) : `${aria}${row.detail ? `\n${row.detail}` : ""}`);
    });
    return base.svg;
  };

  const stackedHorizontalBars = (target, data, options = {}) => {
    const rows = (Array.isArray(data) ? data : [])
      .map((row) => ({ ...row, segments: (row.segments || []).filter((segment) => finite(segment?.value)) }))
      .filter((row) => row.segments.length);
    if (!rows.length) return dataMessage(target, options);
    const labels = [...new Set(rows.flatMap((row) => row.segments.map((segment) => segment.label || "Series")))];
    const colorMap = new Map(labels.map((label, index) => [label, PALETTE[index % PALETTE.length]]));
    rows.forEach((row) => row.segments.forEach((segment) => {
      if (segment.color) colorMap.set(segment.label || "Series", segment.color);
    }));
    const left = options.leftMargin || clamp(Math.max(...rows.map((d) => String(d.label || "").length)) * 9 + 28, 130, 240);
    const width = options.width || 960;
    const margin = { top: options.showLegend === false ? 25 : 62, right: 90, bottom: 72, left };
    const rowHeight = options.rowHeight || 58;
    const height = Math.max(options.height || 0, margin.top + margin.bottom + rows.length * rowHeight);
    const base = svgBase(target, options, width, height);
    if (!base) return null;
    if (options.showLegend !== false) {
      legend(base.svg, labels.map((label) => ({ label, color: colorMap.get(label) })), margin.left, 24, width - margin.left - 30);
    }

    const normalizedRows = rows.map((row) => {
      const total = row.segments.reduce((sum, segment) => sum + Math.max(0, Number(segment.value)), 0);
      return {
        ...row,
        total,
        segments: row.segments.map((segment) => ({
          ...segment,
          plottedValue: options.normalize && total ? (Number(segment.value) / total) * 100 : Number(segment.value)
        }))
      };
    });
    const totals = normalizedRows.map((row) => row.segments.reduce((sum, segment) => sum + Math.max(0, segment.plottedValue), 0));
    const domain = options.domain || [0, Math.max(...totals) * 1.05 || 1];
    const scale = makeScale(domain, [margin.left, width - margin.right]);
    const bounds = { left: margin.left, right: width - margin.right, top: margin.top, bottom: height - margin.bottom };
    drawXAxis(base.svg, scale, domain, bounds, {
      label: options.xLabel,
      format: options.axisFormat || (options.normalize ? "percent" : options.valueFormat),
      tickCount: options.tickCount
    });
    const rawFormat = formatter(options.valueFormat);
    const band = (bounds.bottom - bounds.top) / normalizedRows.length;
    normalizedRows.forEach((row, rowIndex) => {
      const y = bounds.top + rowIndex * band + band * 0.18;
      const barHeight = band * 0.64;
      appendText(base.svg, margin.left - 13, y + barHeight / 2 + 6, row.label || "", {
        "text-anchor": "end", fill: INK, "font-size": 19, "font-weight": 700
      });
      let running = 0;
      row.segments.forEach((segment) => {
        const start = running;
        running += Math.max(0, segment.plottedValue);
        const x0 = scale(start);
        const x1 = scale(running);
        const mark = el("rect", {
          x: x0,
          y,
          width: Math.max(1.5, x1 - x0),
          height: barHeight,
          fill: segment.color || colorMap.get(segment.label || "Series")
        });
        base.svg.append(mark);
        const display = segment.display ?? rawFormat(Number(segment.value));
        const aria = `${row.label}, ${segment.label}: ${display}`;
        bindTooltip(mark, aria, options.tooltip ? () => options.tooltip(segment, row) : `${aria}${segment.detail ? `\n${segment.detail}` : ""}`);
        if (x1 - x0 > 68) {
          appendText(base.svg, (x0 + x1) / 2, y + barHeight / 2 + 5, display, {
            "text-anchor": "middle", fill: "white", "font-size": 16, "font-weight": 800,
            "pointer-events": "none"
          });
        }
      });
      if (options.showTotals) {
        appendText(base.svg, scale(running) + 9, y + barHeight / 2 + 6, rawFormat(row.total), {
          fill: INK, "font-size": 17, "font-weight": 800
        });
      }
    });
    return base.svg;
  };

  const normalizeSeries = (series) => {
    if (!Array.isArray(series)) return [];
    if (series.length && finite(series[0]?.x) && finite(series[0]?.y)) {
      return [{ label: "Series", values: series }];
    }
    return series
      .map((item, index) => ({ ...item, label: item.label || `Series ${index + 1}`, values: item.values || item.data || [] }))
      .filter((item) => item.values.some((point) => finite(point?.x) && finite(point?.y)));
  };

  const lineChart = (target, data, options = {}) => {
    const series = normalizeSeries(data);
    if (!series.length) return dataMessage(target, options);
    const all = series.flatMap((item) => item.values).filter((point) => finite(point?.x) && finite(point?.y));
    if (!all.length) return dataMessage(target, options);
    const width = options.width || 960;
    const height = options.height || 500;
    const margin = { top: series.length > 1 && options.showLegend !== false ? 58 : 28, right: 35, bottom: 78, left: 88 };
    const base = svgBase(target, options, width, height);
    if (!base) return null;
    const colors = new Map(series.map((item, index) => [item.label, item.color || PALETTE[index % PALETTE.length]]));
    if (series.length > 1 && options.showLegend !== false) {
      legend(base.svg, series.map((item) => ({ label: item.label, color: colors.get(item.label) })), margin.left, 24, width - margin.left - 20);
    }
    let xDomain = options.xDomain || [Math.min(...all.map((point) => Number(point.x))), Math.max(...all.map((point) => Number(point.x)))];
    let yDomain = options.yDomain || [Math.min(...all.map((point) => Number(point.y))), Math.max(...all.map((point) => Number(point.y)))];
    if (!options.xDomain) xDomain = padDomain(xDomain, 0.015);
    if (!options.yDomain) {
      if (options.zeroBaseline !== false && yDomain[0] >= 0) yDomain[0] = 0;
      yDomain = padDomain(yDomain, 0.06);
      if (options.zeroBaseline !== false && Math.min(...all.map((point) => Number(point.y))) >= 0) yDomain[0] = 0;
    }
    const bounds = { left: margin.left, right: width - margin.right, top: margin.top, bottom: height - margin.bottom };
    const xScale = makeScale(xDomain, [bounds.left, bounds.right], options.logX);
    const yScale = makeScale(yDomain, [bounds.bottom, bounds.top], options.logY);
    drawXAxis(base.svg, xScale, xDomain, bounds, {
      label: options.xLabel,
      format: options.xFormat,
      tickCount: options.xTicks || 6,
      log: options.logX
    });
    drawYAxis(base.svg, yScale, yDomain, bounds, {
      label: options.yLabel,
      format: options.yFormat || options.valueFormat,
      tickCount: options.yTicks || 5,
      log: options.logY
    });

    (options.referenceLines || []).forEach((reference) => {
      if (finite(reference.y)) {
        const y = yScale(reference.y);
        base.svg.append(el("line", { x1: bounds.left, y1: y, x2: bounds.right, y2: y, stroke: reference.color || MUTED, "stroke-dasharray": "8 7", "stroke-width": 2 }));
        if (reference.label) appendText(base.svg, bounds.right - 4, y - 8, reference.label, { "text-anchor": "end", "font-size": 14, fill: reference.color || MUTED });
      }
      if (finite(reference.x)) {
        const x = xScale(reference.x);
        base.svg.append(el("line", { x1: x, y1: bounds.top, x2: x, y2: bounds.bottom, stroke: reference.color || MUTED, "stroke-dasharray": "8 7", "stroke-width": 2 }));
        if (reference.label) appendText(base.svg, x + 7, bounds.top + 16, reference.label, { "font-size": 14, fill: reference.color || MUTED });
      }
    });

    const xFormat = formatter(options.xFormat, standardFormatter.format);
    const yFormat = formatter(options.valueFormat || options.yFormat);
    series.forEach((item) => {
      const values = item.values.filter((point) => finite(point?.x) && finite(point?.y)).sort((a, b) => Number(a.x) - Number(b.x));
      const points = values.map((point) => `${xScale(point.x)},${yScale(point.y)}`).join(" ");
      base.svg.append(el("polyline", {
        points,
        fill: "none",
        stroke: colors.get(item.label),
        "stroke-width": options.lineWidth || 4,
        "stroke-linejoin": "round",
        "stroke-linecap": "round"
      }));
      values.forEach((point) => {
        const mark = el("circle", {
          cx: xScale(point.x),
          cy: yScale(point.y),
          r: options.pointRadius || 5.5,
          fill: colors.get(item.label),
          stroke: "white",
          "stroke-width": 2
        });
        base.svg.append(mark);
        const display = point.display ?? yFormat(Number(point.y));
        const pointLabel = point.label || xFormat(Number(point.x));
        const aria = `${item.label}, ${pointLabel}: ${display}`;
        bindTooltip(mark, aria, options.tooltip ? () => options.tooltip(point, item) : `${aria}${point.detail ? `\n${point.detail}` : ""}`);
      });
    });
    return base.svg;
  };

  const scatterWithFit = (target, data, fit, options = {}) => {
    const points = (Array.isArray(data) ? data : []).filter((point) => finite(point?.x) && finite(point?.y));
    if (!points.length) return dataMessage(target, options);
    const width = options.width || 960;
    const height = options.height || 500;
    const margin = { top: 34, right: 40, bottom: 78, left: 92 };
    const base = svgBase(target, options, width, height);
    if (!base) return null;
    let xDomain = options.xDomain || [Math.min(...points.map((point) => Number(point.x))), Math.max(...points.map((point) => Number(point.x)))];
    let yDomain = options.yDomain || [Math.min(...points.map((point) => Number(point.y))), Math.max(...points.map((point) => Number(point.y)))];
    if (!options.xDomain) xDomain = options.logX ? xDomain : padDomain(xDomain, 0.04);
    if (!options.yDomain) yDomain = options.logY ? yDomain : padDomain(yDomain, 0.08);
    const bounds = { left: margin.left, right: width - margin.right, top: margin.top, bottom: height - margin.bottom };
    const xScale = makeScale(xDomain, [bounds.left, bounds.right], options.logX);
    const yScale = makeScale(yDomain, [bounds.bottom, bounds.top], options.logY);
    drawXAxis(base.svg, xScale, xDomain, bounds, { label: options.xLabel, format: options.xFormat, tickCount: options.xTicks || 6, log: options.logX });
    drawYAxis(base.svg, yScale, yDomain, bounds, { label: options.yLabel, format: options.yFormat || options.valueFormat, tickCount: options.yTicks || 5, log: options.logY });

    let fitPoints = [];
    if (typeof fit === "function") {
      const count = 80;
      fitPoints = Array.from({ length: count }, (_, index) => {
        const t = index / (count - 1);
        const x = options.logX
          ? Math.exp(Math.log(xDomain[0]) + (Math.log(xDomain[1]) - Math.log(xDomain[0])) * t)
          : xDomain[0] + (xDomain[1] - xDomain[0]) * t;
        return { x, y: fit(x) };
      }).filter((point) => finite(point.y) && (!options.logY || point.y > 0));
    } else if (Array.isArray(fit)) {
      fitPoints = fit.filter((point) => finite(point?.x) && finite(point?.y)).sort((a, b) => Number(a.x) - Number(b.x));
    }
    if (fitPoints.length) {
      base.svg.append(el("polyline", {
        points: fitPoints.map((point) => `${xScale(point.x)},${yScale(point.y)}`).join(" "),
        fill: "none",
        stroke: options.fitColor || PALETTE[0],
        "stroke-width": 4,
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }));
      if (options.fitLabel) {
        appendText(base.svg, bounds.right - 8, bounds.top + 20, options.fitLabel, {
          "text-anchor": "end", fill: options.fitColor || PALETTE[0], "font-size": 16, "font-weight": 800
        });
      }
    }

    const xFormat = formatter(options.xFormat, compactFormatter.format);
    const yFormat = formatter(options.valueFormat || options.yFormat);
    points.forEach((point) => {
      const mark = el("circle", {
        cx: xScale(point.x),
        cy: yScale(point.y),
        r: point.radius || options.pointRadius || 7,
        fill: point.color || options.pointColor || PALETTE[1],
        "fill-opacity": point.opacity || options.pointOpacity || 0.82,
        stroke: "white",
        "stroke-width": 2
      });
      base.svg.append(mark);
      const label = point.label || xFormat(Number(point.x));
      const display = point.display ?? yFormat(Number(point.y));
      const aria = `${label}: ${display}`;
      bindTooltip(mark, aria, options.tooltip ? () => options.tooltip(point) : `${aria}${point.detail ? `\n${point.detail}` : ""}`);
    });
    return base.svg;
  };

  const coefficientPlot = (target, data, options = {}) => {
    const rows = (Array.isArray(data) ? data : []).filter((row) => finite(row?.value) && finite(row?.low) && finite(row?.high));
    if (!rows.length) return dataMessage(target, options);
    const valueFormat = formatter(options.valueFormat, (value) => Number(value).toFixed(2));
    const reference = finite(options.reference) ? Number(options.reference) : 0;
    const width = options.width || 960;
    const rowHeight = options.rowHeight || 55;
    const left = options.leftMargin || clamp(Math.max(...rows.map((row) => String(row.label || "").length)) * 9 + 30, 170, 285);
    const margin = { top: 28, right: 95, bottom: 74, left };
    const height = Math.max(options.height || 0, margin.top + margin.bottom + rows.length * rowHeight);
    const base = svgBase(target, options, width, height);
    if (!base) return null;
    let domain = options.domain || [Math.min(reference, ...rows.map((row) => Number(row.low))), Math.max(reference, ...rows.map((row) => Number(row.high)))];
    if (!options.domain) domain = padDomain(domain, 0.12);
    const bounds = { left: margin.left, right: width - margin.right, top: margin.top, bottom: height - margin.bottom };
    const scale = makeScale(domain, [bounds.left, bounds.right]);
    drawXAxis(base.svg, scale, domain, bounds, { label: options.xLabel, format: options.axisFormat || options.valueFormat, tickCount: options.tickCount || 6 });
    if (reference >= domain[0] && reference <= domain[1]) {
      base.svg.append(el("line", {
        x1: scale(reference), y1: bounds.top, x2: scale(reference), y2: bounds.bottom,
        stroke: INK, "stroke-width": 2.5, "stroke-dasharray": "7 6"
      }));
      if (options.referenceLabel) appendText(base.svg, scale(reference) + 7, bounds.top + 16, options.referenceLabel, { fill: INK, "font-size": 14 });
    }
    const band = (bounds.bottom - bounds.top) / rows.length;
    rows.forEach((row, index) => {
      const y = bounds.top + (index + 0.5) * band;
      appendText(base.svg, margin.left - 14, y + 6, row.label || "", {
        "text-anchor": "end", fill: INK, "font-size": 19, "font-weight": 700
      });
      base.svg.append(el("line", {
        x1: scale(row.low), y1: y, x2: scale(row.high), y2: y,
        stroke: row.color || options.color || PALETTE[1], "stroke-width": 5, "stroke-linecap": "round"
      }));
      base.svg.append(el("line", { x1: scale(row.low), y1: y - 7, x2: scale(row.low), y2: y + 7, stroke: row.color || options.color || PALETTE[1], "stroke-width": 3 }));
      base.svg.append(el("line", { x1: scale(row.high), y1: y - 7, x2: scale(row.high), y2: y + 7, stroke: row.color || options.color || PALETTE[1], "stroke-width": 3 }));
      const mark = el("circle", {
        cx: scale(row.value), cy: y, r: 8,
        fill: row.color || options.color || PALETTE[0], stroke: "white", "stroke-width": 2.5
      });
      base.svg.append(mark);
      if (options.showValues !== false) {
        appendText(base.svg, width - margin.right + 10, y + 6, row.display ?? valueFormat(row.value), {
          fill: INK, "font-size": 17, "font-weight": 800
        });
      }
      const aria = `${row.label}: ${row.display ?? valueFormat(row.value)}; interval ${valueFormat(row.low)} to ${valueFormat(row.high)}`;
      bindTooltip(mark, aria, options.tooltip ? () => options.tooltip(row) : `${aria}${row.detail ? `\n${row.detail}` : ""}`);
    });
    return base.svg;
  };

  const wrapLabel = (text, max = 13) => {
    const words = String(text || "").split(/\s+/);
    const lines = [""];
    words.forEach((word) => {
      const current = lines[lines.length - 1];
      if (!current || `${current} ${word}`.length <= max) lines[lines.length - 1] = current ? `${current} ${word}` : word;
      else if (lines.length < 2) lines.push(word);
      else lines[1] = `${lines[1]}…`;
    });
    return lines;
  };

  const waterfall = (target, data, options = {}) => {
    const source = (Array.isArray(data) ? data : []).filter((item) => finite(item?.value) || finite(item?.cumulative) || (finite(item?.start) && finite(item?.end)));
    if (!source.length) return dataMessage(target, options);
    let running = numeric(options.start, 0);
    const rows = source.map((item) => {
      let start = finite(item.start) ? Number(item.start) : running;
      let end;
      if (finite(item.end)) end = Number(item.end);
      else if (finite(item.cumulative)) end = Number(item.cumulative);
      else end = start + Number(item.value);
      if (item.isTotal && !finite(item.start)) start = numeric(options.baseline, 0);
      const change = end - start;
      running = end;
      return { ...item, start, end, change };
    });
    const width = options.width || 960;
    const height = options.height || 500;
    const margin = { top: 34, right: 35, bottom: 108, left: 92 };
    const base = svgBase(target, options, width, height);
    if (!base) return null;
    let domain = options.domain || [Math.min(0, ...rows.flatMap((row) => [row.start, row.end])), Math.max(0, ...rows.flatMap((row) => [row.start, row.end]))];
    if (!options.domain) domain = padDomain(domain, 0.1);
    const bounds = { left: margin.left, right: width - margin.right, top: margin.top, bottom: height - margin.bottom };
    const yScale = makeScale(domain, [bounds.bottom, bounds.top]);
    drawYAxis(base.svg, yScale, domain, bounds, { label: options.yLabel, format: options.axisFormat || options.valueFormat, tickCount: options.tickCount || 5 });
    const band = (bounds.right - bounds.left) / rows.length;
    const barWidth = Math.min(78, band * 0.62);
    const valueFormat = formatter(options.valueFormat);
    rows.forEach((row, index) => {
      const center = bounds.left + (index + 0.5) * band;
      const top = yScale(Math.max(row.start, row.end));
      const bottom = yScale(Math.min(row.start, row.end));
      const color = row.color || (row.isTotal ? PALETTE[3] : row.change >= 0 ? PALETTE[2] : PALETTE[0]);
      const mark = el("rect", {
        x: center - barWidth / 2,
        y: top,
        width: barWidth,
        height: Math.max(2, bottom - top),
        rx: 5,
        fill: color
      });
      base.svg.append(mark);
      if (index < rows.length - 1) {
        const nextCenter = bounds.left + (index + 1.5) * band;
        base.svg.append(el("line", {
          x1: center + barWidth / 2,
          y1: yScale(row.end),
          x2: nextCenter - barWidth / 2,
          y2: yScale(row.end),
          stroke: MUTED,
          "stroke-width": 1.5,
          "stroke-dasharray": "5 4"
        }));
      }
      const display = row.display ?? valueFormat(row.change);
      appendText(base.svg, center, top - 9, display, {
        "text-anchor": "middle", fill: INK, "font-size": 16, "font-weight": 800
      });
      const lines = wrapLabel(row.label, options.labelLength || 14);
      lines.forEach((line, lineIndex) => appendText(base.svg, center, bounds.bottom + 28 + lineIndex * 18, line, {
        "text-anchor": "middle", fill: INK, "font-size": 16, "font-weight": 650
      }));
      const aria = `${row.label}: ${display}; from ${valueFormat(row.start)} to ${valueFormat(row.end)}`;
      bindTooltip(mark, aria, options.tooltip ? () => options.tooltip(row) : `${aria}${row.detail ? `\n${row.detail}` : ""}`);
    });
    if (domain[0] <= 0 && domain[1] >= 0) {
      base.svg.append(el("line", { x1: bounds.left, y1: yScale(0), x2: bounds.right, y2: yScale(0), stroke: INK, "stroke-width": 2 }));
    }
    if (options.xLabel) appendText(base.svg, (bounds.left + bounds.right) / 2, height - 10, options.xLabel, { "text-anchor": "middle", fill: INK, "font-size": 20, "font-weight": 700 });
    return base.svg;
  };

  window.EconCharts = {
    horizontalBars,
    stackedHorizontalBars,
    lineChart,
    scatterWithFit,
    coefficientPlot,
    waterfall
  };
})();
