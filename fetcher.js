/* Magic Mirror
 * Fetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var FeedMe = require("feedme");
var request = require("request");
var iconv = require("iconv-lite");

/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute url string - URL of the news feed.
 * attribute reloadInterval number - Reload interval in milliseconds.
 * attribute logFeedWarnings boolean - Log warnings when there is an error parsing a news article.
 */

var Fetcher = function(url, reloadInterval, encoding, logFeedWarnings, defaultLogo) {
	var self = this;
	if (reloadInterval < 1000) {
		reloadInterval = 1000;
	}

	var reloadTimer = null;
	var items = [];
	var defaultlogo = defaultLogo;
  var feedlogo= '';

	var fetchFailedCallback = function() {};
	var itemsReceivedCallback = function() {};

  var getFeedItemLogo= function(item){
    var logourl='';
   // loop thru the elements of this item object
   outer:   for(var el of Object.keys(item)){
       // if the element is itself an object (not just string)
        //console.log("element "+el+" typeof ="+typeof item[el])        
        if(typeof item[el] == 'object') {
          // loop thru ITS attributes
          for(var attrib of Object.keys(item[el])){  
            //console.log("attribute="+attrib + " type ="+typeof attrib)
            try {
              // get lowercase string for easy comparisons             
              var f = item[el][attrib].toLowerCase();
              // if this string contains one of the three icon types in rss
              if(f.endsWith('.png') || f.endsWith('.gif') || f.endsWith('.jpg')){
                // then save its link
                //console.log("have rss entry object type icon="+f)
                logourl = item[el][attrib];
                // don't need to look anymore
                break outer;
              }
            }
            catch(exception){}            
          }
        }
        else{
          var f = item[el].toLowerCase()
          if(f.endsWith(".png") || f.endsWith('.gif') || f.endsWith('.jpg')){
            // then save its link
            console.log("have rss entry string type icon="+f)
            logourl = item[el][attrib];
            // don't need to look anymore
            break outer;
          }
        } 
   }
   return logourl;
  }
	/* private methods */

	/* fetchNews()
	 * Request the new items.
	 */

	var fetchNews = function() {
		clearTimeout(reloadTimer);
		reloadTimer = null;
		items = [];

		var parser = new FeedMe();

		parser.on("item", (item)=> {
			var title = item.title;
			var description = item.description || item.summary || item.content || "";
			var pubdate = item.pubdate || item.published || item.updated || item["dc:date"];
			var url = item.url || item.link || "";
      console.log(" item.logo ="+ item.logo)
      console.log(" feed.logo ="+ feedlogo)
      console.log(" found .logo ="+ getFeedItemLogo(item))
      console.log(" default logo ="+ defaultlogo)
      logo= item.logo || getFeedItemLogo(item) || /*feedlogo || */ defaultLogo;

			if (title && pubdate) {
				var regex = /(<([^>]+)>)/ig;
				description = description.toString().replace(regex, "");

				items.push({
					title: title,
					description: description,
					pubdate: pubdate,
					url: url,
					logo: logo
				});

			} else if (logFeedWarnings) {
				console.log("Can't parse feed item:");
				console.log(item);
				console.log("Title: " + title);
				console.log("Image: " + image);
				console.log("Description: " + description);
				console.log("Pubdate: " + pubdate);
			}
		});

		parser.on("image", (image) =>{
			if (image.url) {
				feedlogo = image.url
			} else if (logFeedWarnings) {
				console.log("image parsing error.")
			}
		});

		parser.on("end",	function() {
			//console.log("end parsing - " + url);
			self.broadcastItems();
			scheduleTimer();
		});

		parser.on("error", function(error) {
			fetchFailedCallback(self, error);
			scheduleTimer();
		});


		nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
		headers =	{"User-Agent": "Mozilla/5.0 (Node.js "+ nodeVersion + ") MagicMirror/"	+ global.version +	" (https://github.com/MichMich/MagicMirror/)",
			"Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
			"Pragma": "no-cache"}

		request({uri: url, encoding: null, headers: headers})
			.on("error", function(error) {
				fetchFailedCallback(self, error);
				scheduleTimer();
			})
			.pipe(iconv.decodeStream(encoding)).pipe(parser);

	};

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */

	var scheduleTimer = function() {
		//console.log('Schedule update timer.');
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function() {
			fetchNews();
		}, reloadInterval);
	};

	/* public methods */

	/* setReloadInterval()
	 * Update the reload interval, but only if we need to increase the speed.
	 *
	 * attribute interval number - Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function(interval) {
		if (interval > 1000 && interval < reloadInterval) {
			reloadInterval = interval;
		}
	};

	/* startFetch()
	 * Initiate fetchNews();
	 */
	this.startFetch = function() {
		fetchNews();
	};

	/* broadcastItems()
	 * Broadcast the existing items.
	 */
	this.broadcastItems = function() {
		if (items.length <= 0) {
			//console.log('No items to broadcast yet.');
			return;
		}
		//console.log('Broadcasting ' + items.length + ' items.');
		itemsReceivedCallback(self);
	};

	this.onReceive = function(callback) {
		itemsReceivedCallback = callback;
	};

	this.onError = function(callback) {
		fetchFailedCallback = callback;
	};

	this.url = function() {
		return url;
	};

	/*
	this.image = function() {
		return image;
	};
	*/
	this.logo = function() {
		return logo
	}

	this.items = function() {
		return items;
	};
};

module.exports = Fetcher;
