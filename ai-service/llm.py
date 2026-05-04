import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    raise ValueError("OPENROUTER_API_KEY environment variable is not set")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

MODEL = "meta-llama/llama-3.3-70b-instruct"

def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Call OpenRouter LLM and return the text response."""
    try:
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
    except Exception as e:
        raise RuntimeError(f"LLM API call failed: {str(e)}")
