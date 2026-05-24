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

## Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) installed and running
- `phi3:mini` pulled (`ollama pull phi3:mini`)

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Generate a trace
```bash
python generate_trace.py
```
Upload the output `trace_cuda.json` via the UI or at `http://localhost:8000/docs`.

## Known Limitations

**GPU utilization always shows 0% on PyTorch 2.6+.**
CUDA time is captured internally by the profiler but is not written to the chrome trace JSON export due to confirmed upstream regressions: [pytorch#184363](https://github.com/pytorch/pytorch/issues/184363), [kineto#973](https://github.com/pytorch/kineto/issues/973). Will be resolved when upstream fixes land. CPU profiling is fully functional.

## Roadmap

- [ ] CUDA kernel event support (blocked on PyTorch upstream)
- [ ] Epoch-over-epoch comparison
- [ ] Run history
- [ ] VS Code extension
- [ ] Nsight/Nsys trace support

## Contributing

PRs welcome. Open an issue first for major changes.

## License

MIT