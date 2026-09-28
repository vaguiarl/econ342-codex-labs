# ECON 342 Codex Data Labs

Public, reproducible data-analysis labs for **ECON 342 International Trade** at
Simon Fraser University.

These labs use real trade data and AI-assisted coding. Codex can help inspect,
write, run, and repair code. Students remain responsible for the economic
definitions, validation checks, and interpretation.

This is the public student repository. Course slides, solutions, assessments,
grading materials, and student submissions are maintained separately.

## Available labs

| Week | Lab | Main question |
|---|---|---|
| 3 | [Canada in the Product Space](labs/week03-product-space/) | Which products are near Canada's existing export capabilities but still have RCA below one? |

## Get the files

Either clone the repository:

```bash
git clone https://github.com/vaguiarl/econ342-codex-labs.git
cd econ342-codex-labs
```

or select **Code → Download ZIP** on GitHub and extract the folder.

## Set up Python

Python 3.12 is recommended.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

On Windows PowerShell, activate the environment with
`.venv\Scripts\Activate.ps1`.

Then create a team copy of the Week 3 starter:

```bash
make week03-start TEAM=team-XX
make week03-run TEAM=team-XX
```

Replace `team-XX` with the label assigned in class. The start command refuses
to overwrite an existing analysis.

## Optional Docker environment

If Docker Compose is installed:

```bash
docker compose build
docker compose run --rm labs make week03-start TEAM=team-XX
docker compose run --rm labs make week03-run TEAM=team-XX
```

## How each lab works

1. Read the lab guide before editing.
2. Audit the supplied data.
3. Verify one calculation manually.
4. Ask Codex to complete the starter program.
5. Inspect the tests and outputs yourself.
6. Interpret the result without overstating what the data establish.
7. Submit through the course submission channel, not GitHub.

Never commit names, student numbers, email addresses, submissions, or API
keys. Team work is stored under the ignored `work/` directory.

## Data and licensing

Each lab contains a fixed classroom dataset and a manifest recording its
source, year, classification, dimensions, transformations, and SHA-256 hash.
Run `make verify-data` to check the downloaded files.

Original code is available under the MIT License. Original instructional text
is available under CC BY 4.0. Third-party data are not relicensed and remain
subject to their source terms. See [LICENSE.md](LICENSE.md) and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
