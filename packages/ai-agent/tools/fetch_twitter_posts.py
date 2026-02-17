import requests

def fetch_twitter_posts(trend: str):
    url = "https://api.twitterapi.io/twitter/tweet/advanced_search"
    params = {
        "query": trend,
        "queryType": "Latest",
        # "limit": 10,  # ORIGINAL - causes high token usage
        "limit": 5,  # SUGGESTED - reduces tokens by ~50%
    }
    headers = {
        "X-API-Key": "use_twitter-io_api_key"
    }

    # response = requests.get(url, headers=headers, params=params)
    # response.raise_for_status()

    # data =  response.json()
    # tweets = data.get("tweets", [])

    trimmed_tweets = []

    # for tweet in tweets:
    #     trimmed_tweets.append({
    #         "id": tweet.get("id"),
    #         "text": tweet.get("text", ""),
    #         "username": tweet.get("author", {}).get("userName"),
    #         "createdAt": tweet.get("createdAt"),
    #         "url": tweet.get("twitterUrl")
    #     })
    # Test data
    trimmed_tweets = [{"createdAt": "Tue Jan 27 16:58:53 +0000 2026", "id": "2016194212132487299", "text": "@RealCandaceO Come to Arizona. That's exactly what we have done. 😊", "url": "https://twitter.com/JanKrygier1/status/2016194212132487299", "username": "JanKrygier1"}, {"createdAt": "Tue Jan 27 16:58:52 +0000 2026", "id": "2016194206398578800", "text": "https://t.co/aGGDFjeSrp", "url": "https://twitter.com/nightmoves44/status/2016194206398578800", "username": "nightmoves44"}, {"createdAt": "Tue Jan 27 16:58:48 +0000 2026", "id": "2016194187524177984", "text": "@Frazierdee @Rightanglenews They’ve actually been all over the country at the same time in Minnesota, it’s just the police departments are cooperating and turning them over at the jails, so we don’t hear about it. It’s only in Minnesota where the fraud is and now this paid Group turned up in Arizona.", "url": "https://twitter.com/dljr2018/status/2016194187524177984", "username": "dljr2018"}, {"createdAt": "Tue Jan 27 16:58:33 +0000 2026", "id": "2016194128267379053", "text": "@E_Dilla @StephenKle29896 I think that if he bombs the interview, it would be one thing, but it’s more likely he would pull out than Arizona pass on him from what I believe", "url": "https://twitter.com/blakemurphy7/status/2016194128267379053", "username": "blakemurphy7"}, {"createdAt": "Tue Jan 27 16:58:28 +0000 2026", "id": "2016194103818510740", "text": "SCOOP: The Royal Palm Invitational, the new college hoops event slated for Dubai in November, is being organized by Mark Jurich, the ex-Louisville staffer whose 2023 Desert Classic game Arizona still hasn’t gotten paid for.\n\nDetails for @Sportico👇 \n\nhttps://t.co/JPNzLwbhis", "url": "https://twitter.com/DanielLibit/status/2016194103818510740", "username": "DanielLibit"}, {"createdAt": "Tue Jan 27 16:57:11 +0000 2026", "id": "2016193784254468305", "text": "7 Head Coaching (of 10) vacancies filled and 1 new General Manager Hired.\n\nA developing story will be the lack of minority hires outside of Robert Saleh if Goodell & Park Avenue cannot exert influence on the Arizona Cardinals.", "url": "https://twitter.com/NFLDraftBites/status/2016193784254468305", "username": "NFLDraftBites"}, {"createdAt": "Tue Jan 27 16:57:01 +0000 2026", "id": "2016193742668021919", "text": "@SamQualls12 @hissgoescobra this is in Phoenix Arizona, if i’m not mistaken. consistently forecast above 70°F high temps over the next week and a half, and not dropping below 40°F lows", "url": "https://twitter.com/agodofdoorways/status/2016193742668021919", "username": "agodofdoorways"}, {"createdAt": "Tue Jan 27 16:57:00 +0000 2026", "id": "2016193736020263301", "text": "@BussinWTB @FanDuel @FDSportsbook Good time after them embezzling all that money and hiring illegals and they won’t be here in Arizona much longer", "url": "https://twitter.com/BreakingFourty/status/2016193736020263301", "username": "BreakingFourty"}, {"createdAt": "Tue Jan 27 16:56:52 +0000 2026", "id": "2016193702092317055", "text": "Guess who or what has contorted like over baked pretzels to keep the crimes of Arizona DEMOCRAT from being exposed???? THE ARIZONA JUDICIARY!!!! Who is the ARIZONA JUDICIARY? It is LAWYERS, crooked low blow LAWYERS!!!!! Again, crooked low blow LAWYERS!!!!", "url": "https://twitter.com/JeffNas73722423/status/2016193702092317055", "username": "JeffNas73722423"}, {"createdAt": "Tue Jan 27 16:56:46 +0000 2026", "id": "2016193678264393910", "text": "@Arizona_LP Lets do a thought experiment \n\nCan another group claim to be the Arizona Libertarian Party and represent libertarians in Arizona just as you do?", "url": "https://twitter.com/SicSemper1983/status/2016193678264393910", "username": "SicSemper1983"}, {"createdAt": "Tue Jan 27 16:56:44 +0000 2026", "id": "2016193671117332957", "text": "Mel Kiper Jr is projecting that Arizona state's wide receiver Jordan Tyson goes to the saints over Notre Dame Jordan love because he goes to the Chiefs it's his mock draft so it's not final it's only his first one", "url": "https://twitter.com/TinsonJoe/status/2016193671117332957", "username": "TinsonJoe"}]

    return trimmed_tweets

