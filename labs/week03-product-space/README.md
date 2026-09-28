# ECON 342 Week 3 Codex lab

## Canada's nearby export opportunities

- **Time:** 11:15--12:20
- **Work:** pairs
**Question:** Based on the products Canada already exports competitively, which
products are nearby in the product space but still have Canadian RCA below one?

Call the results **candidate products** or **nearby opportunities**. Density is
not a forecast, proof of profitability, or policy recommendation.

## Finish line

Submit these three files from your team folder:

1. `canada_candidates.csv`
2. `canada_candidates.png`
3. `candidate_memo.md`

Do not put names, student numbers, email addresses, or API keys in the
repository. Use the submission channel announced in class.

## Set up your team folder

From the repository root, replace `team-XX` with the team label assigned in
class:

```bash
make week03-start TEAM=team-XX
```

One student is the **driver**, operating Codex and the terminal. The other is
the **auditor**, checking definitions, filters, units, and tests. Switch roles
after Checkpoint 3.

The fixed input is a cached 2024 HS92 four-digit export matrix from the Harvard
Growth Lab Atlas. The exercise needs no account, live download, or API key.

The lecture's five discussion cases were selected to span sectors and several
metrics. This lab ranks **density alone**, so its top 15 is intentionally
different.

The Makefile selects a local Python that already contains NumPy, pandas, and
Matplotlib. Installation and Docker options are in the repository's main
README.

## Checkpoint 1, 11:20--11:28: inspect before editing

Copy this prompt into Codex:

```text
We are doing the ECON 342 Week 3 product-space lab for Canada.

Do not edit any file yet. Inspect labs/week03-product-space/README.md,
labs/week03-product-space/starter.py, the first and last rows of
labs/week03-product-space/data/student_input_hs92_4digit_2024.csv.gz, and
labs/week03-product-space/data/hs92_products_4digit.csv. Report:

1. the year, product classification, value unit, and source;
2. the columns and row count;
3. the number of countries and products;
4. missing, negative, duplicate, or all-zero product observations;
5. the exact run command we should use from the repository root.

Separate facts read from the files from assumptions. Stop after the audit and
wait for us.
```

Show the TA that one row means one country-product-year export value in current
U.S. dollars. The expected matrix has 230 economies and 1,241 products.

## Checkpoint 2, 11:28--11:38: verify one RCA

For one product, record these four values from the fixed data:

```text
Canada exports of product p             =
Canada exports of all included products =
World exports of product p              =
World exports of all included products  =
```

Then calculate

```text
RCA = (Canada product exports / Canada total exports)
      / (world product exports / world total exports).
```

Explain which share is in the numerator and which benchmark share is in the
denominator. A raw export-value comparison is not an RCA calculation.

## Checkpoint 3, 11:38--12:03: build and test the analysis

Copy this prompt into Codex, replacing `team-XX` with your team label:

```text
Complete work/week03-product-space/team-XX/analysis.py using the prepared
export data.
Work only in our team folder. Do not download data, install packages, or edit
the fixed course data.

Implement the binary RCA/co-export product-space method from Hidalgo et al.,
using the course's zero-self-link convention:

- calculate Balassa RCA for every country-product pair;
- define RCA as zero for any product with zero world exports so no `0/0`
  value remains;
- set M=1 when RCA is at least 1 and M=0 otherwise;
- calculate symmetric product proximity as the smaller of the two conditional
  co-export probabilities;
- use the course convention of setting self-proximity to zero, then calculate
  Canada's density from links to other products;
- keep products with Canadian RCA below 1, Canadian exports of at least US$10
  million, and world exports of at least US$1 billion;
- rank the top 15 by density.

The starter will append the two strongest Canadian `RCA>=1` contributors to
each candidate row. Keep those columns: Checkpoint 4 uses them.

Use the output column names required by the starter script. Run the script so
it saves canada_candidates.csv and canada_candidates.png in our team folder.

Before declaring success, verify and report:

1. export shares sum to 1 within tolerance for every included country;
2. RCA is finite, including for the all-zero legacy product;
3. product codes are unique after the pivot;
4. M contains only 0 and 1;
5. proximity is symmetric, finite, and between 0 and 1;
6. density is finite and between 0 and 1;
7. all displayed candidate RCAs are below 1;
8. one Canadian RCA matches our hand calculation;
9. rerunning the script produces the same top 15;
10. both named contributors for every candidate have Canadian RCA at least 1.

Repair any failed check. At the end, list files changed, the exact run command,
validation results, and output paths.
```

Run command, replacing `team-XX`:

```bash
make week03-run TEAM=team-XX
```

If automatic detection fails, use
`make week03-run TEAM=team-XX PYTHON=/path/to/that/python`, or, when Docker
Compose is installed,
`docker compose run --rm labs make week03-run TEAM=team-XX`. Do not use an
untested system `python3`: it may not contain pandas and Matplotlib.

Do not accept “all tests passed” without seeing the evidence for each check.

## Checkpoint 4, 12:03--12:13: interpret and challenge

Copy this prompt into Codex:

```text
Read our canada_candidates.csv and chart. Do not change the analysis.

Draft a two-row table for our memo. For each selected candidate, report its RCA
and density, name two products in Canada's RCA>=1 basket that contribute
strongly to its density, and give one concrete missing fact needed before
calling it a realistic Canadian export opportunity.

Then draft a 120- to 180-word interpretation. Use “candidate” or “nearby
opportunity.” Do not say density proves capabilities, profitability, future
exports, comparative advantage, or the case for a subsidy. Mention 2024 and
HS92 at four digits. End with one sentence explaining why results near the
binary RCA=1 cutoff could be sensitive to the definition of specialization.
```

The auditor compares every number in the draft with the CSV. Edit the prose
into your own words.

## Submit by 12:20

Create `candidate_memo.md` with:

- the exact run command;
- a compact validation checklist;
- a two-row candidate table;
- a 120--180 word interpretation.

Before submitting, complete this sentence:

> Product-space density is useful because __________, but it cannot tell us
> __________.

## If your run fails

Use this repair prompt once:

```text
Read the full error and inspect the current script. State the direct cause in
one sentence, make the smallest relevant correction, rerun the same command,
and repeat the validation checks. Do not change the economic definitions or
add packages.
```

If the script is still blocked, ask the TA for the fallback result file. You
must still verify one RCA, interpret density, identify missing evidence, and
write the memo.

## Method reference

César A. Hidalgo, Bailey Klinger, Albert-László Barabási, and Ricardo Hausmann,
“The Product Space Conditions the Development of Nations,” *Science* 317
(2007), 482--487, <https://doi.org/10.1126/science.1144581>.
