"""
API Server for WeBet ADK Agent
This server exposes endpoints to trigger the agent and sends generated bets to the backend.
"""

import asyncio
import json
import re
import os
import httpx
import logging
import time
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai.types import Content, Part
from google.genai.errors import ClientError

# Import the agents
from agents.root_agent.agent import root_agent
from agents.process_trend_agent.agent import process_trend_agent

load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
AGENT_API_KEY = os.getenv("AGENT_API_KEY", "your-agent-api-key")
SKIP_BACKEND = os.getenv("SKIP_BACKEND", "false").lower() == "true"


MAX_RETRIES = 3  # Number of retries when rate limit is hit
RETRY_BASE_DELAY = 15  # seconds - based on Gemini's suggested retry delay (14s)
RATE_LIMIT_DELAY = 2.0  # seconds between agent iterations to avoid hitting rate limits

app = FastAPI(
    title="WeBet AI Agent API",
    description="API server for WeBet AI Agent powered by Google ADK",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session service for ADK
session_service = InMemorySessionService()

# Request/Response models
class TriggerRequest(BaseModel):
    prompt: Optional[str] = "Generate betting suggestions based on the latest Twitter trends"

class BetOutput(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    twitterTrend: Optional[str] = None
    tweetId: Optional[str] = None
    rawBetText: Optional[str] = None

class TriggerResponse(BaseModel):
    success: bool
    message: str
    bets: List[BetOutput] = []
    betsCreated: int = 0
    betsSkipped: int = 0


def parse_bet_output(output: str, trend: str = None) -> Optional[BetOutput]:
    """
    Parse the bet_generation_agent output into a structured bet.
    The agent outputs: {"bet": "WeBet $X on ...", "id": "tweet_id", "category": "category_slug"}
    """
    if not output or output.strip() == "SKIP":
        return None
    
    try:
        # Try to extract JSON from the output
        json_match = re.search(r'\{[^}]+\}', output, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            bet_text = data.get("bet", "")
            tweet_id = data.get("id", "")
            category = data.get("category", "other")
            
            if bet_text:
                # Extract the outcome from bet text for the title
                # Format: "WeBet $X on [outcome]"
                outcome_match = re.search(r'WeBet \$\d+ on (.+)', bet_text, re.IGNORECASE)
                outcome = outcome_match.group(1) if outcome_match else bet_text
                
                bet = BetOutput(
                    title=f"Will {outcome}?" if outcome_match else bet_text,
                    description=bet_text,
                    category=category,
                    twitterTrend=trend,
                    tweetId=tweet_id,
                    rawBetText=bet_text
                )
                logger.info(f"✅ Parsed bet: {bet.title} (category: {category})")
                return bet
    except json.JSONDecodeError as e:
        logger.warning(f"JSON decode error: {e}")
    except Exception as e:
        logger.error(f"Error parsing bet output: {e}")
    
    return None


async def send_bets_bulk_to_backend(bets: List[BetOutput]) -> int:
    """Send multiple bets to the backend in bulk"""
    if SKIP_BACKEND:
        logger.info(f"🔵 [SKIP_BACKEND] Would send {len(bets)} bets to backend")
        return len(bets)
        
    try:
        async with httpx.AsyncClient() as client:
            payload = [
                {
                    "title": bet.title,
                    "description": bet.description,
                    "categorySlug": bet.category or "other",
                    "twitterTrend": bet.twitterTrend or bet.tweetId,
                    "options": [
                        {"option": "Yes"},
                        {"option": "No"}
                    ]
                }
                for bet in bets
            ]
            
            response = await client.post(
                f"{BACKEND_URL}/api/agent/bets/bulk",
                json=payload,
                headers={
                    "X-API-Key": AGENT_API_KEY,
                    "Content-Type": "application/json"
                },
                timeout=60.0
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                count = len(result) if isinstance(result, list) else 0
                logger.info(f"✅ {count} bets sent to backend")
                return count
            else:
                logger.error(f"❌ Failed to send bets: {response.status_code} - {response.text}")
                return 0
    except Exception as e:
        logger.error(f"❌ Error sending bets to backend: {e}")
        return 0


async def run_agent_and_get_bets(prompt: str) -> TriggerResponse:
    """Run the ADK agent (loop agent) and extract all generated bets with retry logic"""
    
    APP_NAME = "webet_agent"
    USER_ID = "webet_system"
    SESSION_ID = f"session_{int(datetime.now().timestamp() * 1000)}"
    
    all_bets: List[BetOutput] = []
    skipped_count = 0
    current_trend = None
    raw_outputs = []
    retry_count = 0
    
    logger.info("=" * 60)
    logger.info("🚀 STARTING AGENT RUN")
    logger.info(f"📝 Prompt: {prompt}")
    logger.info(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)
    
    try:
        # Create session
        await session_service.create_session(
            app_name=APP_NAME, 
            user_id=USER_ID, 
            session_id=SESSION_ID
        )
        logger.info(f"📦 Session created: {SESSION_ID}")
        
        # Use root_agent which includes fetch_trends -> loop_agent
        runner = Runner(
            agent=root_agent,
            app_name=APP_NAME,
            session_service=session_service
        )
        logger.info(f"🤖 Using agent: {root_agent.name}")
        
        new_message = Content(role="user", parts=[Part(text=prompt)])
        
        # Run the agent with retry logic for rate limits
        while retry_count < MAX_RETRIES:
            try:
                # Run the agent and collect all bet outputs
                events = runner.run_async(
                    user_id=USER_ID,
                    session_id=SESSION_ID,
                    new_message=new_message
                )
                
                logger.info("🔄 Processing agent events...")
                
                event_count = 0
                final_author = None
                last_event_time = time.time()
                
                async for event in events:
                    # Add small delay between events to avoid overwhelming the API
                    current_time = time.time()
                    if current_time - last_event_time < 0.5:
                        await asyncio.sleep(0.5)
                    last_event_time = time.time()
                    
                    event_count += 1
                    author = getattr(event, 'author', 'unknown')
                    logger.info(f"📨 Event #{event_count}: {type(event).__name__} from {author}")
                    
                    # Check for content in event - THIS IS WHERE BETS COME FROM
                    if hasattr(event, 'content') and event.content:
                        if hasattr(event.content, 'parts') and event.content.parts:
                            for part in event.content.parts:
                                if hasattr(part, 'text') and part.text:
                                    text = part.text
                                    truncated = text[:200] + "..." if len(text) > 200 else text
                                    logger.info(f"   Content: {truncated}")
                                    raw_outputs.append(text)
                            
                            # Check if this is from bet_generation_agent and contains a bet
                            if author == 'bet_generation_agent':
                                if text.strip() == "SKIP":
                                    skipped_count += 1
                                    logger.info(f"⏭️ SKIPPED trend: {current_trend}")
                                else:
                                    bet = parse_bet_output(text, current_trend)
                                    if bet:
                                        all_bets.append(bet)
                                        logger.info(f"🎯 BET #{len(all_bets)}: {bet.title}")
                                        logger.info(f"   Description: {bet.description}")
            
                    # Look for state updates (for tracking current trend)
                    if hasattr(event, 'actions') and event.actions:
                        for action in event.actions:
                            if hasattr(action, 'state_delta') and action.state_delta:
                                state = action.state_delta
                                
                                # Track current trend being processed
                                if 'current_trend' in state:
                                    current_trend = state['current_trend']
                                    logger.info(f"📊 Processing trend: {current_trend}")
                    
                    # Check final response - but only break if it's from root_agent, not sub-agents
                    if event.is_final_response():
                        final_author = author
                        logger.info(f"🏁 Final response from: {author}")
                        # Only break if this is actually the root agent finishing
                        if author == "root_agent" or author == "trend_loop_agent":
                            logger.info("✅ Root agent finished")
                            break
                        # For sub-agents, just log and continue
                        logger.info(f"   (Continuing - waiting for more agents...)")
                
                # Successfully completed - break out of retry loop
                break
                
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    retry_count += 1
                    if retry_count < MAX_RETRIES:
                        wait_time = RETRY_BASE_DELAY * retry_count
                        logger.warning(f"⚠️ Rate limit hit. Retry {retry_count}/{MAX_RETRIES} in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error(f"❌ Max retries exceeded for rate limit")
                        # Return partial results if we have any
                        if all_bets:
                            logger.info(f"📦 Returning {len(all_bets)} partial bets collected before rate limit")
                            break
                        raise
                else:
                    raise
        
        logger.info("=" * 60)
        logger.info("📊 AGENT RUN SUMMARY")
        logger.info(f"   Total events processed: {event_count}")
        logger.info(f"   Total bets generated: {len(all_bets)}")
        logger.info(f"   Trends skipped: {skipped_count}")
        logger.info(f"   Retries used: {retry_count}")
        logger.info("=" * 60)
        
        # Print all bets in a nice format
        if all_bets:
            logger.info("\n🎲 GENERATED BETS:")
            for i, bet in enumerate(all_bets, 1):
                logger.info(f"\n--- Bet #{i} ---")
                logger.info(f"Title: {bet.title}")
                logger.info(f"Description: {bet.description}")
                logger.info(f"Category: {bet.category}")
                logger.info(f"Trend: {bet.twitterTrend}")
                logger.info(f"Tweet ID: {bet.tweetId}")
        
        if not all_bets:
            return TriggerResponse(
                success=True,
                message=f"No bets generated. {skipped_count} trends skipped. Events: {event_count}. Check terminal logs for details.",
                bets=[],
                betsCreated=0,
                betsSkipped=skipped_count
            )
        
        # Send all bets to backend in bulk
        bets_created = await send_bets_bulk_to_backend(all_bets)
        
        return TriggerResponse(
            success=True,
            message=f"Generated {len(all_bets)} bets, {bets_created} sent to backend, {skipped_count} trends skipped",
            bets=all_bets,
            betsCreated=bets_created,
            betsSkipped=skipped_count
        )
            
    except Exception as e:
        logger.error(f"❌ Error running agent: {e}")
        import traceback
        traceback.print_exc()
        return TriggerResponse(
            success=False,
            message=f"Agent error: {str(e)}",
            bets=[],
            betsCreated=0,
            betsSkipped=0
        )


# API Endpoints

@app.get("/")
async def root():
    return {"status": "ok", "message": "WeBet AI Agent API is running"}


@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "agent": "root_agent with loop",
        "skip_backend": SKIP_BACKEND,
        "backend_url": BACKEND_URL
    }


@app.post("/api/agent/run", response_model=TriggerResponse)
async def trigger_agent(request: TriggerRequest):
    """
    Trigger the AI agent to generate bets from Twitter trends.
    The loop agent will process multiple trends and generate bets.
    All generated bets are automatically sent to the backend.
    """
    logger.info(f"📨 Received trigger request: {request.prompt}")
    result = await run_agent_and_get_bets(request.prompt)
    return result


if __name__ == "__main__":
    import uvicorn
    logger.info("=" * 60)
    logger.info("🚀 STARTING WEBET AI AGENT API SERVER")
    logger.info(f"   Backend URL: {BACKEND_URL}")
    logger.info(f"   Skip Backend: {SKIP_BACKEND}")
    logger.info(f"   Port: 8000")
    logger.info("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)
