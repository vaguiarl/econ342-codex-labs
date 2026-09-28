#!/usr/bin/env python3
"""ECON 342 Week 3 starter: reconstruct Canada's product-space opportunities.

Ask Codex to help complete one TODO at a time.  Keep the assertions: they are
small tests that catch the most common orientation and denominator mistakes.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


YEAR = 2024
CANADA = "CAN"


def find_repository_root(start: Path) -> Path:
    """Find the public lab repository from either the starter or a team copy."""
    for candidate in (start, *start.parents):
        data_dir = candidate / "labs" / "week03-product-space" / "data"
        if data_dir.is_dir():
            return candidate
    raise FileNotFoundError(
        "Could not find labs/week03-product-space/data above the starter script."
    )


SCRIPT_DIR = Path(__file__).resolve().parent
REPOSITORY_ROOT = find_repository_root(SCRIPT_DIR)
DATA_DIR = REPOSITORY_ROOT / "labs" / "week03-product-space" / "data"
INPUT_PATH = DATA_DIR / f"student_input_hs92_4digit_{YEAR}.csv.gz"
PRODUCT_PATH = DATA_DIR / "hs92_products_4digit.csv"
OUTPUT_DIR = SCRIPT_DIR


def build_export_matrix(trade: pd.DataFrame) -> pd.DataFrame:
    """Return X_cp with countries in rows, HS4 products in columns, zeros filled."""
    # TODO 1: pivot the long data. Use aggfunc="sum" and fill_value=0.
    raise NotImplementedError("Complete TODO 1")


def calculate_rca(exports: pd.DataFrame) -> pd.DataFrame:
    """Calculate Balassa RCA = country export share / world export share."""
    # TODO 2: calculate country totals, product totals, and the world total.
    # TODO 3: divide each country's product share by that product's world share.
    # Define RCA as zero when a product has zero world exports, rather than
    # leaving 0/0 as NaN. The fixed matrix contains one such legacy HS code.
    raise NotImplementedError("Complete TODOs 2-3")


def calculate_proximity(rca: pd.DataFrame) -> pd.DataFrame:
    """Calculate symmetric co-export proximity using M_cp = 1[RCA >= 1]."""
    # TODO 4: create binary M_cp.
    # TODO 5: compute product co-occurrences M.T @ M.
    # TODO 6: divide each pair by max(ubiquity_p, ubiquity_q).
    # Course convention: set the diagonal to zero so density is the weighted
    # share of *other* related products already in Canada's export basket.
    raise NotImplementedError("Complete TODOs 4-6")


def calculate_density(rca: pd.DataFrame, proximity: pd.DataFrame) -> pd.DataFrame:
    """Calculate each country's proximity-weighted presence around each product."""
    # TODO 7: numerator = M @ proximity.
    # TODO 8: denominator = column sums of proximity; divide safely.
    raise NotImplementedError("Complete TODOs 7-8")


def rank_canada_candidates(
    exports: pd.DataFrame,
    rca: pd.DataFrame,
    density: pd.DataFrame,
    products: pd.DataFrame,
) -> pd.DataFrame:
    """Return plausible discussion candidates, not forecasts or recommendations."""
    # TODO 9: make one row per product for Canada with export value, world
    # export value, RCA, and density; merge the product name.
    # TODO 10: keep RCA < 1, Canadian exports >= $10m, world exports >= $1bn;
    # sort by density descending and return the first 15 rows.
    raise NotImplementedError("Complete TODOs 9-10")


def add_top_contributors(
    candidates: pd.DataFrame,
    rca: pd.DataFrame,
    proximity: pd.DataFrame,
    products: pd.DataFrame,
) -> pd.DataFrame:
    """Attach two Canadian RCA products that contribute most to each density."""
    present_codes = rca.columns[rca.loc[CANADA].ge(1)]
    name_lookup = (
        products.drop_duplicates("product_hs92_code")
        .set_index("product_hs92_code")["product_name"]
    )
    records: list[dict[str, object]] = []
    for candidate_code in candidates["product_hs92_code"]:
        weights = proximity.loc[candidate_code, present_codes]
        strongest = weights[weights.gt(0)].sort_values(ascending=False).head(2)
        if len(strongest) != 2:
            raise ValueError(f"Fewer than two positive contributors for {candidate_code}")
        record: dict[str, object] = {}
        for position, (neighbour_code, weight) in enumerate(strongest.items(), start=1):
            record[f"neighbor_{position}_hs92_code"] = neighbour_code
            record[f"neighbor_{position}_product_name"] = name_lookup.loc[neighbour_code]
            record[f"neighbor_{position}_proximity"] = float(weight)
        records.append(record)
    return pd.concat(
        [candidates.reset_index(drop=True), pd.DataFrame.from_records(records)], axis=1
    )


