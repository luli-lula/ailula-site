---
title: "A Method for Strategy Products"
date: 2020-04-01T19:51:58.000Z
lang: en
kind: essay
maturity: mature
tags:
  - 产品
legacyPaths: []
topics: [product]
translatedFrom: zh
---
-  In February, Sanjieke, an online course platform, made some courses free for a limited time. I claimed them on a whim and forgot about them, and only remembered two days before the courses expired. Then I started watching.
- The instructor is a former product manager at Baidu/DiDi. The method itself is simple, but the course has many simplified examples, so it is a good introduction if you want to understand how strategy works in other industries.
-  So I am writing down only what I took away from it, not detailed notes like I did before.


--------------------
> What a strategy product is
- It is easiest to understand a strategy product by comparing it with a feature product. Strategy and features are both tools a product manager uses to reach goals and solve problems.
- The strategy product role came out of a finer division of labor in teams.

Differences:
1. **Requirements**: A feature product deals with a relatively focused need of one person; a strategy product deals with fine-grained needs of different users in different scenarios.
2. **Solution**: A feature product's solution converges, and it is expressed through flows and prototypes; a strategy product's solution diverges, and it is expressed through logic descriptions and example outputs that show what the product should achieve.
3. **Working with engineering**: A feature PM cares more about the result and acceptance testing; a strategy PM has to take part in the process, run several rounds of evaluation, and keep analyzing and iterating together with the engineers.
4. **After launch**: A feature product reaches its ideal state faster, and the requirement is done; a strategy product may be an endless loop, making trade-offs under complex constraints and getting ever closer to the optimal solution.

> Strengths of a strategy PM

1. Better at solving complex problems: usually deals with the different needs of a group of people
2. Very strong logical thinking: has to break down the factors behind a need very clearly
3. Strong sense for data: good at finding problems in the data, which leads into a new product cycle
4. Embraces uncertainty: keeps looking for a path through the darkness of iteration

--------------------


> The strategy method
1. Define the ideal state: measure it with quantified metrics or other clear standards
2. Break down the cases that fall short of the ideal state: sample all cases below the ideal state, analyze them, classify them with statistics, and identify why the need is poorly met
3. Propose solutions: aggregate the problems, set priorities by reach, severity and cost to fix, and use that as the project plan going forward
4. Verify whether it is solved:

> Strategy method: how to find a product's ideal state
A product's ideal state means the solution actually solves the user's problem. The ideal state always serves the product goal of the current stage.
- Simple products: the ideal state is "the user's problem is solved", measured by one single data metric
- Complex products: the final effect is hard to measure with one metric. For example, search/recommendation products usually take the best solution the platform can currently deliver as the ideal state, and evaluate whether each search/recommendation result is the best one among all candidates. User behavior metrics are a secondary way to find problems.

> Strategy method: how to break down problems
Set the research goal → define the sampling population → choose the sampling method → set the sample size → analyze and label the samples → organize and summarize the problems
1. The sampled population must be complete for the goal. A common mistake is a biased case sample.
2. Analysis and labeling: you start with initial assumptions before labeling, and you keep adjusting them while you label
3. Overall summary: you need a sound framework!!! Abstract the problems into a hierarchy, from general categories down to specific ones

> Strategy method: priority (ROI)
Project benefit: reach of the problem * experience improvement once solved * expected share of cases solved
Project cost: development cost / time to launch

> How to raise the success rate of ride-hailing requests?

1. Ideal state: after a rider sends a request, a driver accepts it. Core metric: completion rate = completed trips / ride requests
2. Break down why the ideal state is not reached:
    1. Map the flow: rider sends a request (rider cancels the request) — driver accepts (no driver accepts) — pickup (driver/rider cancels after acceptance) — driver and rider meet
    2. Impact analysis: sample 1,000 unfulfilled cases and analyze the causes
