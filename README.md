# MMM-NewsFeedTicker
news ticker like what you see on the news channels, except for online newspapers, showing current headlines and short descritpions. 

The MMM-NewsFeedTickermodule is a 3rd party module of the <a href=https://github.com/MichMich/MagicMirror/tree/developMagicMirror>MagicMirror</a>

## Using the module...

To use this module, add it to the modules array in the 'config/config.js' file:
```
modules: [
	{
		disabled: false,
		module: "MMM-NewsFeedTicker",
		position: "bottom_bar",	 //works best in top_bar or bottom_bar
		//classes: "day_scheduler",  // this is for the MMM-ModuleScheduler module (https://github.com/ianperrin/MMM-ModuleScheduler.git)
		config: {
			height: "100px",
			width: "100%",
			feedsource: [
			{
                		image: "https://static01.nyt.com/images/misc/NYT_logo_rss_250x40.png",
               			title: "New York Times",
				url: "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml"
            		},
			{
                		image: "http://online.wsj.com/img/wsj_sm_logo.gif",
				title: "Wall St. Journal",
				url: "http://www.wsj.com/xml/rss/3_7085.xml"
			},
			{
                		image: "http://www.gannett-cdn.com/sites/usatnetwork/images/RSS_Syndication_Logo-USATN.png",
				title: "USA Today",
				url: "http://rssfeeds.usatoday.com/UsatodaycomNation-TopStories"
			},
			{
                		image: "https://news.bbcimg.co.uk/nol/shared/img/bbc_news_120x60.gif",
				title: "BBC World News",
				url: "http://feeds.bbci.co.uk/news/world/rss.xml#"
			}
		],
		}
	},
]
```

## Install...
```
cd ~/MagicMirror/modules
git clone https://github.com/justjim1220/MMM-NewsFeedTicker.git
cd MMM-NewsFeedTicker
npm install
```

## Other Info...
```
can add as many feeds as you like.
to change or add feedsources... 
 - need to make sure the site can be linked 
 - need to add the imageURL from the RSS or XML feed
 
 - Hope you all like it!
```



## Acknowledgements...
First, I want to thank @sdetweil, @Sean, @cowboysdude, & @Mykle1 for their patience in attempting to teach me this coding stuff!!!

And, @Sean & @sdetweil for giving the pointers I needed to finish it when I was stuck!

Enjoy!
