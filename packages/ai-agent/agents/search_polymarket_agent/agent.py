from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools import FunctionTool
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__),"..","..")))
from utils.file_loader import load_file

from tools.search_polymarket import search_polymarket

search_polymarket_tool = FunctionTool(func=search_polymarket)

search_polymarket_agent = LlmAgent(
    name="search_polymarket_agent",
    model="gemini-2.5-flash",
    description=load_file(
        "agents/search_polymarket_agent/description.txt"
    ),
    instruction=load_file(
        "agents/search_polymarket_agent/instructions.txt"
    ),
    tools=[search_polymarket_tool],
    output_key="polymarket_search_output",
)
