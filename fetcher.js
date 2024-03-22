/* MagicMirror²
 * Fetcher
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */

const FeedMe = require("feedme");

/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute url string - URL of the news feed.
 * attribute reloadInterval number - Reload interval in milliseconds.
 * attribute logFeedWarnings boolean - Log warnings when there is an error parsing a news article.
 */

const Fetcher = function (url, reloadInterval, encoding, logFeedWarnings, defaultLogo) {
	const self = this;
	if (reloadInterval < 1000) {
		reloadInterval = 1000;
	}

	let reloadTimer = null;
	let items = [];
	const logo = defaultLogo;

	let fetchFailedCallback = function () {};
	let itemsReceivedCallback = function () {};

	/* private methods */

	/* fetchNews()
	 * Request the new items.
	 */

	const fetchNews = async function () {
		clearTimeout(reloadTimer);
		reloadTimer = null;
		items = [];


		try {
			const nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);

			const response = await fetch(url, {
				headers: {
					"User-Agent": `Mozilla/5.0 (Node.js ${nodeVersion}) MagicMirror/${global.version} (https://github.com/MichMich/MagicMirror/)`,
					"Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
					Pragma: "no-cache"
				}
			});

			if (response.ok) {
				const data = await response.text();
				const parser = new FeedMe();

				parser.on("item", (item) => {
					const {title} = item;
					let description = item.description || item.summary || item.content || "";
					const pubdate = item.pubdate || item.published || item.updated || item["dc:date"];
					const url = item.url || item.link || "";
					const defaultLogo = item.logo || item.image || item.enclosure || "";

					if (title && pubdate) {
						const regex = /(<([^>]+)>)/ig;
						description = description.toString().replace(regex, "");

						items.push({
							title,
							description,
							pubdate,
							url,
							logo,
							enclosure: url
						});
					} else if (logFeedWarnings) {
						console.log("Can't parse feed item:");
						console.log(item);
						console.log(`Title: ${title}`);
						console.log(`Image: ${image}`);
						console.log(`Description: ${description}`);
						console.log(`Pubdate: ${pubdate}`);
					}
				});

				parser.on("image", (image) => {
					if (image.url) {
						defautLogo = image.url;
					} else if (logFeedWarnings) {
						console.log("image parsing error.");
					}
				});

				parser.on("end", () => {
					// console.log("end parsing - " + url);
					self.broadcastItems();
					scheduleTimer();
				});

				parser.on("error", (error) => {
					fetchFailedCallback(self, error);
					scheduleTimer();
				});

				parser.end(data);
			} else {
				console.error(`Failed to fetch news feed: ${response.statusText}`);
			}
		} catch (error) {
			console.error(`Error fetching news feed: ${error.message}`);
		}
	};


	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */

	var scheduleTimer = function () {
		// console.log('Schedule update timer.');
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(() => {
			fetchNews();
		}, reloadInterval);
	};

	/* public methods */

	/* setReloadInterval()
	 * Update the reload interval, but only if we need to increase the speed.
	 *
	 * attribute interval number - Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function (interval) {
		if (interval > 1000 && interval < reloadInterval) {
			reloadInterval = interval;
		}
	};

	/* startFetch()
	 * Initiate fetchNews();
	 */
	this.startFetch = function () {
		fetchNews();
	};

	/* broadcastItems()
	 * Broadcast the existing items.
	 */
	this.broadcastItems = function () {
		if (items.length <= 0) {
			// console.log('No items to broadcast yet.');
			return;
		}
		// console.log('Broadcasting ' + items.length + ' items.');
		itemsReceivedCallback(self);
	};

	this.onReceive = function (callback) {
		itemsReceivedCallback = callback;
	};

	this.onError = function (callback) {
		fetchFailedCallback = callback;
	};

	this.url = function () {
		return url;
	};

	/*
	this.image = function() {
		return image;
	};
	*/
	this.logo = function () {
		return logo;
	};

	this.items = function () {
		return items;
	};
};

module.exports = Fetcher;
