from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools import FunctionTool
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from utils.file_loader import load_file
from tools.fetch_twitter_posts import fetch_twitter_posts
fetch_twitter_posts_tool = FunctionTool(func=fetch_twitter_posts)


fetch_twitter_posts_agent = LlmAgent(
    model="gemini-2.5-flash",
    name="fetch_twitter_posts_agent",
    description=load_file("agents/fetch_twitter_posts_agent/description.txt"),
    instruction=load_file("agents/fetch_twitter_posts_agent/instructions.txt"),
    tools=[fetch_twitter_posts_tool],
    output_key="fetch_twitter_posts_output",
)
