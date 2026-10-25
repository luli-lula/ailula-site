---
title: 旧Kindle安装微信读书防踩坑全流程
date: 2024-10-16T11:30:03.000Z
lang: zh
kind: essay
maturity: mature
tags:
  - Share
legacyPaths:
  - /zh/posts/028-旧kindle安装微信读书防踩坑全流程/
---
# 

上个月重新开始使用微信读书，又开始了30天的赌博（连续30天+阅读30小时可以换取30天的会员卡活动），这就导致Kindle上看非常不方便，iPad又很难集中注意力，虽然Kindle上也支持网页，但是必须一直联网在线+翻页延迟效果很不好，所以开始找解决方案。

1. 直接换开放系统的墨水屏，比如文石之类的 —— 1000+有些小纠结，再加上海运过来时效太久
2. Kindle刷安卓安装微信读书 —— 非常折腾，有可能变砖

纠结了一段时间之后，一鼓作气尝试了#2，回头看当时可能也不知道有这么多步骤。其实一共分为三步，越狱（变为开放系统），刷机（安装安卓系统），安装匹配版本的软件。每一步网上都有挺多失败案例导致Kindle无法使用的劝退帖，但是实际走一遍之后发现其实并没有那么可怕，每一步基本上都有回滚的重新刷回原系统的方案，所以也不用太担心。

最后安装好的效果个人感觉还不错，离线下载图书之后翻页效果好很多。掉电有些快，没有详细测量，下载之后关闭Wi-Fi的话可以几天充一次，打开Wi-Fi的话可能一两天就得充了。

决策是不是要走这一遍之前，建议评估一下以下

1. 以下是全部完成之后的翻页效果，觉得效果能接受就可以开始[https://www.bilibili.com/video/BV1yu4y1q7ao/?spm_id_from=333.337.search-card.all.click&vd_source=2c6e07879db54a9bde4cb5508b5cb7f9](https://www.bilibili.com/video/BV1yu4y1q7ao/?spm_id_from=333.337.search-card.all.click&vd_source=2c6e07879db54a9bde4cb5508b5cb7f9)
2. 需要准备：适配的Kindle版本（我的是kpw3，太老的不建议搞会很卡） + kindle连接电脑数据线 + windows系统的PC（主要是步骤二刷机程序是exe文件）
3. 时间预估：全部顺利的话最多1小时完成，不顺利的话可能好几天。。。。

OK开始整体教程以及踩坑记录

# 1. Kindle越狱（3分钟）

> 全流程参考[书伴的攻略](https://bookfere.com/post/1075.html)即可，非常详细基本上不会有问题，全程顺利的话3分钟完成
> 

Kpw3是要求Kindle 固件版本**小于等于 5.16.2.1.1**，我的设备信息里看正好是这个版本就直接开始了，按照四越狱步骤开始就行，书伴写的非常详细其实也就三步，正式开始之前可以[B站找个视频几分钟](https://www.bilibili.com/video/BV1PN4y1279z/?spm_id_from=333.337.search-card.all.click&vd_source=2c6e07879db54a9bde4cb5508b5cb7f9)看一下整个流程然后开始，这样就不用一步一步对着文字看。

1. `;enter_demo` 并按回车加上秘密手势进入【演示模式】（这一步我是一次成功的，不行多尝试几次就行），这个名字真的好好笑
2. `;demo` 按回车进入“演示菜单”界面，安装对应语言的越狱文件（这一步有一个需要快速拷贝文件的时间窗口，其实也不用紧张，提前插好USB一次成功）
3. 拷贝热修复补丁文件到Kindle，整个流程就完成了

# 2. 刷安卓系统（5分钟）

> 全程参考的这个刷机程序的作者[教程](https://xdaforums.com/t/guide-installing-android-on-your-aging-kindle-e-reader.4450117/)
> 

我是这个步骤卡住了好久，第一步我是全部在Mac系统完成没有问题，这一步刷机文件是exe程序，必须要windows系统，然后就进入了多年之前折腾安卓手机的噩梦。

这个刷机程序的作者是一个中国人，在[论坛有发完整教程和文件](https://xdaforums.com/t/guide-installing-android-on-your-aging-kindle-e-reader.4450117/)，也有[B站完整流程](https://www.bilibili.com/video/BV1tG411x7BU/?spm_id_from=333.337.search-card.all.click)，据说淘宝有人用他的刷机包卖钱，导致他直接删除了B站的下载链接，不过原始论坛的内容都还在可以直接看那个。

先说一下正常流程

1. 安装**插件程序启动器MRPI+**KUAL（流程继续参考[书伴的教程1和2](https://bookfere.com/post/311.html)的部分）
2. 拷贝刷机程序中的插件用KUAL安装完成
3. 在windows上运行自动刷机程序.exe文件等待重启几次就完成了

这里我踩过的坑如下

1. **windows系统无法运行.exe文件**（再次吐槽微软自作聪明太恶心了）
    
    都不是直接报错，而是双击之后显示文件找不到，回到文件夹发现文件消失。找了一下解决方案是关闭windows defender，这一步又发现我用的这台windows不知道为什么无法关闭，中间又尝试了一些添加不过滤exe文件的规则，以毒攻毒想用360杀毒来关闭windows denfender的方法都失败了。最后只能重装系统，最开始有尝试win7（因为下一个问题是驱动识别Kindle），但是后来发现新系统网卡问题一直无法联网，最后还是换回了win11的系统，成功关闭windows defender之后终于可以打开刷机程序了。
    
2. **驱动识别Kindle问题**
    
    主要表现在运行刷机的exe文件之后，一直没有出现“识别出设备”，不停出现连接弹出设备提示音问题。B站评论有解释，但是都太复杂了，其实按照论坛英文版本的攻略走就行，下载并且安装驱动识别程序就行adb-setup-1.4.2，安装完成重试一次就OK了，后面就是等待重启完成
    

# 3. 安装微信读书

看网友们尝试大部分推荐1.5.2的版本，大概是好几年前的旧版本，豌豆荚啥的都下载不到了。最后搜索到[墨水屏版](https://pan.baidu.com/s/1N0gudJigb4Tz_yTTtU7GHQ?pwd=mf7h)的这个拷贝到Kindle中之后，在kindle文件管理程序中打开就自动安装了，和安卓手机装软件类似。然后就可以开心阅读啦。

最后的最后这个系统可以支持10张自定义的wallpaper，直接拷贝文件到wallpaper文件夹就行，非常方便，推荐这个kindle原始作家系列的壁纸 [https://www.douban.com/photos/album/124589122/](https://www.douban.com/photos/album/124589122/)，如果自己有兴趣的话也可以自制一些，Google slides中设置1448 * 1072 尺寸，把自己希望的文字换个字体之类的输出为jpg就行。
