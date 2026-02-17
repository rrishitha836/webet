import requests

def extract_relevant_polymarket_events(polymarket_json: dict):
    """
    Polymarket response handler:
    - If NO events → return original response
    - If events exist → return trimmed events + pagination
    - Limit to top 3 events to reduce token usage
    """

    events = polymarket_json.get("events", [])
    if not events:
        return polymarket_json

    matched_events = []

    # ORIGINAL: top 3 events, 2 markets each - still too many tokens
    # for event in events[:3]:
    #     ...
    #     for m in markets[:2]
    
    # REDUCED: top 1 event, 1 market each - minimal token usage
    for event in events[:1]:
        markets = event.get("markets", [])

        matched_events.append({
            "title": event.get("title", ""),
            "description": event.get("description", "")[:50],  # Further reduced
            "endDate": event.get("endDate"),
            "markets": [
                {"question": m.get("question", "")}
                for m in markets[:1]  # Only 1 market
            ]
        })

    pagination = polymarket_json.get("pagination", {})

    print("matched_events:", matched_events)

    return {
        "events": matched_events,
        "pagination": {
            "hasMore": pagination.get("hasMore", False),
            "totalResults": min(pagination.get("totalResults", 0), 3)
        }
    }


def search_polymarket(trend: str):
    url = "https://gamma-api.polymarket.com/public-search"
    params = {
        "q": trend,
        "limit_per_type": 5  # Reduced from 5 to save API tokens
    }

    response = requests.get(url, params=params, timeout=10)
    data = response.json()
    # print("Polymarket data:", response.json())
    return extract_relevant_polymarket_events(data)
