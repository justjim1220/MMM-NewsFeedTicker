/* Magic Mirror
 * Node Helper: Newsfeed
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const validUrl = require("valid-url");
const Fetcher = require("./fetcher.js");

module.exports = NodeHelper.create({
	// Subclass start method.
	start () {
		console.log(`Starting module: ${this.name}`);
		this.fetchers = [];
	},

	// Subclass socketNotificationReceived received.
	socketNotificationReceived (notification, payload) {
		if (notification === "ADD_FEED") {
			this.createFetcher(payload.feed, payload.config);
		}
	},

	/* createFetcher(feed, config)
	 * Creates a fetcher for a new feed if it doesn't exist yet.
	 * Otherwise it reuses the existing one.
	 *
	 * attribute feed object - A feed object.
	 * attribute config object - A configuration object containing reload interval in milliseconds.
	 */
	createFetcher (feed, config) {
		const self = this;
		// var defaultLogo = feed.image || "";
		const url = feed.url || "";
		const encoding = feed.encoding || "UTF-8";
		const reloadInterval = feed.reloadInterval || config.reloadInterval || 5 * 60 * 1000;

		if (!validUrl.isUri(url)) {
			self.sendSocketNotification("INCORRECT_URL", url);
			return;
		}

		let fetcher;
		if (typeof self.fetchers[url] === "undefined") {
			console.log(`Create new news fetcher for url: ${url} - Interval: ${reloadInterval} logo = ${feed.customLogo}`);
			fetcher = new Fetcher(url, reloadInterval, encoding, config.logFeedWarnings, feed.customLogo);

			fetcher.onReceive(((fetcher) => {
				const items = fetcher.items();
				for (const i in items) {
					const item = items[i];
					    // item.image=this.feed_def.image;
				}
				self.broadcastFeeds();
			}).bind({feed_var_in_function: feed}));

			fetcher.onError((fetcher, error) => {
				self.sendSocketNotification("FETCH_ERROR", {
					url: fetcher.url(),
					error
				});
			});

			self.fetchers[url] = fetcher;
		} else {
			console.log(`Use existing news fetcher for url: ${url}`);
			fetcher = self.fetchers[url];
			fetcher.setReloadInterval(reloadInterval);
			fetcher.broadcastItems();
		}

		fetcher.startFetch();
	},

	/* broadcastFeeds()
	 * Creates an object with all feed items of the different registered feeds,
	 * and broadcasts these using sendSocketNotification.
	 */
	broadcastFeeds () {
		const feeds = {};
		for (const f in this.fetchers) {
			feeds[f] = this.fetchers[f].items();
		}
		this.sendSocketNotification("NEWS_ITEMS", feeds);
	}
});
