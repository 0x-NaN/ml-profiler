ML PROFILER — FULL SETUP & RUN

─── PREREQUISITES ───────────────────────────────
- Node.js v24+
- Python 3.12+
- Ollama installed and running (ollama serve in a separate terminal)
- phi3:mini pulled (ollama pull phi3:mini)
- RTX 4060 with CUDA drivers installed

─── FOLDER STRUCTURE ────────────────────────────
ml-profiler/
  backend/
    main.py
    parser.py
    analyser.py
    suggester.py
    requirements.txt
  frontend/          ← Gemini/impeccable builds this
  generate_trace.py

─── BACKEND SETUP ───────────────────────────────
cd ml-profiler/backend

# install dependencies
pip install fastapi uvicorn python-multipart ollama --break-system-packages

# start the server
in the backend folder

uvicorn main:app --reload

# backend runs at http://127.0.0.1:8000
# test it at http://127.0.0.1:8000/docs

─── GENERATE A TRACE ────────────────────────────
# in a separate terminal, from ml-profiler root
python generate_trace.py

# outputs trace_cuda.json in the same folder
# upload this file via /docs or the frontend

─── OLLAMA ──────────────────────────────────────
# must be running before you start the backend
# open a separate terminal and run:
ollama serve

# verify phi3:mini is available:
ollama list

─── FULL RUN ORDER ──────────────────────────────
Terminal 1 → ollama serve
Terminal 2 → cd ml-profiler/backend → uvicorn main:app --reload
Terminal 3 → cd ml-profiler/frontend → npm run dev
Browser    → http://127.0.0.1:8000/docs to test backend
           → http://localhost:5173 for frontend (default Vite port)

─── TEST ENDPOINT ───────────────────────────────
1. Go to http://127.0.0.1:8000/docs
2. Click POST /profile
3. Click Try it out
4. Upload trace_cuda.json
5. Click Execute
6. Check response for gpu_utilization_pct > 0

─── RURALMEDVISION INTEGRATION ──────────────────
Add this to your training script:

from torch.profiler import profile, record_function, ProfilerActivity

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    record_shapes=True,
    profile_memory=True,
) as prof:
    with record_function("training_loop"):
        # your existing training code here
        pass

prof.export_chrome_trace("ruralmed_trace.json")

─── KNOWN LIMITATIONS (v0.1) ────────────────────
- PyTorch chrome trace format only
- No persistent run history yet
- No epoch comparison yet
- Frontend in progress