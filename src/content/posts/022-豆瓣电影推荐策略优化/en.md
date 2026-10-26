---
title: "Improving Douban’s Movie Recommendations"
date: 2020-04-03T14:23:12.000Z
lang: en
kind: essay
maturity: mature
tags:
  - 产品
legacyPaths: []
topics: [product, movies]
translatedFrom: zh
---
#### Problem: improving the strategy behind the "People who like this film also like" module on Douban Movie's web pages

1. The ideal state of the recommendation module: help users discover films they will mark as "Want to Watch"
2. Metrics: click-through rate on the recommendation list (interest); share of clicks that end in a "Want to Watch" mark (intent)
3. Understanding the need:
    1. What makes a user want to watch a film (user preferences, film features, related behavior of other users)
    2. "People who like X also like" is, at heart, related-item recommendation: the relevance of one film to another, measured as the share of users who marked both films as liked.
4. Initial research: I took 10 films I had watched recently and checked whether their recommendation lists met my needs. None of the lists made me go on to mark a film as "Want to Watch". With internal access, I would sample clicked and unclicked items from the recommendation lists and compare them.
5. Inferring the logic of the current recommendation strategy
- User features: not used. Being logged in or not makes no difference to the results (Douban's recommendations here are not personalized at all! A fairly big bug: because user data is not used, for some genres I had already seen every recommended film)
- Genre: strong feature; almost all 10 recommended films are of the same genre
- Tags: strong feature; user tags already capture the features people consider abstract, so they correlate strongly
- Director: medium feature; for some films, other films by the same director appear in the list but are not ranked near the top
- Release year: weak feature; for some older films, the recommendations span a wide range of years
- Country: weak feature; I saw no strong correlation and am not sure it plays a role
- Rating / number of ratings: this one surprised me a little. Almost all recommendations are within ±1 point of the source film's rating. So you only get good films recommended if you watch good films!
- Doulists (Douban's user-curated lists): weak feature; in the few cases I tried, I found no shared Doulist, possibly because the films are fairly obscure

6. Likely reasons the module falls short of the ideal state (with a larger sample and user click data, I could give the share of each cause and a fix for each)
    1. The recommended films are already marked (Watched / Want to Watch / Watching), so recommending them is pointless
    2. When user-defined tags are too broad, the recommendations become broad and irrelevant, e.g. most of the shared tags are "Drama", "China", and so on
    3. Diversity among the recommended films: some lists recommend parts 1, 2 and 3 of the same series
    4. Presentation: only a poster and a title, which is not enough information to make me click

7. Proposed solutions
    1. Add user features: stop recommending films the user has already marked, and add relevance analysis against films the user has marked and rated before
    2. Add user preferences: score candidates by the genre, film and actor preferences in the user profile
    3. Mine film features: extract richer tag information from the films themselves; standardize the system for user-added tags
    4. Diversity control: label films from the same series or with duplicate category tags
    5. Better presentation: show the title and a reason for the recommendation (e.g. director, cast, reviews)

----------
#### A broader question: how to discover more content
1. The core needs that Douban's books, movies and music section serves are: discovering books, films and music you want to try, and recording what you have read, watched and listened to, with your reviews. The first need, discovery, has two paths: search and recommendation. Search is mostly purposeful; recommendation is for discovery when you have no clear goal.
2. I remember that I started to love films back when Bilibili had a huge film library. Every obscure film came with danmaku (on-screen bullet comments) that explained it, and at the end many generous viewers suggested that anyone who liked this film should try XXX, followed by a short reason.
3. How well is this pain point served today? Many WeChat official accounts, Weibo accounts and news outlets recommend films and books, but how do you make it truly personal? Open Douban's "Good Film Recommendations" group and you can see all kinds of requests:
    1. Films with a brilliant female lead, please
    2. Films that make you truly feel women's charm
    3. Films about teachers
    4. Black comedies
    5. Thrillers and horror films like *Andhadhun*
    6. Comedies that are really tragedies underneath
    7. What are some body-swap films?
    8. Any super-sweet dramas with no angst?

#### What has Douban improved?
The recommendations on the web version are probably not very effective, but in 2019 I saw several Douban redesigns that worked on this.
1. Search improvements:
    1. More content: search now covers an "All" tab, books/movies/music, groups, diaries and users, though, as you would expect, still not Broadcasts (Douban's status updates)
    2. More on the page: the default page no longer shows only your search history; it adds trending searches, group topics and more
2. Recommendation improvements (in the app)
    1. "People who like this film also like"
   - Shows each film's rating, which makes choosing easier
   - Puts the "Want to Watch" action up front, and films you have seen are marked "Watched" in the list (I am a bit puzzled why it recommends films I have already seen; my guess is that it reinforces the sense of achievement users get from marking films)
![](https://lilulula.github.io//post-images/1585894455114.jpeg)
       

    2. "Recommended for you" on the movie home page (personalized recommendations)
        - List recommendations (heartwarming films / art-house films / French films) ~ genre picks curated by the operations editors
        - Film recommendations (poster + stills + rating + a featured review + reason tags)
        - The "Want to Watch" action is put up front
        - Reason tags: "People who like XXX also like", "Mainland China / heartwarming / family", "Overlooked gems of 2016", "Directed by Woody Allen", "Based on a true story", "Highest-rated Japanese films of 2017", "Highest-rated historical films"

    3. Charts (herd mentality)
        - Top 250
        - Top 20 by genre
        - Annual lists (by category)
        - Weekly word-of-mouth chart
        - Trending films right now


#### Further thoughts
1. Among personalized recommendation products, the ones with a good reputation are Douban FM and, later, NetEase Cloud Music, and today's Toutiao (for its technology only)
2. Recommending music and news is simpler than recommending films. A film has a high cost of verification (it takes 2+ hours to watch), so it is also harder.
3. A good experience: I want to watch a film and find one that interests me in the recommendations — I can easily find a way to watch it — I watch it and it really is good (for films Douban recommends, this flow is very long.)
