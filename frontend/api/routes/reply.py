from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from llm import call_llm

router = APIRouter()

class ConversationMessage(BaseModel):
    role: str
    message: str

class LeadContext(BaseModel):
    name: str
    propertyType: Optional[str] = "Other"
    budget: Optional[float] = 0
    location: Optional[str] = ""
    requirement: Optional[str] = ""
    status: Optional[str] = "New"
    conversationHistory: Optional[List[ConversationMessage]] = []

class ReplyRequest(BaseModel):
    lead: LeadContext
    agentName: str
    customPrompt: Optional[str] = ""

@router.post("/reply")
async def generate_reply(req: ReplyRequest):
    lead = req.lead

    # Build conversation history context
    history_text = ""
    if lead.conversationHistory:
        history_text = "\n\nPrevious conversation:\n"
        for msg in lead.conversationHistory[-6:]:
            role_label = "Agent" if msg.role == "agent" else ("Client" if msg.role == "client" else "AI")
            history_text += f"{role_label}: {msg.message}\n"

    budget_text = f"₹{lead.budget}L" if lead.budget else "not specified"

    system_prompt = f"""You are SmartReach AI, an expert real estate sales assistant helping Indian real estate agents craft perfect WhatsApp messages to convert leads.

Your replies must be:
- Professional yet warm and conversational
- In Hinglish (mix of Hindi and English) unless the lead clearly uses pure English
- Short and punchy (2-4 sentences max for WhatsApp)
- Action-oriented with a clear next step
- Never sound automated or generic

Agent Name: {req.agentName}
"""

    user_prompt = f"""Generate a WhatsApp reply for this lead:

Client Name: {lead.name}
Property Interest: {lead.propertyType}
Budget: {budget_text}
Location: {lead.location or 'not specified'}
Requirement: {lead.requirement or 'not specified'}
Current Status: {lead.status}
{history_text}

{f"Special instruction: {req.customPrompt}" if req.customPrompt else ""}

Write ONLY the WhatsApp message text. No explanation, no quotes around it."""

    try:
        reply = call_llm(system_prompt, user_prompt, temperature=0.75)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
