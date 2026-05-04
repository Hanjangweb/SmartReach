from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from llm import call_llm

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    history: List[ChatMessage]

@router.post("/chat")
async def chat_bot(req: ChatRequest):
    system_prompt = """You are 'SmartReach AI', a helpful, professional, and friendly real estate assistant.
Your goal is to chat with potential buyers/renters on WhatsApp, answer their questions politely, and collect their requirements.

You must collect:
1. Property Type (e.g. 1BHK, 2BHK, Villa, Commercial)
2. Budget (in Lakhs or Crores)
3. Preferred Location

Keep your responses very short, conversational, and suitable for WhatsApp (1-2 sentences max). Do not sound like a robot.
If they haven't provided the above 3 things, ask for them naturally, one at a time.
Once you have collected enough information to qualify them as a lead, OR if they are just asking general questions, you MUST return a JSON object at the very end of your response, wrapped in <LEAD_DATA> tags.

Example 1 (Asking for info):
Hi there! I'd love to help you find a property. What is your preferred location?

Example 2 (Collected enough info):
Perfect, I have noted down your requirement for a 2BHK in Noida under 80 Lakhs. One of our agents will contact you shortly!
<LEAD_DATA>
{
  "propertyType": "2BHK",
  "budget": 80,
  "location": "Noida",
  "requirement": "Looking for 2BHK in Noida under 80L"
}
</LEAD_DATA>
"""

    # Format history for the prompt
    history_text = ""
    for msg in req.history:
        role = "User" if msg.role == "user" else "Assistant"
        history_text += f"{role}: {msg.content}\n"

    user_prompt = f"Here is the conversation history:\n{history_text}\n\nGenerate your next response."

    try:
        result = call_llm(system_prompt, user_prompt, temperature=0.7)
        
        reply_text = result
        extracted_data = None
        
        if "<LEAD_DATA>" in result and "</LEAD_DATA>" in result:
            parts = result.split("<LEAD_DATA>")
            reply_text = parts[0].strip()
            json_str = parts[1].split("</LEAD_DATA>")[0].strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            
            try:
                extracted_data = json.loads(json_str.strip())
            except:
                pass
                
        return {
            "reply": reply_text,
            "extracted_data": extracted_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
