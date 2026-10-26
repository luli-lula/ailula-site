---
title: "A Primer on Self-Driving Cars"
date: 2020-05-09T16:17:05.000Z
lang: en
kind: notes
maturity: growing
tags:
  - Books
legacyPaths: []
topics: [books]
translatedFrom: zh
---
Authors: Hod Lipson, Melba Kurman
Rating: ***
Short review: I wanted to understand this industry because I was changing jobs. It is a good introductory book. On one hand, it answers many of the questions the general public has about autonomous driving; on the other, it gives a simple introduction to the basics, such as the software, hardware and sensors involved. After reading it, I am still optimistic about the future of self-driving cars. After all, it was one of the key scenes of the future we imagined in our primary-school essays.

Some of the notes below are written mainly for myself.
<!-- more -->


## Why self-driving cars are not widespread yet
If all it took was programming a four-wheeled robot to follow the rules of the road, self-driving cars would have become common decades ago. So why is it only now that cars can become intelligent and autonomous?
 
**1. The first reason is practical: the barrier to entry is very high.** 
 
Human lives are at stake, so the cost of a mistake is very high. It is a bit like Didi: the safety requirements are extremely strict. So for now, trials happen in areas with a high tolerance for error: hauling ore, farm harvesters, factory logistics, fixed routes at airports
> This also explains why today's first autonomous vehicles are being used in sparsely populated places first: if a vehicle fails or strays from its planned route there, the human casualties are minimal. For example, in remote northern Australia, mining companies use huge autonomous trucks to haul ore; farmers use self-driving tractors and combine harvesters to work vast, empty farmland; in distribution centers and factories, specialized automated vehicles carry goods from one side of a room to the other; at resorts and airports, driverless shuttles called Navia carry passengers back and forth along fixed routes at a set speed of 15 miles per hour...
 
 
**2. The second difficulty, and the key one, is the purely technical problem**
 
> Although 99% of the time driving is mindless and predictable, during the other 1% of the time something unexpected happens. Living organisms rely on what is called "instinct" (Simple) to deal with the sudden unknowns of life. It is "instinct" that lets humans drive freely through rush-hour traffic, and it is "instinct" that holds many of the abilities of human intelligence that are especially hard to replicate.
 
> Deep learning software "learns" by observing the world, and this gives it another huge advantage: it is not rule-bound



**3. In fact, the main human factor that holds back the wide adoption of self-driving cars is government oversight and regulation** 
 
> Ideally, the highest levels of government should set forward-looking policy instead of only reacting. For example, legal experts should re-examine liability law, to make clear who is responsible for what when a driverless car causes an accident.
 

## The safety of self-driving cars

This is similar to comparing the fatality rate of taxis with the fatality rate of ride-hailing cars.

> There is a strange irony about cars. Since their invention, cars have "killed" millions of people, yet our society still turns a blind eye to the deaths they cause, perhaps out of a kind of indifferent acquiescence. Every year, nearly 1.2 million people worldwide die in car crashes; murder, suicide and war are estimated to cause 1.6 million deaths a year; and drugs cause about 183,000 deaths a year.
 
 
> A study by the Eno Center for Transportation predicted that if 90% of the cars on the road became autonomous, the number of people killed in car crashes in the United States alone could fall from 32,400 to 11,300 a year.
 

 ## 7 myths about self-driving cars

 1. Autonomous driving technology will grow out of today's driver-assistance technology.
> In fact, this kind of staged handover of control is not only technically difficult but also unsafe. Research has found that when humans and machines share control of the steering wheel, and the human is suddenly asked to take the wheel in an emergency, the human is often unable to cope, because they cannot focus their attention.
> The technology needed for fully autonomous driving is not a derivative of today's driver-assistance technology. It follows its own, separate development path.
 
> I came to see that one of the core principles of good management is never to split one critical task between two people. This is a classic management mistake known as "split responsibility". In Google's report we already saw human nature at work. This, too, is classic split responsibility, or what engineers call "automation bias": once people see that a technology works, they quickly trust it. As a result, when people are encouraged to hand over control and relax, it is hard for them to re-engage with the task of driving.

