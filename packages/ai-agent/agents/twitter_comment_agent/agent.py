from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools import FunctionTool
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from utils.file_loader import load_file
from tools.post_twitter_comment import post_twitter_comment

twitter_comment_tool = FunctionTool(func=post_twitter_comment)

post_twitter_comment_agent = LlmAgent(
    name="post_twitter_comment_agent",
    model="gemini-2.5-flash",
    description=load_file(
        "agents/twitter_comment_agent/description.txt"
    ),
    instruction=load_file(
        "agents/twitter_comment_agent/instructions.txt"
    ),
    tools=[twitter_comment_tool],
    output_key="post_twitter_comment_output",
)