def main() -> None:
    trade = pd.read_csv(
        INPUT_PATH,
        dtype={"country_iso3_code": "string", "product_hs92_code": "string"},
    )
    products = pd.read_csv(PRODUCT_PATH, dtype={"product_hs92_code": "string"})

    exports = build_export_matrix(trade)
    assert CANADA in exports.index
    assert exports.shape == (230, 1241), f"Unexpected export-matrix shape: {exports.shape}"

    rca = calculate_rca(exports)
    assert rca.shape == exports.shape
    assert np.isfinite(rca.to_numpy()).all()

    proximity = calculate_proximity(rca)
    assert proximity.shape == (1241, 1241)
    assert np.allclose(proximity, proximity.T)
    assert np.allclose(np.diag(proximity), 0)

    density = calculate_density(rca, proximity)
    assert density.shape == exports.shape
    assert density.to_numpy().min() >= 0
    assert density.to_numpy().max() <= 1 + 1e-12

    candidates = rank_canada_candidates(exports, rca, density, products).head(15).copy()
    candidates["density_rank"] = np.arange(1, len(candidates) + 1)
    candidates = add_top_contributors(candidates, rca, proximity, products)
    required = {
        "product_hs92_code",
        "product_name",
        "canada_export_value_usd",
        "world_export_value_usd",
        "rca",
        "density",
        "density_rank",
        "neighbor_1_hs92_code",
        "neighbor_1_product_name",
        "neighbor_1_proximity",
        "neighbor_2_hs92_code",
        "neighbor_2_product_name",
        "neighbor_2_proximity",
    }
    missing = required.difference(candidates.columns)
    assert not missing, f"Candidate table is missing columns: {sorted(missing)}"
    assert len(candidates) == 15
    assert (candidates["rca"] < 1).all()
    present_codes = set(rca.columns[rca.loc[CANADA].ge(1)])
    assert set(candidates["neighbor_1_hs92_code"]).issubset(present_codes)
    assert set(candidates["neighbor_2_hs92_code"]).issubset(present_codes)
    assert candidates["neighbor_1_proximity"].gt(0).all()
    assert candidates["neighbor_2_proximity"].gt(0).all()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = OUTPUT_DIR / "canada_candidates.csv"
    chart_path = OUTPUT_DIR / "canada_candidates.png"
    candidates.to_csv(csv_path, index=False)

    chart = candidates.sort_values("density")

    def short_label(code: object, name: object, width: int = 39) -> str:
        """Keep labels readable without hiding the product code."""
        clean_name = " ".join(str(name).split())
        if len(clean_name) > width:
            clean_name = clean_name[: width - 1].rstrip(" ,;:-") + "…"
        return f"{code}  {clean_name}"

    labels = [
        short_label(code, name)
        for code, name in zip(
            chart["product_hs92_code"], chart["product_name"], strict=True
        )
    ]
    fig, ax = plt.subplots(figsize=(11, 7.5))
    ax.barh(labels, chart["density"], color="#A6192E")
    ax.set_xlabel("Product-space density")
    ax.set_title(
        "HS92 four-digit goods, 2024; every displayed product has Canadian RCA < 1",
        loc="left",
        color="#5F707A",
        fontsize=9,
        pad=12,
    )
    fig.suptitle(
        "Canada's nearby export candidates",
        x=0.18,
        y=0.98,
        ha="left",
        fontsize=15,
        weight="bold",
        color="#20313A",
    )
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.grid(axis="x", color="#E7ECEF")
    ax.set_axisbelow(True)
    ax.tick_params(axis="y", length=0, labelsize=8)
    fig.text(
        0.01,
        0.01,
        "Source: Harvard Growth Lab Atlas GraphQL API. Metric-generated candidates, not forecasts.",
        fontsize=7,
        color="#5F707A",
    )
    fig.tight_layout(rect=(0.03, 0.045, 1, 0.94))
    fig.savefig(chart_path, dpi=180, bbox_inches="tight")
    plt.close(fig)

    print(candidates.to_string(index=False))
    print(f"\nSaved {csv_path}")
    print(f"Saved {chart_path}")


if __name__ == "__main__":
    main()
