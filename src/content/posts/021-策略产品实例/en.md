---
title: Strategy Products in Practice
date: 2020-04-02T19:05:19.000Z
lang: en
kind: essay
maturity: mature
tags:
  - 产品
legacyPaths: []
topics: [product]
translatedFrom: zh
---
> Destination search and recommendation strategy
1. Product goal: help users enter their destination at the lowest possible cost
2. Understanding the need: (predicting the need) what shapes a user's destination: origin, time, past behavior, the words typed so far for the destination
3. Metrics: recall and precision of the recommendation strategy

> Public transit route recommendation strategy
1. Product goal: get from origin to destination at the lowest cost
2. Understanding the need: how do we judge "lowest cost"? Departure time (is the user in a hurry?), destination type, the user's past behavior (preferred mode of transport, price sensitivity, etc.)
3. Metrics:
4. Solution: produce the set of all routes that reach the destination — weight the costs according to the inferred need and rank the candidate routes — show what the ranking is based on (duration, walking distance, price and other data)

> Web search strategy
1. Product goal: get information efficiently
2. Metric: search satisfaction
    ![](https://lilulula.github.io//post-images/1585821897735.png)
   
3. [Semantic understanding]
    1. The need is clear;
        1. Short, clearly structured queries: word segmentation is enough before retrieval
        2. Conversational queries: need semantic processing such as spelling correction and synonym rewriting
        3. Queries with very complex phrasing: need more specialized semantic processing, e.g. 披星（）月 (an idiom with one character left blank)
    2. The need is clear, with specific requirements for the answer;
        1. Beyond the standard query rewriting, the specific requirements must be turned into features the search engine can understand
            1. Latest pork prices: freshness of the resource
            2. Streams or downloads of movie XX: whether the resource actually works
            3. PowerPoint assets: availability & a specific file format
    3. The need is unclear and has to be expanded and predicted
        1. Ode to Joy (a TV drama): video links, plot summary, cast list, reviews
        2. A movie title: trailer before release, release date, synopsis, online ticketing, reviews after it leaves theaters
    4.  After this classification, every query is parsed into the same structure: need category / need keywords / need strength / terms to retrieve / other constraint features, which then drive retrieval
    5.  Metrics: recall and precision of each query rule, and precision and recall for each need type
4. [Ranking] Need strength (the probability of matching the need), result quality (relevance, authority, freshness, availability) and user click behavior are combined into one ranking score that sets the order of the search results
5. [Presentation]
    1. General strategy: extract the query-related information from each result page into a title and snippet, and highlight the matched terms in red to help users filter information
    2. Refined strategy: different presentation for different needs
        1. A single, clear need: weather, customer service phone number — put the answer summary up front
        2. Converging user paths: NetEase Mail (log in), Ode to Joy (episodes), songs (play) — cut the number of steps
        3. For results of different resource types, tailor the snippet (video, images, news, maps)


> Content recommendation strategy
1. Product goal: Kill Time
2. Understanding the need: basic features, past behavior, real-time features and so on together make up the user's latent need
3. Ranking: rank by need prediction combined with all kinds of result features, unified into a CTR prediction model
4. Presentation: serve the click, while avoiding clickbait


> Ride-hailing dispatch strategy 0.0
1. The stakeholders: passengers want to be picked up by the nearest driver (shortest wait); drivers want the most profitable orders (shortest pickup, longest trip, least traffic)
2. Boundary values: the longest wait a passenger will accept is X minutes; the farthest pickup distance a driver will accept is X km
3. Analyze the interests of both sides: both want a match to happen, but the conflict is that everyone wants the best possible match, and the best resources are scarce
4. Goal for this stage: maximize the match rate (when passenger demand is the scarcer side, favor passengers)
5. Solution:
![](https://lilulula.github.io//post-images/1585878966815.png)


> Ride-hailing dispatch strategy 1.0 — passenger-centric
1. Situation at this stage: demand is low-frequency and sparse, on the order of 10k orders/day
2. Passengers: just want to get a car; drivers: don't depend on the platform, any order will do
3. Solution: passenger-centric, broadcast each order from the nearest driver outward; set a maximum broadcast distance to protect the driver experience
4. Problem: as order density grows, multiple orders are pushed to drivers indiscriminately — driver A gets several orders while driver B gets none
> Ride-hailing dispatch strategy 2.0 — driver-centric
1. Situation at this stage: dense demand, 100k orders/day
2. Passengers: get a car; drivers: want closer, better orders (there are several ride-hailing platforms on the market)
3. Solution: driver-centric — when a driver needs an order, broadcast orders from far to near; set a maximum broadcast distance to protect the driver experience
4. Problem: dispatching on distance alone makes it hard to pick out the good orders



> Ride-hailing dispatch strategy 2.n — driver-centric order recommendation system
1. Situation at this stage: demand keeps growing, >100k orders/day
2. Solution: add trip length, destination features, the probability that the order has already been taken, cancellation probability, driver features and other factors, and upgrade to a recommendation system
3. Driver-centric: when a driver needs an order, select the nearby orders and rank them with the model
4. Problem: drivers and passengers are clearly unevenly distributed — there are passengers like P1, far from every driver, whose orders can't be broadcast, and passengers like P2, close to every driver, whose orders get broadcast again and again


> Ride-hailing dispatch strategy 3.0 — platform-centric order matching system
1. Situation at this stage: demand keeps getting denser, >1M orders/day
2. Solution: consider all passengers and drivers in an area at the same time, and evaluate many possible pairings to find the one that gives everyone the best experience (the highest number of completed trips)
3. Iteration: assignment system, dynamic pricing
