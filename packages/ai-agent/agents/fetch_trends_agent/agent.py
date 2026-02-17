from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools import FunctionTool
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__),"..","..")))
from utils.file_loader import load_file
from tools.fetch_twitter_trends import fetch_twitter_trends

fetch_trends_tool = FunctionTool(func = fetch_twitter_trends)

fetch_trends_agent = LlmAgent(
    model='gemini-2.5-flash',
    name='fetch_trends_agent',
    description= load_file("agents/fetch_trends_agent/description.txt"),
    instruction= load_file("agents/fetch_trends_agent/instructions.txt"),
    tools = [fetch_trends_tool],
    output_key= "fetch_trends_output",
    disallow_transfer_to_parent=True,  # Don't transfer back, let sequential continue
    disallow_transfer_to_peers=True,   # Only store in state
)