![](https://lilulula.github.io//post-images/1585811559755.png)

3. Propose solutions:
![](https://lilulula.github.io//post-images/1585814793870.png)
![](https://lilulula.github.io//post-images/1585814819565.png)


> How to improve the quality of Baidu search results?

1. Ideal state: the user finds what they want at the lowest cost
Core metric: in which scenarios is the user satisfied?
After one search, the result snippets satisfy the user, and the user takes no other action
After the search, the user clicks one result that meets the need, and takes no further action
2. Break down why the ideal state is not reached:
 Randomly sample 5,000 user searches, manually judge whether each one met the need, and find the cause for the 1,500 that did not
![](https://lilulula.github.io//post-images/1585815187719.png)
3. Propose solutions:
![](https://lilulula.github.io//post-images/1585815266674.png)
--------------------

> The strategy PM workflow
1. Find problems: user feedback; system monitoring; results review; **periodic research**
2. Write the requirement and start the project
3. Follow development and evaluation
4. Review results after launch


> Finding problems
1. Define the ideal state
2. Sample and analyze why cases fall short of the ideal state
3. Classify and count all the problems, then set the optimization direction and the project priorities


> How strategy PMs find problems
1. **User feedback channels**: this is daily work; feedback is collected and analyzed every day.
   **Problem**: the problems collected are fairly random and do not show the overall state of the product. One piece of feedback may represent a class of problems, but its reach and priority are hard to judge.
   **Takeaway**: behind every piece of feedback is a real user expressing a feeling. Analyze each problem in depth, with respect.
2. **Metric monitoring**: monitoring metrics/alerts. Day to day this is mostly engineering observability, and not many problems are found from existing metrics
3. **Results review**: happens when, after the last product iteration, the results miss the target or new problems appear.
4. **Periodic research**: systematic research on the current state of the product, which gives clear direction for the next stage of work. See the basic strategy method above.


> Writing the requirement and starting the project
1. Describe the problem to solve and the expected effect once it is solved, with logic descriptions and example cases
- Simple strategy: give the rule directly (when you already have data, decide based on data analysis, e.g. the time interval after which a banking app asks for the password again when the user leaves in the middle of an operation; when going from 0 to 1, follow competitors, e.g. try the competitor's product several times to find its rule). Development cost is low
- Complex strategy: describe in detail the problem to solve / input factors / output effect / summary / example cases

2. Strategy document
    1. 0-to-1 projects: describe mostly the ideal state, i.e. what output to achieve under what input
    2. Strategy iteration projects: describe mostly the current strategy, what problems need solving, and what the ideal output is for those problems


* Project background: why start this project?
* Project goal: what is the ideal state OR the evaluation metric
* Requirement overview: lets readers understand the requirement framework of the whole document
* Requirement details: what are all the product details? Trigger conditions / factors considered / edge cases / example cases
* (Tracking requirements, monitoring requirements: not universal; not needed for 0-to-1 requirements or for bug-fix requirements)

> Following development and evaluation
1. Verify whether each version of the strategy solves all the problems:
- Target met: launch the strategy
- Target not met: what is the problem, and what is the next iteration plan

2. Strategy requirement review — strategy development — strategy evaluation — strategy optimization if below expectations — strategy evaluation — meets expectations — productionize the code — project launch
3. This is also a clear difference between strategy and features: strategy is finding a path in the dark, and it is hard to reach the ideal state in one step
4. Strategy evaluation has two types: quality evaluation and DIFF evaluation
5. Strategy quality evaluation mainly measures how well the strategy itself performs
- Recall: of the cases that should ideally be covered, the cases actually covered / the cases that should ideally be covered (how much of the problem is solved)
- Precision: of the cases actually covered, the cases that should ideally be covered / the cases actually covered (the strategy's collateral damage)

6. DIFF evaluation: focuses on the real impact on user experience after one strategy in a complex system goes live
good:same:bad (g:s:b for short): randomly sample the cases that changed, and judge from the user's point of view whether the result got better, stayed the same, or got worse
![](https://lilulula.github.io//post-images/1585818046538.png)


> Results review after launch
Verify whether the results meet the expectations set before launch:
- Target met: the product loop stops for now. Is there room for further optimization? Did it introduce new problems? How do we optimize or solve them?
- Target not met: what is the problem? Start a new product loop. What must we do to reach the target?

The key is to build the metrics system before the project starts; only then can you verify the results after launch
1. Core metric: what are the problem and the goal
2. Process metrics: what is the critical path to solving the problem and reaching the goal
3. Guardrail metrics: whom does the new path hurt


> [Example] How to reduce users' input cost in search?
1. Core metric: user input time, expected to drop by 2 seconds
2. Process metrics: map the flow to find the factors that affect input efficiency: query suggestion display rate, input length when suggestions first appear, whether the user clicks a suggestion, average input length
3. Guardrail metrics: satisfaction with search results for queries entered through suggestions

------------
> Advantages of solving problems with strategy
1. Fine-grained: different solutions for different factors
2. Self-iterating evolution: a feedback-based recommendation system evolves in a closed loop

> Where strategy fits
1. Personalized services: solve the problems of a group of people by finding each user's different interests, e.g. input methods/search/Toutiao
2. Efficiency gains: find random inefficiencies in a system, e.g. growth/promotions/mobility

> Types of strategy:
1. Feature-oriented: a solution for the needs of a single user group. Define rules that separate different user groups/scenarios, and define the standard of a good experience and the metrics for each scenario. 3R: segment users/scenarios well (Requirement), design the Rule for which resources go to which users, and prepare the Resources used to segment and meet the needs.
![](https://lilulula.github.io//post-images/1585822407440.png)

2. Business-oriented: has to consider several user groups with clearly different needs or even conflicting interests. The strategy finds a suitable path among these interest groups to maximize the overall benefit. As the stage goals change, the strategy path changes too.
![](https://lilulula.github.io//post-images/1585822347656.png)
Strategy framework: a set of several feature-oriented frameworks. Find the interests that the groups share and use them as the joints between the small frameworks. The final goal is a thriving ecosystem.

Balance is the basis for an ecosystem to exist; the growth of each party is a necessary condition for the ecosystem to thrive

3. Growth: a more efficient lever; user acquisition/activation
![](https://lilulula.github.io//post-images/1585880445896.png)
![](https://lilulula.github.io//post-images/1585880519191.png)


4. Risk control: "avoid harm at the lowest cost"; anti-fraud/risk assessment
5. Data: foundational data/user profiles
