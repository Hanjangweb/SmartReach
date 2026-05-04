from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
from llm import call_llm

router = APIRouter()

class PropertyItem(BaseModel):
    id: str
    title: str
    type: str
    price: float
    location: str
    description: str

class MatchRequest(BaseModel):
    lead_budget: float
    lead_location: str
    lead_type: str
    lead_requirement: str
    properties: List[PropertyItem]

@router.post("/match")
async def match_properties(req: MatchRequest):
    if not req.properties:
        return {"matches": []}

    system_prompt = """You are an expert real estate AI Matchmaker.
You will be given a Lead's preferences (budget in lakhs, location, property type, and specific requirements) and a list of available properties.
Your job is to find the Top 3 best matching properties for this lead.

Return ONLY a valid JSON array of objects, containing the top matches, ranked from best to worst.
Each object must have:
- "propertyId": the id of the property
- "score": a match score from 0 to 100
- "reason": a short, persuasive 1-sentence reason why this is a good match for the lead.

Example output:
[
  {
    "propertyId": "12345",
    "score": 95,
    "reason": "Perfectly matches the 2BHK requirement in Noida well under the 80L budget."
  }
]"""

    props_text = "\n".join([f"ID: {p.id} | Title: {p.title} | Type: {p.type} | Price: {p.price}L | Loc: {p.location} | Desc: {p.description}" for p in req.properties])

    user_prompt = f"""Lead Preferences:
Budget: {req.lead_budget} Lakhs
Location: {req.lead_location}
Type: {req.lead_type}
Requirement: {req.lead_requirement}

Available Properties:
{props_text}

Return the top 3 matches in JSON format."""

    try:
        result = call_llm(system_prompt, user_prompt, temperature=0.2)
        
        # Parse JSON
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        result = result.strip()
        
        matches = json.loads(result)
        # Sort by score descending and take top 3 just in case
        matches = sorted(matches, key=lambda x: x.get("score", 0), reverse=True)[:3]
        return {"matches": matches}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse match data: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")
