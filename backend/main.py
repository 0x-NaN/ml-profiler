from fastapi import FastAPI, UploadFile, File
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

    parsed  = parse_trace(contents)
    analysis = analyse(parsed)
    suggestions = suggest(analysis)

    return {
        "parsed":      parsed,
        "analysis":    analysis,
        "suggestions": suggestions,
    }