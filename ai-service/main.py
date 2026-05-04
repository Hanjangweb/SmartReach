from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

# Validate required environment variables
required_vars = ["OPENROUTER_API_KEY"]
missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}")

from routes.reply import router as reply_router
from routes.extract import router as extract_router
from routes.score import router as score_router
from routes.generate_template import router as generate_template_router
from routes.insight import router as insight_router
from routes.match import router as match_router
from routes.chat import router as chat_router

app = FastAPI(
    title="SmartReach AI Service",
    description="AI microservice for real estate lead intelligence",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(reply_router, prefix="/ai", tags=["AI Reply"])
app.include_router(extract_router, prefix="/ai", tags=["Lead Extraction"])
app.include_router(score_router, prefix="/ai", tags=["Lead Scoring"])
app.include_router(generate_template_router, prefix="/ai", tags=["AI Template Generation"])
app.include_router(insight_router, prefix="/ai", tags=["AI Insight"])
app.include_router(match_router, prefix="/ai", tags=["AI Property Matcher"])
app.include_router(chat_router, prefix="/ai", tags=["AI Chatbot"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "SmartReach AI", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
