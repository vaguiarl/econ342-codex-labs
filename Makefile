PYTHON ?= $(shell for candidate in python3 python3.12 /usr/local/bin/python3; do \
	if command -v $$candidate >/dev/null 2>&1 && \
	   $$candidate -c 'import numpy, pandas, matplotlib' >/dev/null 2>&1; then \
		command -v $$candidate; break; \
	fi; \
done)
ifeq ($(strip $(PYTHON)),)
PYTHON := python3
endif

WEEK03_LAB := labs/week03-product-space
WEEK03_WORK := work/week03-product-space/$(TEAM)

.PHONY: help setup verify-data check-team week03-start week03-run

help:
	@echo "ECON 342 Codex labs"
	@echo "  make setup"
	@echo "  make verify-data"
	@echo "  make week03-start TEAM=team-XX"
	@echo "  make week03-run TEAM=team-XX"

setup:
	$(PYTHON) -m pip install -r requirements.txt

verify-data:
	@cd $(WEEK03_LAB)/data && \
	if command -v sha256sum >/dev/null 2>&1; then \
		sha256sum -c SHA256SUMS; \
	else \
		shasum -a 256 -c SHA256SUMS; \
	fi

check-team:
	@test -n "$(TEAM)" || (echo "Use TEAM=team-XX" && exit 2)
	@case "$(TEAM)" in *[!A-Za-z0-9_-]*|'') \
		echo "TEAM may contain only letters, numbers, underscores, and hyphens"; exit 2;; \
	esac

week03-start: check-team
	@mkdir -p "$(WEEK03_WORK)"
	@test ! -e "$(WEEK03_WORK)/analysis.py" || \
		(echo "$(WEEK03_WORK)/analysis.py already exists; refusing to overwrite it" && exit 2)
	cp "$(WEEK03_LAB)/starter.py" "$(WEEK03_WORK)/analysis.py"
	cp "$(WEEK03_LAB)/memo-template.md" "$(WEEK03_WORK)/candidate_memo.md"
	@echo "Created $(WEEK03_WORK)"

week03-run: check-team
	@test -f "$(WEEK03_WORK)/analysis.py" || \
		(echo "Run make week03-start TEAM=$(TEAM) first" && exit 2)
	@$(PYTHON) -c 'import numpy, pandas, matplotlib' >/dev/null 2>&1 || \
		(echo "No prepared Python environment found. Follow the setup instructions in README.md." && exit 2)
	$(PYTHON) "$(WEEK03_WORK)/analysis.py"
