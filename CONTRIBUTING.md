# Contributing

Thanks for your interest in ml-profiler. This is a small focused tool — contributions that keep it lightweight and local-first are most welcome.

---

## What we need help with

- **CUDA kernel event support** — the biggest open problem. PyTorch 2.6+ doesn't write GPU kernel events to chrome trace exports. See the open issue for context and upstream links. If you've found a workaround, please share it.
- **Additional trace formats** — Nsight Systems (`.nsys-rep`), TensorBoard traces, JAX profiles
- **Epoch comparison** — upload two traces, diff the bottlenecks
- **Run history** — persist past profiles locally (SQLite or flat JSON)
- **Better LLM prompts** — if you've found prompt patterns that produce sharper optimization suggestions, open a PR against `suggester.py`
- **Testing** — there are no tests yet. Unit tests for `parser.py` and `analyser.py` would be a great first contribution.

---

## Before you open a PR

1. Open an issue first for anything non-trivial — avoids duplicate work
2. Keep PRs focused — one thing per PR
3. Don't break the local-first constraint — no mandatory external API calls, no cloud dependencies

---

## Setup

```bash
git clone https://github.com/0x-NaN/ml-profiler
cd ml-profiler/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

See [RUNBOOK.md](RUNBOOK.md) for the full run order.

---

## Project structure

```
backend/
  main.py       — FastAPI app, single POST /profile endpoint
  parser.py     — parses PyTorch chrome trace JSON
  analyser.py   — computes metrics, detects bottlenecks
  suggester.py  — builds LLM prompt, calls Ollama
frontend/       — React dashboard
generate_trace.py — helper to generate sample traces
```

---

## Code style

- Python: follow existing style, no external formatter required yet
- Keep functions small and single-purpose
- If you add a new bottleneck detection rule in `analyser.py`, add a comment explaining the threshold choice

---

## Questions

Open an issue or start a discussion on GitHub.