2. Technology progresses in a linear way.
3. The public will reject self-driving cars.
4. Self-driving cars need large investments in infrastructure.
> In fact, all that self-driving software needs for guidance is clear lane markings. Beyond that, self-driving cars do not need any special infrastructure.
5. Self-driving cars will create ethical dilemmas. 
6. Self-driving cars must have a near-perfect driving record to be safe enough.
> As long as self-driving cars have a better safety record than the average human driver, they will benefit humanity
7. Self-driving cars will suddenly arrive in large numbers all at once
> In fact, self-driving cars will be adopted gradually. Autonomous cars will first be used in restricted areas, such as resorts, university campuses and closed-off downtown areas. On public roads, the self-driving "invasion" will be gradual: as human-driven cars are slowly retired, the share of self-driving cars will grow by only a few percentage points each year.
 
## A timeline for self-driving technology
 
> Even when people can buy a fully tested, legally certified autonomous car, the average life of a car today is 10 to 15 years, so it will still take about 20 years to get all the old, human-driven cars off the road.
 
## Carmakers doing self-driving
 
> One risk that unsettles car company executives is that the "hardware" of future vehicles — the metal frame (chassis), the engine, the interior and so on — will have to serve the layout of the computer hardware first, and will be reduced to a mere accessory of the car's software. If, in consumers' eyes, a car's software system becomes the feature that most sets it apart, car companies will lose control of the car market.
 
 
## The ideal future is cheap public transport replacing car ownership (robotaxi)
> Self-driving cars bring unknowns and uncertainty to the car industry. For the past century, selling cars directly to consumers has been a good business. But if self-driving cars make consumers prefer to pay for each trip instead of buying a car of their own, it will also be hard to sell these ordinary, non-intelligent cars to the transport companies that rent out self-driving cars. If one day car companies have to partner with software companies to build self-driving cars, the result of that union will be that car companies get only a small share of the final sales profit.
 
 
 ## The self-driving system

### Low-level controls: acceleration, braking and steering
 
> Predictive algorithms are often built on top of the low-level controls, to keep the robot moving smoothly. Predictive algorithms can improve the car's situational awareness by constantly watching for changes in the digital map, so that the amount of fuel injected into the engine can be calculated precisely and the car can climb and descend hills smoothly and steadily. Some fuel-injection systems use data streams from several different sensors and take many additional factors into account, such as engine load, air humidity and the oxygen level of the surrounding air, to calculate just the right amount of fuel to inject to keep the engine running at a constant speed.
 
> One of the major problems in getting a gasoline engine to run steadily is time delay, also called "lag time". For an engine, or for a system, lag may look like a small, unimportant issue, but it can affect how feedback-control devices work, even the best ones. Because injecting fuel into a gasoline engine is, at its core, a mechanical and chemical (not electronic) process, the unpredictable situations that lag creates make the gasoline engines of self-driving cars a particular concern. This lag means that it is hard to time a car's starting, acceleration and stopping precisely.
 
> However, there are at least two ways to reduce the effect of lag on autonomous cars. One way is to put more computing power into the low-level controls. A powerful computer can reduce the delay caused by the fuel injectors and give the gasoline engine more accuracy for smooth running and precise timing, until it reaches a good balance. The second way to solve the problem is to replace the engine. Electric motors are much easier to manage and regulate, which is one reason why Google and Tesla both chose electric motors for their prototype self-driving cars. Set an electric motor to a specific voltage, and it will always instantly produce the matching torque to push the car forward. It is a pity that for decades a great many brilliant people have put their minds to the problem of regulating gasoline engines, because once fully electric motors are used in self-driving cars, all that rich body of work will be worth nothing.
 
### High-level controls: route planning and navigation
 
> Low-level controls, which handle only the car's basic operation, may finish their tasks quickly, but high-level controls work over much longer periods, sometimes for the whole trip. If low-level controls are like "reflexes", then high-level controls are like "higher mental activity", what we traditionally call "thinking". High-level controls are built on route planning and navigation, and both depend on search algorithms.
 
> As we mentioned earlier, one big advantage self-driving cars have over other mobile robots is that they move on four wheels and do not need a body or limbs to move. And this is true: because cars roll, the designers of self-driving cars can avoid many of the computational problems that disaster-response robots such as CHIMP run into on the way to autonomy.
 
