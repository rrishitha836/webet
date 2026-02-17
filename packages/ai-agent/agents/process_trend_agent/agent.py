from google.adk.agents import SequentialAgent
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__),"..","..")))
from utils.file_loader import load_file
from agents.search_polymarket_agent.agent import search_polymarket_agent
from agents.events_check_agent.agent import events_check_agent
from agents.fetch_twitter_posts_agent.agent import fetch_twitter_posts_agent
from agents.bet_generation_agent.agent import bet_generation_agent
from agents.twitter_comment_agent.agent import post_twitter_comment_agent

process_trend_agent = SequentialAgent(
    name='process_trend_agent',
    sub_agents = [search_polymarket_agent, events_check_agent, fetch_twitter_posts_agent, bet_generation_agent],
    description=load_file('agents/process_trend_agent/description.txt'),
)
