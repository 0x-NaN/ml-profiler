# ml-profiler

A lightweight, local, open-source ML training profiler for PyTorch. Upload a trace file, get a plain-English breakdown of bottlenecks and optimization suggestions — no cloud, no data leaves your machine.

## What it does

- Parses PyTorch chrome trace JSON exports
- Detects CPU bottlenecks, DataLoader starvation, memory issues
- Ranks slowest ops by category
- Generates optimization suggestions via a local LLM (Ollama)
- Clean React dashboard to visualize results

## Stack

- **Backend:** FastAPI + Python
- **Frontend:** React
- **LLM:** Ollama (phi3:mini by default, swap any model)

---

## Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) installed and running
- `phi3:mini` pulled (`ollama pull phi3:mini`)

### 1. Start Ollama
```bash
ollama serve
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Generate a trace
```bash
python generate_trace.py
```

Upload the output `trace.json` via the UI at `http://localhost:5173` or test directly at `http://localhost:8000/docs`.

---

## Architecture

ml-profiler is a lightweight, local ML training profiler. A user uploads a PyTorch chrome trace JSON, the backend parses and analyses it, a local LLM generates plain-English optimization suggestions, and a React dashboard surfaces the results.

### System overview

```
user
  └── uploads trace.json (PyTorch chrome trace)
        └── POST /profile (FastAPI)
              ├── parser.py      → extracts cpu_ops, gpu_ops, dataloader_events, memory_events
              ├── analyser.py    → computes metrics, flags bottlenecks, ranks slowest ops
              └── suggester.py   → builds prompt → Ollama (local LLM) → optimization report
                    └── JSON response → React dashboard
```

### Components

#### `generate_trace.py`
Wraps `torch.profiler` around a sample PyTorch model (ResNet18 by default) and exports a chrome trace file. Adapt this to wrap your own training loop.

```python
with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    record_shapes=True,
    profile_memory=True,
) as prof:
    model(inputs)

prof.export_chrome_trace("trace.json")
```

#### `backend/main.py`
FastAPI application with two endpoints:

- `GET /` — health check
- `POST /profile` — accepts a `.json` file upload, runs the full pipeline, returns structured JSON

CORS is open (`*`) for local development. Tighten before any public deployment.

#### `backend/parser.py`
Parses the raw `traceEvents` array from a PyTorch chrome trace JSON. Groups events by category:

| Category | What it captures |
|---|---|
| `cpu_op` | CPU-side PyTorch operations (aten ops, convolutions, matmuls) |
| `kernel`, `gpu_memcpy`, `gpu_user_annotation` | GPU kernel executions |
| names containing `DataLoader` or `data` | DataLoader fetch events |
| `memory` | Memory allocation/deallocation events |

#### `backend/analyser.py`
Computes metrics and flags bottlenecks:

| Metric | Description |
|---|---|
| `total_cpu_time_ms` | Sum of all CPU op durations |
| `total_gpu_time_ms` | Sum of all GPU op durations |
| `gpu_utilization_pct` | GPU time / total time × 100 |
| `dataloader_ratio_pct` | DataLoader time / total time × 100 |
| `cpu_gpu_ratio` | CPU time / GPU time |
| `peak_memory_mb` | Largest single memory event in MB |

Bottleneck detection thresholds:

| Condition | Severity | Threshold |
|---|---|---|
| DataLoader starvation | high | dataloader ratio > 20% |
| Low GPU utilization | high | GPU utilization < 50% |
| CPU/GPU imbalance | medium | CPU time > 3× GPU time |
| Memory | info | always reported if > 0 |

#### `backend/suggester.py`
Builds a structured prompt from the analysis output and sends it to Ollama. The prompt instructs the model to write a 3-paragraph engineering report naming specific PyTorch APIs and fixes — no generic advice, no email formatting.

Any Ollama-compatible model can be swapped in by changing the `model` field in `suggester.py`.

#### `frontend/`
React dashboard. Displays summary stat cards, bottleneck cards with severity color coding, bar charts for slowest CPU and GPU ops, and the LLM-generated engineering report.

### Data flow

```
trace.json
  → parser.py
      cpu_ops:          [{ name, duration_us, timestamp }, ...]
      gpu_ops:          [{ name, duration_us, timestamp }, ...]
      dataloader_events:[{ name, duration_us, timestamp }, ...]
      memory_events:    [{ name, timestamp, bytes }, ...]

  → analyser.py
      summary:     { total_cpu_time_ms, total_gpu_time_ms, gpu_utilization_pct, ... }
      bottlenecks: [{ type, severity, message }, ...]
      top_cpu_ops: [{ name, duration_us }, ...]  (top 10 by duration)
      top_gpu_ops: [{ name, duration_us }, ...]  (top 10 by duration)

  → suggester.py
      prompt: structured summary of metrics + bottlenecks + slowest ops
      → Ollama (phi3:mini)
      → suggestions: plain text engineering report (3 paragraphs)

  → POST /profile response
      {
        "parsed":      { cpu_ops, gpu_ops, dataloader_events, memory_events },
        "analysis":    { summary, bottlenecks, top_cpu_ops, top_gpu_ops },
        "suggestions": "..."
      }
```

---

## Known limitations

### CUDA kernel events missing (PyTorch 2.6+)

`gpu_utilization_pct` always shows 0% on PyTorch 2.6 with CUDA 12.4. The profiler captures CUDA time internally — `prof.key_averages().table()` shows correct CUDA timing — but the chrome trace JSON export does not include GPU kernel events.

Confirmed upstream regressions:
- [pytorch/pytorch#184363](https://github.com/pytorch/pytorch/issues/184363) — `flow_id` metadata failure breaking CPU→GPU event correlation
- [pytorch/kineto#973](https://github.com/pytorch/kineto/issues/973) — CUPTI Range API migration zeroing trace payloads on newer architectures
- [pytorch/kineto#859](https://github.com/pytorch/kineto/issues/859) — isolated activity warning bug

CPU profiling is fully functional. GPU support will be revisited when upstream fixes land.

---

## Roadmap

- [ ] CUDA kernel event support (blocked on PyTorch upstream — see above)
- [ ] CIFAR-10 training trace as a bundled example
- [ ] Epoch-over-epoch comparison (upload multiple traces)
- [ ] Run history with local persistence
- [ ] VS Code extension
- [ ] Nsight/Nsys trace format support

---

## Contributing

PRs welcome. Open an issue first for major changes.

## License

MIT
