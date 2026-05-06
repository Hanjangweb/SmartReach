from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
from llm import call_llm

router = APIRouter()

class ExtractRequest(BaseModel):
    text: str

@router.post("/extract")
async def extract_lead(req: ExtractRequest):
    system_prompt = """You are a data extraction AI. Extract lead information from WhatsApp messages, Instagram DMs, or any informal text. The text may contain multiple leads.

Return ONLY a valid JSON array of objects with these fields (use null for missing values):
[
  {
    "name": "string or null",
    "phone": "string or null",
    "email": "string or null",
    "propertyType": "1BHK|2BHK|3BHK|4BHK|Villa|Plot|Commercial|Other or null",
    "budget": number in lakhs or null,
    "location": "string or null",
    "requirement": "string describing what they want or null",
    "source": "WhatsApp|Instagram|Facebook|99acres|MagicBricks|Direct|Other"
  }
]

Rules:
- Extract phone numbers in any format, return digits only
- Budget: convert to lakhs (e.g., "80 lakh" → 80, "1 crore" → 100, "50k" → null)
- Be smart about property type from context clues
- requirement: summarize their need in one sentence"""

    user_prompt = f"""Extract lead information from this message:

{req.text}"""

    try:
        result = call_llm(system_prompt, user_prompt, temperature=0.1)
        
        # Parse JSON, handle markdown code blocks
        result = result.strip()
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        result = result.strip()
        
        extracted = json.loads(result)
        # Ensure it's always a list for bulk support
        if isinstance(extracted, dict):
            extracted = [extracted]
        return {"extracted": extracted}
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse extracted data: {str(e)}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"AI service temporarily unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