### Mid-level controls — artificial perception
> What should we call the various emerging software toolkits that do not fit fully into either low-level or high-level controls? After some thought, we simply put this software into a category we call "mid-level controls".
> We use the phrase "mid-level control software" for the software tools that give a car artificial perception and intelligent responses. Mid-level control software lets the car's operating system make sense of sensor data, perceive the physical layout of the environment around the vehicle, and work out the best response to the objects and events around it. 
 
In simple terms? First, the real world is turned into data; then objects are recognized; next, the trajectories of the surrounding objects are predicted; finally, a route is planned based on those predictions

> We will explain how mid-level controls work through four modules. The first module is a software tool called an occupancy grid. The second module is a software program that recognizes and labels the raw data flowing into the occupancy grid. The third module uses predictive AI software to replace obstacles with cones of uncertainty. Finally, the fourth module is a short-term trajectory planner, which guides the car around the obstacles it perceives while making sure it obeys the traffic rules.
 
 
## Self-driving hardware 
1. HD maps
2. Digital images
3. LiDAR (light detection and ranging)
> Today's self-driving cars use both digital cameras and **LiDAR**. Decades ago, when AI was still underdeveloped, LiDAR was already an essential vision sensor. Today's LiDAR sensors are still expensive and a step slower than digital cameras, but the point clouds they produce can plan the vehicle's route through most environments and guide it as it drives.
> For a long time, the "bottleneck" that kept digital cameras from becoming machine-vision sensors was 3D perception. Also, decompressing and processing huge numbers of pixels needs a lot of computing power, and in real-time operation the computing power often cannot keep up — a serious weakness of digital cameras in self-driving applications
 
> Musk — I think people do not need LiDAR; passive optical plus a forward radar can do all of this. In fact, the problem can be solved completely even without LiDAR. I am not optimistic about LiDAR; it does not work in this situation.
 
4. Radio detection and ranging (radar)
 
> Besides LiDAR and digital cameras, self-driving cars also use ordinary radar to sense their surroundings. A digital camera captures a scene in a grid of pixels, and a LiDAR sensor is like a can of "digital spray paint" that dresses otherwise invisible objects in a "digital coat". A radar sensor, however, works like tossing a pebble into a pond and following the direction in which the ripples spread across the water.
> For autonomous driving, the biggest benefit of radar sensors is that, unlike digital cameras, they can see through thick fog, heavy rain, dust, blowing sand and even strong overhead light. Radar sensors have one more advantage: they can detect not only an object's position but also, through the Doppler effect, its speed.
> On the other hand, the biggest drawback of radar sensors is their relatively low resolution.
 
 
 
5. Ultrasonic sensors (sonar)
 
> If LiDAR and digital cameras are a person's eyes, ultrasonic sensors are the ears. Ultrasonic sensors are close relatives of radar — like radar, they send out a wave signal and detect the echo — but ultrasonic sensors emit ultrasonic waves, not the electromagnetic waves that radar uses.
 
6. Drive-by-wire
 
In the past, engineers turned ordinary cars into self-driving cars by fitting special mechanical "drive-by-wire" devices, to replace the hands and feet of the human driver. These new devices are called actuators, and they can turn the steering wheel and press the brake. Building accurate, reliable mechanical actuators is a hard engineering problem, no less complex than creating the AI that guides the car.
 
7. Other equipment
 
![](https://lilulula.github.io//post-images/1589008203897.png)

 
## What emerging technologies have in common 
Here is how the zero principle works. Emerging technologies that shake up traditional industries all have one thing in common: after the product comes out, the cost of one or more parts of production drops to almost zero. In fact, a few years after technologies that follow the zero principle appear, they have a huge impact on their industries and finally spark an industrial revolution.
 
1. Near-zero harm.
 
 
2. Near-zero skill.
 
 
3. Near-zero time.
 
 
4. Near-zero size.
 
![](https://lilulula.github.io//post-images/1589008096689.png)

## Abbreviations  
- Adaptive cruise control (ACC)
- Lane keeping assist system (LKAS)
- Vehicle-to-vehicle communication system (V2V)
- Vehicle-to-infrastructure (V2I)
- Vehicle-to-everything information exchange (V2X)
