import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

MODEL = "meta-llama/llama-3.3-70b-instruct"

def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Call OpenRouter LLM and return the text response."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=1024,
        extra_headers={
            "HTTP-Referer": "https://smartreach.app",
            "X-Title": "SmartReach Real Estate AI",
        },
    )
    return response.choices[0].message.content.strip()
