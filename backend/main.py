from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from parser import parse_trace
from analyser import analyse
from suggester import suggest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ml-profiler backend running"}

@app.post("/profile")
async def profile(file: UploadFile = File(...)):
    contents = await file.read()

    try:
        parsed  = parse_trace(contents)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=422, detail="Could not parse trace file. Ensure it is a valid PyTorch chrome trace.")

    analysis = analyse(parsed)
    suggestions = await suggest(analysis)

    return {
        "parsed":      parsed,
        "analysis":    analysis,
        "suggestions": suggestions,
    }