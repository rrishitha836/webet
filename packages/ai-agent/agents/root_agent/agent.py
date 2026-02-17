from google.adk.agents import SequentialAgent
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__),"..","..")))
from utils.file_loader import load_file
from agents.fetch_trends_agent.agent import fetch_trends_agent 
from agents.loop_agent.agent import trend_loop_agent

root_agent = SequentialAgent(
    name = "root_agent",
    sub_agents = [fetch_trends_agent, trend_loop_agent],
    description = load_file("agents/root_agent/description.txt"),
    # instruction = load_file("agents/root_agent/instructions.txt")
) 