"""Build an illustrative task model, not an estimate of Canadian wage effects.

Production: Y = 2 sqrt(H * (L + R)). H is a human task complementary to
robot services; L is a human task perfectly substitutable with robot services R.
Hold H = L = 1, the output price at one, and pay each input its marginal product.
Human hours and the two workers' task assignments stay fixed in this example.
Then w_H = sqrt(1 + R), w_L = 1 / sqrt(1 + R), Y/(H+L) = sqrt(1+R).
The average hourly wage is (w_H + w_L)/2 because human hours are equal.
All plotted series are indexed to their own R=0 value of 100.
"""

import argparse
import csv
import json
import math
import shutil
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


ROOT = Path(__file__).resolve().parents[2]


def outcome(robots):
    productivity = math.sqrt(1 + robots)
    substitute_wage = 1 / productivity
    return {
        "robot_capacity": robots,
        "productivity_index": 100 * productivity,
        "complementary_task_wage_index": 100 * productivity,
        "substitutable_task_wage_index": 100 * substitute_wage,
        "average_hourly_wage_index": 50 * (productivity + substitute_wage),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--course-root", type=Path)
    args = parser.parse_args()
    output = ROOT / "docs/week08/data"
    output.mkdir(parents=True, exist_ok=True)
    rows = [outcome(i / 100) for i in range(101)]
    with (output / "ai_robotics_model.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    assumptions = {
        "status": "Illustrative competitive task model; not Canadian estimates or a forecast",
        "production_function": "Y = 2 sqrt(H (L + R))",
        "human_inputs": {"H": 1, "L": 1},
        "robot_capacity_range": [0, 1],
        "output_price": 1,
        "wage_rule": "Value of the marginal product; unchanged output price",
        "adjustment": "Human hours and task assignments are fixed; new tasks and retraining are outside this illustration",
        "baseline": "Each series at R=0 is indexed to 100",
        "endpoint": rows[-1],
        "interpretation": "Robots add output and complement H, while reducing the marginal product of substitutable human input L. Average wages rise less than productivity, and one task wage falls.",
    }
    (output / "ai_robotics_model.json").write_text(json.dumps(assumptions, indent=2) + "\n")

    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 15, "svg.fonttype": "none"})
    fig, ax = plt.subplots(figsize=(12.8, 4.3))
    fig.subplots_adjust(left=0.09, right=0.98, bottom=0.24, top=0.97)
    x = [r["robot_capacity"] for r in rows]
    series = [
        ("productivity_index", "#3d6f8e", "Output per human hour", "+41.4%"),
        ("average_hourly_wage_index", "#3f7d6a", "Average hourly wage", "+6.1%"),
        ("substitutable_task_wage_index", "#a6192e", "Pay for the task robots can do", "-29.3%"),
    ]
    ax.axhline(100, color="#8b9aa2", lw=1.6, linestyle=(0, (4, 4)))
    for key, colour, label, change in series:
        ys = [r[key] for r in rows]
        ax.plot(x, ys, color=colour, linewidth=3.6)
        ax.plot([1], [ys[-1]], "o", color=colour, markersize=7)
        ax.text(1.035, ys[-1], f"{label}\n{change}", color=colour, va="center", fontsize=15, fontweight="bold")
    ax.text(0.03, 102.5, "Before AI = 100", color="#667d89", fontsize=12)
    ax.set(xlim=(0, 1.64), ylim=(60, 153), xticks=[0, 0.5, 1], yticks=[75, 100, 125, 150])
    ax.set_xlabel("Robot task capacity added (one worker's substitutable task = 1)", fontsize=14, labelpad=11)
    ax.set_ylabel("Index", fontsize=15)
    ax.tick_params(axis="both", labelsize=14, colors="#2f4858", length=0, pad=8)
    ax.grid(axis="y", color="#edf1f3", linewidth=1)
    for spine in ("top", "right"):
        ax.spines[spine].set_visible(False)
    for spine in ("bottom", "left"):
        ax.spines[spine].set_color("#c8d3d9")
    for suffix in ("png", "svg"):
        fig.savefig(output / f"ai_robotics_productivity_wages.{suffix}", dpi=200, facecolor="white")
    svg = output / "ai_robotics_productivity_wages.svg"
    svg.write_text("\n".join(line.rstrip() for line in svg.read_text().splitlines()) + "\n")
    plt.close(fig)
    if args.course_root:
        destination = args.course_root / "tex/figures/generated/ai_robotics_productivity_wages.png"
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(output / "ai_robotics_productivity_wages.png", destination)
    print("Built model CSV, assumptions and editable SVG/PNG graph:", output)


if __name__ == "__main__":
    main()
