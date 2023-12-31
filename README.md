# MMM-NewsFeedTicker

news ticker like what you see on the news channels, except for online newspapers, showing current headlines and short descritpions.

The MMM-NewsFeedTickermodule is a [3rd Party Module](https://github.com/MichMich/MagicMirror/wiki/3rd-Party-Modules) of the [MagicMirror²](https://magicmirror.builders/).

## Screenshots

![Screenshot for BBC World News](Screenshot%20(401).png)
![Screenshot for USA Today](Screenshot%20(407).png)
![Screenshot for New York Times](Screenshot%20(406).png)

## Using the module

To use this module, add it to the modules array in the 'config/config.js' file:

```js
modules: [
  {
    module: "MMM-NewsFeedTicker",
    position: "bottom_bar",
    //classes: "day_scheduler",
    config: {
      feeds: [
        {
          title: "New York Times",
          url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
          customLogo: "NYT_logo_rss_250x40.png"
        },
        {
          title: "CBC World",
          url: "https://www.cbc.ca/webfeed/rss/rss-world",
          customLogo: "CBC_140x140.png"
        },
        {
          title: "BBC World News",
          url: "https://feeds.bbci.co.uk/news/world/rss.xml",
          customLogo: "bbc_news_120x60.gif"
        }
      ]
    }
  },
]
```

## Install

```bash
cd ~/MagicMirror/modules
git clone https://github.com/justjim1220/MMM-NewsFeedTicker
cd MMM-NewsFeedTicker
npm install
```

## Other Info

You can add as many feeds as you like. To change or add feedsources you need to make sure the site can be linked.

At this point, you need to download the website logo and place it in the pics folder within the MMM-NewsFeedTicker directory. Then put the name of it in the config for 'customLogo' (see config example above).

Hope you all like it!

## Configurations

To change background color, add the following to you custom.css file:

```css
.MMM-NewsFeedTicker {
    background: rgb(104, 9, 9); /* to change background color, can use rgb. hex, or name of the color */
}
```

To remove background color, change to `background: none;`

Some users are having issues with speed of the animation.
Go to the following line in the MMM-NewsFeedTicker.js file and change the number `1000` to a lower number.
(some users are finding that changing to 300 works best for them, adjust to your preference)

```js
tickerBody.style.animationDuration = Math.round(this.config.updateInterval / 1000) + "s";
```

## Acknowledgements

First, I want to thank @sdetweil, @Sean, @cowboysdude, & @Mykle1 for their patience in attempting to teach me this coding stuff!!!

And, @Sean & @sdetweil for giving the pointers I needed to finish it when I was stuck!

Enjoy!
