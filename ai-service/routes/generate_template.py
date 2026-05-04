from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from llm import call_llm

router = APIRouter()

class TemplateRequest(BaseModel):
    name: str
    category: str
    agentName: str

@router.post("/generate-template")
async def generate_template(req: TemplateRequest):
    system_prompt = f"""You are SmartReach AI, an expert real estate sales assistant helping Indian real estate agents craft perfect reusable WhatsApp/Email templates.
    
Your templates must be:
- Professional yet warm and conversational
- In Hinglish (mix of Hindi and English) if appropriate for Indian real estate
- Clear and action-oriented
- Include placeholders like {{{{name}}}}, {{{{property}}}}, {{{{budget}}}}, {{{{location}}}} where appropriate.

Agent Name: {req.agentName}
"""

    user_prompt = f"""Generate a message template based on:
Template Name: {req.name}
Category: {req.category}

Write ONLY the template content. No explanation, no quotes around it."""

    try:
        content = call_llm(system_prompt, user_prompt, temperature=0.7)
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI template generation failed: {str(e)}")
