# AI, robots, productivity and wages

The graph is an illustrative task model, **not Canadian wage estimates**.
Canadian observations in the slides come from the separately linked sources below.

## Reproduce the figure

From the repository root, run:

```bash
python analysis/week08_ai_robotics/build_ai_robotics.py
```

The script creates the CSV, assumptions JSON, editable SVG and PNG in this folder.
The website uses the same equations for its slider. The optional `--course-root`
argument copies the PNG to the existing Beamer project's figures directory.

## Model and interpretation

Let `Y = 2 sqrt(H (L + R))`. `H` is a human task that complements robots,
`L` is a human task robots can also perform, and `R` is robot task capacity.
Hold both human inputs at one, keep the output price at one, and pay each input
its marginal product. The model holds task assignments and human hours fixed.

The complementary task earns `sqrt(1+R)`. The substitutable task earns
`1/sqrt(1+R)`. Output per human hour is `sqrt(1+R)`, while the average hourly wage
is the mean of the two task wages. All series equal 100 before robots are added.

At `R=1`, productivity rises 41.4%, the complementary task wage rises 41.4%,
the substitutable task wage falls 29.3%, and the average hourly wage rises 6.1%.
The remaining income pays for robot services. These are consequences of the
stated assumptions, not measured effects or a prediction for an occupation.
Other technologies, demand responses, worker mobility and new tasks can change
the result. This extends the factor-scarcity intuition of H–O by changing task
technology. It is not a direct application of Stolper–Samuelson to an AI shock.

## Canadian evidence used in the slides

- [Statistics Canada, July 30, 2026 release, March 2026 LFS supplement](https://www150.statcan.gc.ca/n1/daily-quotidien/260730/dq260730b-eng.htm):
  35.9% of workers aged 15–69 reported generative AI use at work over the prior
  12 months. Employment shares were 31.2% in occupations with high exposure and
  high complementarity, 29.6% high exposure and low complementarity, and 39.3%
  low exposure. Rounding explains the 100.1% sum. Exposure measures potential
  task transformation, not job losses. The supplement covers the provinces.
- [Galassi and MacKenzie, Bank of Canada Staff Working Paper 2026-34](https://www.bankofcanada.ca/2026/09/staff-working-paper-2026-34/):
  the September 2026 paper associates robot adoption in Canadian private
  corporations with higher revenue, value added, non-owner employment and
  payroll. It finds little evidence of a lower conventional labour share and
  no increase in the total owner income share. Payroll growth alone does not
  identify each worker's hourly wage or economy-wide employment effects.
- [Statistics Canada, Dixon, November 2, 2020](https://www150.statcan.gc.ca/n1/pub/11-626-x/11-626-x2020024-eng.htm):
  Canadian robot adopters tended to hire more workers overall, but required
  fewer managers; middle-skilled workers faced weaker outcomes than the
  high- and low-skilled groups. These historical results are not estimates
  of current generative AI effects.
- [Acemoglu and Restrepo, JEP 2019](https://www.aeaweb.org/articles?id=10.1257/jep.33.2.3):
  conceptual background on displacement, productivity and new tasks. The
  classroom model above is a transparent illustration, not their estimated model.
