from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from llm import call_llm

router = APIRouter()

class LeadInsightContext(BaseModel):
    name: str
    propertyType: Optional[str] = "Other"
    budget: Optional[float] = 0
    location: Optional[str] = ""
    requirement: Optional[str] = ""
    status: str
    leadScore: str
    scorePercentage: int
    notes: List[str]

class InsightRequest(BaseModel):
    lead: LeadInsightContext

@router.post("/insight")
async def generate_insight(req: InsightRequest):
    lead = req.lead

    notes_text = ""
    if lead.notes:
        notes_text = "\nRecent Notes/Events:\n" + "\n".join(lead.notes)

    budget_text = f"₹{lead.budget}L" if lead.budget else "not specified"

    system_prompt = """You are SmartReach AI, an expert real estate sales strategist.
Your goal is to provide a highly actionable, concise 'Next Best Action' insight for a real estate agent dealing with a specific lead.

Your insight must be:
- Direct and to the point (2-3 sentences max)
- Suggest a concrete next step (e.g., call to discuss financing, send property options in X location, schedule site visit)
- Base your suggestion on the lead's current status, score, and recent notes
- Do not repeat the lead's details, just provide the insight.
"""

    user_prompt = f"""Generate actionable insight for this lead:

Client Name: {lead.name}
Property Interest: {lead.propertyType}
Budget: {budget_text}
Location: {lead.location or 'not specified'}
Requirement: {lead.requirement or 'not specified'}
Current Status: {lead.status}
Lead Score: {lead.leadScore} ({lead.scorePercentage}%)
{notes_text}

Provide the insight now:"""

    try:
        insight = call_llm(system_prompt, user_prompt, temperature=0.7)
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI insight generation failed: {str(e)}")
