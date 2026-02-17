from google.adk.agents.llm_agent import LlmAgent
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from utils.file_loader import load_file

bet_generation_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="bet_generation_agent",
    description=load_file("agents/bet_generation_agent/description.txt"),
    instruction=load_file("agents/bet_generation_agent/instructions.txt"),
    output_key="bet_generation_output",
)
