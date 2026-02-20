import requests

def fetch_twitter_trends():
    url = "https://api.twitterapi.io/twitter/trends?woeid=23424977&count=30" 
    headers = {
        "X-API-Key": "new1_679581fe74b54c6e87f87f71344ca6cc"
    }
    response = requests.get(url, headers=headers)

    trends = response.json()["trends"]

    # Test data
    # trends = [{"trend": {"name": "WWERaw", "rank": 1, "target": {"query": "#WWERaw"}}}, {"trend": {"name": "Arizona", "rank": 2, "target": {"query": "Arizona"}}}, {"trend": {"name": "Tony Padilla", "rank": 3, "target": {"query": "Tony Padilla"}}}, {"trend": {"name": "Bovino", "rank": 4, "target": {"query": "Bovino"}}}, {"trend": {"name": "Zverev", "rank": 5, "target": {"query": "Zverev"}}}, {"trend": {"name": "Finn", "rank": 6, "target": {"query": "Finn"}}}, {"trend": {"name": "Brayden Burries", "rank": 7, "target": {"query": "Brayden Burries"}}}, {"trend": {"name": "Maple Grove", "rank": 8, "target": {"query": "Maple Grove"}}}, {"trend": {"name": "El Centro", "rank": 9, "target": {"query": "El Centro"}}}, {"trend": {"name": "Jrue", "rank": 10, "target": {"query": "Jrue"}}}, {"trend": {"name": "TheRookie", "rank": 11, "target": {"query": "#TheRookie"}}}, {"trend": {"name": "Learner Tien", "rank": 12, "target": {"query": "Learner Tien"}}}, {"trend": {"name": "Rob Wright", "rank": 13, "target": {"query": "Rob Wright"}}}, {"trend": {"name": "Lee Majors", "rank": 14, "target": {"query": "Lee Majors"}}}, {"trend": {"name": "Homan", "rank": 15, "target": {"query": "Homan"}}}, {"trend": {"name": "Punk", "rank": 16, "target": {"query": "Punk"}}}, {"trend": {"name": "Jaxson Hayes", "rank": 17, "target": {"query": "Jaxson Hayes"}}}, {"trend": {"name": "Highguard", "rank": 18, "target": {"query": "Highguard"}}}, {"trend": {"name": "Jaden Bradley", "rank": 19, "target": {"query": "Jaden Bradley"}}}, {"trend": {"name": "Pikmin 2", "rank": 20, "target": {"query": "Pikmin 2"}}}, {"trend": {"name": "Agito", "rank": 21, "target": {"query": "Agito"}}}, {"trend": {"name": "The USOR", "rank": 22, "target": {"query": "The USOR"}}}, {"trend": {"name": "Dybantsa", "rank": 23, "target": {"query": "Dybantsa"}}}, {"trend": {"name": "Provo", "rank": 24, "target": {"query": "Provo"}}}, {"trend": {"name": "RawOnNetflix", "rank": 25, "target": {"query": "#RawOnNetflix"}}}, {"trend": {"name": "90dayfiancetheotherway", "rank": 26, "target": {"query": "#90dayfiancetheotherway"}}}, {"trend": {"name": "Schwartz", "rank": 27, "target": {"query": "Schwartz"}}}, {"trend": {"name": "Zipps", "rank": 28, "target": {"query": "Zipps"}}}, {"trend": {"name": "AJ Styles", "rank": 29, "target": {"query": "AJ Styles"}}}, {"trend": {"name": "ValentinoHC2026xFreen", "rank": 30, "target": {"query": "#ValentinoHC2026xFreen"}}}]
    # trends = [
    #     {"trend": {"name": "Arizona", "rank": 1, "target": {"query": "Arizona"}}},
    #     {"trend": {"name": "Zverev", "rank": 2, "target": {"query": "Zverev"}}},
    #     {"trend": {"name": "Jaxson Hayes", "rank": 3, "target": {"query": "Jaxson Hayes"}}},
    #     {"trend": {"name": "WWERaw", "rank": 4, "target": {"query": "#WWERaw"}}},
    #     {"trend": {"name": "Tony Padilla", "rank": 5, "target": {"query": "Tony Padilla"}}},
    # ]

    print("trends:", trends)

    for i in trends:
        i["trend"]["name"] = i['trend']["name"].replace("#", "")
    return trends
    
