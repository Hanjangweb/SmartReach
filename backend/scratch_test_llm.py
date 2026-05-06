from dotenv import load_dotenv
import os
import sys

# Add ai-service to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai-service'))

load_dotenv()
from llm import call_llm

try:
    print("Calling LLM...")
    res = call_llm("You are a helpful assistant", "Say hello world")
    print("Response:", res)
except Exception as e:
    print("Error:", e)
