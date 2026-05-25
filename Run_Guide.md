# Run_Guide

## Prerequisites

- Python 3.12+
- Node.js 18+
- [Ollama](https://ollama.com) installed
- `phi3:mini` pulled — `ollama pull phi3:mini`
- PyTorch with CUDA (optional but recommended)

---

## Folder structure

```
ml-profiler/
  backend/
    main.py
    parser.py
    analyser.py
    suggester.py
    requirements.txt
  frontend/
  generate_trace.py
  RUNBOOK.md
  README.md
```

---

## Run order

Open three terminals:

**Terminal 1 — Ollama**
```bash
ollama serve
```

**Terminal 2 — Backend**
```bash
cd ml-profiler/backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs at `http://127.0.0.1:8000`. Test at `http://127.0.0.1:8000/docs`.

**Terminal 3 — Frontend**
```bash
cd ml-profiler/frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.

---

## Generate a trace

From the `ml-profiler` root:

```bash
python generate_trace.py
```

Outputs `trace.json`. Upload it via the frontend or at `http://127.0.0.1:8000/docs`.

---

## Test the endpoint manually

1. Go to `http://127.0.0.1:8000/docs`
2. Click `POST /profile`
3. Click **Try it out**
4. Upload `trace.json`
5. Click **Execute**
6. Check the response for `analysis.summary` and `suggestions`

---

## Wrap your own training loop

Add this to any PyTorch training script:

```python
from torch.profiler import profile, record_function, ProfilerActivity

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    record_shapes=True,
    profile_memory=True,
) as prof:
    with record_function("training_loop"):
        # your training code here
        pass

prof.export_chrome_trace("my_trace.json")
```

Then upload `my_trace.json` to the profiler.

> **Note:** On models with high VRAM usage, set `record_shapes=False` and
> `profile_memory=False` to avoid OOM errors. 5–10 iterations is enough
> for representative timing data.

---

## Known limitations

- GPU utilization always shows 0% on PyTorch 2.6+ — confirmed upstream regression, see [README](README.md#known-limitations)
- PyTorch chrome trace format only — Nsys/Nsight not yet supported
- No persistent run history
- No epoch-over-epoch comparison
