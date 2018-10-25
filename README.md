# MMM-NewsFeedTicker
news ticker like what you see on the news channels, except for online newspapers, showing current headlines and short descritpions. 

The MMM-NewsFeedTickermodule is a <a href=https://github.com/MichMich/MagicMirror/wiki/3rd-Party-Modules>3rd Party Module</a> of the <a href=https://github.com/MichMich/MagicMirror/tree/developMagicMirror>MagicMirror</a> 

## Screenshots

        
![ScreenShot for BBC World News](https://github.com/justjim1220/MMM-NewsFeedTicker/blob/master/Screenshot%20(401).png)
![ScreenShot for USA Today](https://github.com/justjim1220/MMM-NewsFeedTicker/blob/master/Screenshot%20(407).png)
![ScreenShot for New York Times](https://github.com/justjim1220/MMM-NewsFeedTicker/blob/master/Screenshot%20(406).png)


## Using the module...

To use this module, add it to the modules array in the 'config/config.js' file:
```
modules: [
	{
	disabled: false,
	module: "MMM-NewsFeedTicker",
	position: "bottom_bar",
	//classes: "day_scheduler",
	config: {
	    feeds: [
		{
			title: "New York Times",
			url: "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml",
			encoding: "UTF-8", //ISO-8859-1
			className: "myClass",
			defaultLogo : ""
		},
		{
			title: "USA Today",
			url: "http://rssfeeds.usatoday.com/UsatodaycomNation-TopStories",
			encoding: "UTF-8", //ISO-8859-1
			className: "myClass",
			defaultLogo : ""
		},
		{
			title: "BBC World News",
			url: "http://feeds.bbci.co.uk/news/world/rss.xml#",
			encoding: "UTF-8", //ISO-8859-1
			className: "myClass",
			defaultLogo : ""
		}
    	    ]
	}
    },
]
```

## Install...
```
cd ~/MagicMirror/modules
git clone https://github.com/justjim1220/MMM-NewsFeedTicker.git
```

## Other Info...
```
can add as many feeds as you like.
to change or add feedsources... you need to make sure the site can be linked 
 
Hope you all like it!
```



## Acknowledgements...
First, I want to thank @sdetweil, @Sean, @cowboysdude, & @Mykle1 for their patience in attempting to teach me this coding stuff!!!

And, @Sean & @sdetweil for giving the pointers I needed to finish it when I was stuck!

Enjoy!
