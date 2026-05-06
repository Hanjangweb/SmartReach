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

class DashboardInsightRequest(BaseModel):
    totalLeads: int
    newLeads: int
    closedDeals: int
    conversionRate: float

class ForecastInsightRequest(BaseModel):
    totalExpectedRevenueLakhs: str
    hotExpectedLakhs: str
    warmExpectedLakhs: str
    activeLeadsCount: int

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

@router.post("/insight/dashboard")
async def generate_dashboard_insight(req: DashboardInsightRequest):
    system_prompt = """You are SmartReach AI, an expert real estate sales manager.
Your goal is to look at the user's high-level pipeline metrics and give a 1-2 sentence strategic summary or word of encouragement.

Your insight must be:
- Very brief (maximum 2 sentences)
- Motivational but data-driven
- If conversion rate is high (>10%), praise them. If low or zero, suggest focusing on follow-ups.
- Keep it professional, friendly, and actionable.
"""
    
    user_prompt = f"""Generate a quick strategic summary for my real estate dashboard:
Total Leads: {req.totalLeads}
New Leads (recent): {req.newLeads}
Closed Deals: {req.closedDeals}
Conversion Rate: {req.conversionRate}%

Provide the summary now:"""

    try:
        insight = call_llm(system_prompt, user_prompt, temperature=0.7)
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI dashboard insight failed: {str(e)}")

@router.post("/insight/forecast")
async def generate_forecast_insight(req: ForecastInsightRequest):
    system_prompt = """You are an elite real estate financial analyst.
Your goal is to analyze the user's pipeline revenue forecast and provide a 2-sentence strategic summary.

Your insight must be:
- Brief (maximum 2 sentences)
- Provide a clear, actionable directive (e.g., "Focus entirely on closing the ₹50L hot pipeline" or "Your pipeline is heavy on warm leads, start nurturing campaigns")
- Professional, sharp, and data-driven
"""
    
    user_prompt = f"""Generate a strategic financial forecast summary:
Total Active Leads: {req.activeLeadsCount}
Total Expected Revenue (Probability Adjusted): ₹{req.totalExpectedRevenueLakhs} Lakhs
Revenue from HOT Leads: ₹{req.hotExpectedLakhs} Lakhs
Revenue from WARM Leads: ₹{req.warmExpectedLakhs} Lakhs

Provide the summary now:"""

    try:
        insight = call_llm(system_prompt, user_prompt, temperature=0.5)
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI forecast insight failed: {str(e)}")
