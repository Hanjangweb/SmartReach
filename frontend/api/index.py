import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add current directory to path for serverless imports
sys.path.append(str(Path(__file__).parent))

from .routes.reply import router as reply_router
from .routes.extract import router as extract_router
from .routes.score import router as score_router
from .routes.generate_template import router as generate_template_router
from .routes.insight import router as insight_router
from .routes.match import router as match_router
from .routes.chat import router as chat_router

app = FastAPI(
    title="SmartReach AI Service",
    description="AI microservice for real estate lead intelligence",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(reply_router, prefix="/api/ai", tags=["AI Reply"])
app.include_router(extract_router, prefix="/api/ai", tags=["Lead Extraction"])
app.include_router(score_router, prefix="/api/ai", tags=["Lead Scoring"])
app.include_router(generate_template_router, prefix="/api/ai", tags=["AI Template Generation"])
app.include_router(insight_router, prefix="/api/ai", tags=["AI Insight"])
app.include_router(match_router, prefix="/api/ai", tags=["AI Property Matcher"])
app.include_router(chat_router, prefix="/api/ai", tags=["AI Chatbot"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "SmartReach AI (Vercel)", "version": "1.0.0"}
