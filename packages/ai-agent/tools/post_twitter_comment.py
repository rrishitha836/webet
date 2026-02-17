import os
import requests
from requests_oauthlib import OAuth1

# Add your keys

API_KEY = ""           
API_SECRET = ""      
ACCESS_TOKEN = ""   
ACCESS_SECRET = ""  

x_api_url = "https://api.x.com/2/tweets"

def post_twitter_comment(bet: str, tweet_id: str):
    auth = OAuth1(API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_SECRET)

    payload = {
        "text": bet,
        "reply": {"in_reply_to_tweet_id": tweet_id}
    }

    response = requests.post(x_api_url, auth=auth, json=payload, timeout=10)
    response.raise_for_status()
    return response.json()


