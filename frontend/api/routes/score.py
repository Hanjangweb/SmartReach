from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
from llm import call_llm
from datetime import datetime

router = APIRouter()

class LeadForScoring(BaseModel):
    propertyType: Optional[str] = "Other"
    budget: Optional[float] = 0
    location: Optional[str] = ""
    status: Optional[str] = "New"
    followUpDate: Optional[str] = None
    lastContacted: Optional[str] = None
    conversationCount: Optional[int] = 0
    createdAt: Optional[str] = None

class LeadForFollowup(BaseModel):
    name: str
    propertyType: Optional[str] = "Other"
    budget: Optional[float] = 0
    location: Optional[str] = ""
    status: Optional[str] = "New"
    lastContacted: Optional[str] = None

class ScoreRequest(BaseModel):
    lead: LeadForScoring

class FollowupRequest(BaseModel):
    lead: LeadForFollowup
    agentName: str

@router.post("/score")
async def score_lead(req: ScoreRequest):
    lead = req.lead
    budget_text = f"₹{lead.budget}L" if lead.budget else "unknown"

    # Days since created
    days_old = "unknown"
    if lead.createdAt:
        try:
            created = datetime.fromisoformat(lead.createdAt.replace('Z', '+00:00'))
            days_old = (datetime.now(created.tzinfo) - created).days
        except:
            pass

    system_prompt = """You are a real estate lead scoring AI. Analyze leads and return a JSON score.

Return ONLY valid JSON:
{
  "score": "Hot|Warm|Cold",
  "percentage": number between 0-100,
  "reason": "one sentence explanation"
}

Scoring criteria:
- Hot (70-100%): High budget (>50L), specific requirement, active status (Contacted/Negotiation/SiteVisit), recently contacted, multiple conversations
- Warm (35-69%): Medium budget, has some requirement info, New/Contacted status, some interaction
- Cold (0-34%): Low budget or no budget, vague requirement, no recent contact, New with no interaction"""

    user_prompt = f"""Score this real estate lead:
Property Type: {lead.propertyType}
Budget: {budget_text}
Location: {lead.location or 'not specified'}
Status: {lead.status}
Days since created: {days_old}
Times contacted/messages: {lead.conversationCount}
Has follow-up scheduled: {"Yes" if lead.followUpDate else "No"}
Last contacted: {lead.lastContacted or "Never"}"""

    try:
        result = call_llm(system_prompt, user_prompt, temperature=0.1)
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        result = result.strip()
        scored = json.loads(result)
        return scored
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse score")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")

@router.post("/suggest-followup")
async def suggest_followup(req: FollowupRequest):
    lead = req.lead
    budget_text = f"₹{lead.budget}L" if lead.budget else "not specified"

    system_prompt = f"""You are SmartReach AI. Generate a short, warm follow-up WhatsApp message for a real estate lead.
Agent: {req.agentName}
Make it sound human, not robotic. 1-3 sentences max."""

    user_prompt = f"""Generate a follow-up message for:
Client: {lead.name}
Property: {lead.propertyType} in {lead.location or 'not specified'}
Budget: {budget_text}
Current status: {lead.status}
Last contacted: {lead.lastContacted or "Never"}

Write ONLY the WhatsApp message text."""

    try:
        suggestion = call_llm(system_prompt, user_prompt, temperature=0.8)
        return {"suggestion": suggestion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestion failed: {str(e)}")
