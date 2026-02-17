from google.adk.agents import LoopAgent
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__),"..","..")))
from utils.file_loader import load_file
from agents.process_trend_agent.agent import process_trend_agent

# ============================================================================
# OPTIMIZATION: Reduced max_iterations from 5 to 3
# Each iteration = 4 LLM calls (search_polymarket, events_check, fetch_twitter, bet_gen)
# 5 iterations × 4 agents × ~10K tokens = ~200K tokens
# 3 iterations × 4 agents × ~10K tokens = ~120K tokens
# This helps stay within the 1M tokens/minute rate limit
# ============================================================================

trend_loop_agent = LoopAgent(
    name='trend_loop_agent',
    sub_agents=[process_trend_agent],
    description=load_file("agents/loop_agent/description.txt"),
    # max_iterations=5,  # ORIGINAL - causes rate limit issues
    max_iterations=3,  # SUGGESTED - reduced to avoid rate limits
)
