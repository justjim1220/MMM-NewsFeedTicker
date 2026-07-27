/* Module: MMM-NewsFeedTicker
 *
 * ((modification of the default newsfeed module
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.))
 *
 * Modified by Jim Hallock (justjim1220@gmail.com)
 *
 * thanks to @sdetweil, @Sean, @cowboysdude, & @Mykle1 for all their help
 * and for their patience in teaching me how to do this.
 *
 * Brought to you by the makers of Cheyenne Cigars
 * and my very own homemade Southern Sweet Tea.
 *
 */

const RELATIVE_TIME_UNITS = [
	["year", 31536000],
	["month", 2592000],
	["day", 86400],
	["hour", 3600],
	["minute", 60],
	["second", 1]
];
const FALLBACK_RELATIVE_TIME_UNIT = RELATIVE_TIME_UNITS[RELATIVE_TIME_UNITS.length - 1];

/**
 * Formats a date-like value as localized relative time (for example: "2 hours ago").
 *
 * @param {string|number|Date} dateValue Date input to format.
 * @param {string} [locale] Preferred locale code (falls back to "en").
 * @returns {string} Relative time string or an empty string for invalid dates.
 */
function formatRelativeTime (dateValue, locale) {
	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
	const [unit, unitSeconds] = RELATIVE_TIME_UNITS.find(([, seconds]) => Math.abs(diffInSeconds) >= seconds) || FALLBACK_RELATIVE_TIME_UNIT;
	const value = Math.round(diffInSeconds / unitSeconds);
	const preferredLocale = locale || "en";

	try {
		return new Intl.RelativeTimeFormat(preferredLocale, {numeric: "auto"}).format(value, unit);
	} catch {
		return new Intl.RelativeTimeFormat("en", {numeric: "auto"}).format(value, unit);
	}
}

/**
 * Removes configured prefixes from a text value.
 *
 * @param {string} text The source text.
 * @param {string[]} tags Prefix tags to remove.
 * @returns {string} The normalized text.
 */
function stripConfiguredStartTags (text, tags) {
	let result = text;
	for (const tag of tags) {
		if (result.slice(0, tag.length) === tag) {
			result = result.slice(tag.length);
		}
	}
	return result;
}

/**
 * Removes configured suffixes from a text value.
 *
 * @param {string} text The source text.
 * @param {string[]} tags Suffix tags to remove.
 * @returns {string} The normalized text.
 */
function stripConfiguredEndTags (text, tags) {
	let result = text;
	for (const tag of tags) {
		if (result.slice(-tag.length) === tag) {
			result = result.slice(0, -tag.length);
		}
	}
	return result;
}

Module.register("MMM-NewsFeedTicker", {

	// Default module config.
	defaults: {
		feeds: [
			{
				title: "BBC World News",
				url: "https://feeds.bbci.co.uk/news/world/rss.xml",
				customLogo: "bbc_news_120x60.gif"
			}
		],

		showMarquee: true,
		showIcon: true,
		showSourceTitle: false,
		showPublishDate: false,
		showDescription: false,
		wrapTitle: false,
		wrapDescription: false,
		truncDescription: false,
		lengthDescription: 4000,
		hideLoading: false,
		reloadInterval: 60 * 60 * 1000, // every 60 minutes
		updateInterval: 60 * 1000, // every 60 seconds
		animationSpeed: 2 * 1000,
		maxNewsItems: 5, // 0 for unlimited
		ignoreOldItems: true,
		ignoreOlderThan: 2 * 24 * 60 * 60 * 1000, // 2 days
		removeStartTags: "both",
		removeEndTags: "both",
		startTags: [],
		endTags: [],
		prohibitedWords: [],
		scrollLength: "100%",
		logFeedWarnings: false,
		encoding: "UTF-8" // ISO-8859-1
	},

	getStyles () {
		return ["MMM-NewsFeedTicker.css"];
	},

	getLocale () {
		return this.config.language || (typeof config !== "undefined" ? config.language : "en");
	},

	getRelativeTime (dateValue) {
		return formatRelativeTime(dateValue, this.getLocale());
	},

	/**
	 * Applies configured start/end tag trimming to title and description.
	 *
	 * @param {{title?: string, description?: string}} item Feed item to normalize.
	 * @returns {{title: string, description: string}} The normalized feed item.
	 */
	normalizeItemTags (item) {
		const normalizedItem = item;

		if (typeof normalizedItem.title !== "string") {
			normalizedItem.title = "";
		}
		if (typeof normalizedItem.description !== "string") {
			normalizedItem.description = "";
		}

		if (this.config.removeStartTags === "title" || this.config.removeStartTags === "both") {
			normalizedItem.title = stripConfiguredStartTags(normalizedItem.title, this.config.startTags);
		}

		if (this.config.removeStartTags === "description" || this.config.removeStartTags === "both") {
			normalizedItem.description = stripConfiguredStartTags(normalizedItem.description, this.config.startTags);
		}

		if (this.config.removeEndTags === "title" || this.config.removeEndTags === "both") {
			normalizedItem.title = stripConfiguredEndTags(normalizedItem.title, this.config.endTags);
		}

		if (this.config.removeEndTags === "description" || this.config.removeEndTags === "both") {
			normalizedItem.description = stripConfiguredEndTags(normalizedItem.description, this.config.endTags);
		}

		return normalizedItem;
	},

	// Define required translations.
	getTranslations () {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build your own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start () {
		Log.info(`Starting module: ${this.name}`);

		this.newsItems = [];
		this.loaded = false;
		this.activeItem = 0;
		this.scrollPosition = 0;
		this.updateTimer = null;

		this.registerFeeds();

		"use strict";

		this.isShowingDescription = this.config.showDescription;
	},

	// Override socket notification handler.
	socketNotificationReceived (notification, payload) {
		if (notification === "NEWS_ITEMS") {
			this.generateFeed(payload);

			if (!this.loaded) {
				this.scheduleUpdateInterval();
			}

			this.loaded = true;
		}
	},

	// Override dom generator.
	getDom () {
		const wrapper = document.createElement("div");
		const activeItem = this.newsItems[this.activeItem];

		if (this.config.feedUrl) {
			wrapper.className = "bold normal";
			wrapper.innerHTML = "The configuration options for the newsfeed module have changed.<br>Please check the documentation.";
			return wrapper;
		}

		if (this.activeItem >= this.newsItems.length) {
			this.activeItem = 0;
		}

		if (this.newsItems.length > 0) {
			// this.config.showFullArticle is a run-time configuration, triggered by optional notifications
			if (!this.config.showFullArticle && (this.config.showSourceTitle || this.config.showPublishDate)) {
				const sourceAndTimestamp = document.createElement("div");
				// sourceAndTimestamp.className = "bold large dimmed";

				if (this.config.showSourceTitle && activeItem.sourceTitle !== "") {
					sourceAndTimestamp.innerHTML = activeItem.sourceTitle;
				}
				if (this.config.showSourceTitle && activeItem.sourceTitle !== "" && this.config.showPublishDate) {
					sourceAndTimestamp.innerHTML += " ";
				}
				if (this.config.showPublishDate) {
					sourceAndTimestamp.innerHTML += this.getRelativeTime(activeItem.pubdate);
				}
				if ((this.config.showSourceTitle && activeItem.sourceTitle !== "") || this.config.showPublishDate) {
					sourceAndTimestamp.innerHTML += ":";
				}

				wrapper.appendChild(sourceAndTimestamp);
			}

			if (this.config.showSourceTicle) {
				const title = document.createElement("div");
				title.className = `bright medium light${!this.config.wrapTitle
					? " no-wrap"
					: ""}`;
				title.innerHTML = this.newsItems[this.activeItem].title;
				wrapper.appendChild(title);
			}

			if (this.isShowingDescription) {
				const description = document.createElement("div");
				description.className = `light${!this.config.wrapDescription
					? " no-wrap"
					: ""}`;
				const txtDesc = activeItem.description;
				description.innerHTML = this.config.truncDescription
					? txtDesc.length > this.config.lengthDescription
						? `${txtDesc.substring(0, this.config.lengthDescription)}...`
						: txtDesc
					: txtDesc;
				wrapper.appendChild(description);
			}

			if (this.config.showMarquee) {
				// if icon requested
				if (this.config.showIcon) {
					const image = document.createElement("img");
					image.className = "image";
					// display it as requested
					image.src = activeItem.logo;
					wrapper.appendChild(image);
				}

				const tickerBody = document.createElement("div");
				tickerBody.className = "tickerbody";

				const headline = document.createElement("span");
				headline.className = "headline";
				tickerBody.style.animationDuration = `${Math.round(this.config.updateInterval / 1000)}s`;

				headline.innerHTML = `<font color= #ffaa00>${this.getRelativeTime(activeItem.pubdate)}: &nbsp;` + `</font>${activeItem.title}&nbsp; || &nbsp;${activeItem.description}`;


				tickerBody.appendChild(headline);

				wrapper.appendChild(tickerBody);
			}

			if (this.config.showFullArticle) {
				const fullArticle = document.createElement("iframe");
				fullArticle.className = "";
				fullArticle.style.width = "100%";
				// very large height value to allow scrolling
				fullArticle.height = "3000px";
				fullArticle.style.height = "3000px";
				fullArticle.style.top = "0";
				fullArticle.style.left = "0";
				fullArticle.style.border = "none";
				fullArticle.src = typeof this.newsItems[this.activeItem].url === "string"
					? activeItem.url
					: activeItem.url.href;
				fullArticle.style.zIndex = 1;
				wrapper.appendChild(fullArticle);
			}

			if (this.config.hideLoading) {
				this.show();
			}
		} else if (this.config.hideLoading) {
			this.hide();
		} else {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "medium normal bold";
		}

		return wrapper;
	},

	/* registerFeeds()
   * registers the feeds to be used by the backend.
   */
	registerFeeds () {
		for (const f in this.config.feeds) {
			const feed = this.config.feeds[f];
			if (feed.customLogo !== undefined) {
				feed.customLogo = `${this.data.path}pics/${feed.customLogo}`;
			}
			this.sendSocketNotification("ADD_FEED", {
				feed,
				config: this.config
			});
		}
	},

	/* generateFeed()
   * Generate an ordered list of items for this configured module.
   *
   * attribute feeds object - An object with feeds returned by the node helper.
   */
	generateFeed (feeds) {
		let newsItems = [];
		for (const feed in feeds) {
			const feedItems = feeds[feed];
			if (this.subscribedToFeed(feed)) {
				for (const i in feedItems) {
					const item = feedItems[i];
					item.sourceTitle = this.titleForFeed(feed);
					if (!(this.config.ignoreOldItems && Date.now() - new Date(item.pubdate) > this.config.ignoreOlderThan)) {
						newsItems.push(this.normalizeItemTags(item));
					}
				}
			}
		}
		newsItems.sort((a, b) => {
			const dateA = new Date(a.pubdate);
			const dateB = new Date(b.pubdate);
			return dateB - dateA;
		});

		if (this.config.maxNewsItems > 0) {
			newsItems = newsItems.slice(0, this.config.maxNewsItems);
		}

		if (this.config.prohibitedWords.length > 0) {
			newsItems = newsItems.filter(function (value) {
				for (let i = 0; i < this.config.prohibitedWords.length; i++) {
					if (value.title.toLowerCase().indexOf(this.config.prohibitedWords[i].toLowerCase()) > -1) {
						return false;
					}
				}
				return true;
			}, this);
		}

		this.newsItems = newsItems;
	},

	/* subscribedToFeed(feedUrl)
   * Check if this module is configured to show this feed.
   *
   * attribute feedUrl string - Url of the feed to check.
   *
   * returns bool
   */
	subscribedToFeed (feedUrl) {
		for (const f in this.config.feeds) {
			const feed = this.config.feeds[f];
			if (feed.url === feedUrl) {
				return true;
			}
		}
		return false;
	},

	/* titleForFeed(feedUrl)
   * Returns title for a specific feed Url.
   *
   * attribute feedUrl string - Url of the feed to check.
   *
   * returns string
   */
	titleForFeed (feedUrl) {
		for (const f in this.config.feeds) {
			const feed = this.config.feeds[f];
			if (feed.url === feedUrl) {
				return feed.title || "";
			}
		}
		return "";
	},

	imageForFeed (feedUrl) {
		for (const f in this.config.feeds) {
			const feed = this.config.feeds[f];
			if (feed.url === feedUrl) {
				return feed.image || feed.icon || feed.logo || feed.svg || this.feed_var_in_function.icon || "";
			}
		}
		return "";
	},

	/* scheduleUpdateInterval()
   * Schedule visual update.
   */
	scheduleUpdateInterval () {
		this.stopUpdateTimer();
		this.updateDom(this.config.animationSpeed);

		if (this.newsItems.length <= 1) {
			return;
		}

		this.updateTimer = setTimeout(() => {
			this.activeItem++;
			this.scheduleUpdateInterval();
		}, this.config.updateInterval);
	},
	stopUpdateTimer () {
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}
	},

	/* capitalizeFirstLetter(string)
   * Capitalizes the first character of a string.
   *
   * argument string string - Input string.
   *
   * return string - Capitalized output string.
   */
	capitalizeFirstLetter (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	resetDescrOrFullArticleAndTimer () {
		this.isShowingDescription = this.config.showDescription;
		this.config.showFullArticle = false;
		this.scrollPosition = 0;
		// reset bottom bar alignment
		document.getElementsByClassName("region top bar")[0].style.top = "0";
		document.getElementsByClassName("region top bar")[0].style.top = "inherit";
		if (!this.updateTimer) {
			this.scheduleUpdateInterval();
		}
	},

	notificationReceived (notification, payload, sender) {
		if (!notification || !notification.startsWith("ARTICLE_")) {
			return;
		}

		Log.info(`${this.name} - received notification: ${notification}`);
		if (notification == "ARTICLE_NEXT") {
			const before = this.activeItem;
			this.activeItem++;
			if (this.activeItem >= this.newsItems.length) {
				this.activeItem = 0;
			}
			this.resetDescrOrFullArticleAndTimer();
			Log.info(`${this.name} - going from article #${before} to #${this.activeItem} (of ${this.newsItems.length})`);
			this.updateDom(100);
		} else if (notification == "ARTICLE_PREVIOUS") {
			const before = this.activeItem;
			this.activeItem--;
			if (this.activeItem < 0) {
				this.activeItem = this.newsItems.length - 1;
			}
			this.resetDescrOrFullArticleAndTimer();
			Log.info(`${this.name} - going from article #${before} to #${this.activeItem} (of ${this.newsItems.length})`);
			this.updateDom(100);
		}
		// if "more details" is received the first time: show article summary, on second time show full article
		else if (notification == "ARTICLE_MORE_DETAILS") {
			// full article is already showing, so scrolling down
			if (this.config.showFullArticle == true) {
				this.scrollPosition += this.config.scrollLength;
				window.scrollTo(0, this.scrollPosition);
				Log.info(`${this.name} - scrolling left`);
				Log.info(`${this.name} - ARTICLE_MORE_DETAILS, scroll position: ${this.config.scrollLength}`);
			} else {
				this.showFullArticle();
			}
		} else if (notification == "ARTICLE_SCROLL_UP") {
			if (this.config.showFullArticle == true) {
				this.scrollPosition -= this.config.scrollLength;
				window.scrollTo(0, this.scrollPosition);
				Log.info(`${this.name} - scrolling up`);
				Log.info(`${this.name} - ARTICLE_SCROLL_UP, scroll position: ${this.config.scrollLength}`);
			}
		} else if (notification == "ARTICLE_LESS_DETAILS") {
			this.resetDescrOrFullArticleAndTimer();
			Log.info(`${this.name} - showing only article titles again`);
			this.updateDom(100);
		} else if (notification === "ARTICLE_TOGGLE_FULL") {
			if (this.config.showFullArticle) {
				this.activeItem++;
				this.resetDescrOrFullArticleAndTimer();
			} else {
				this.showFullArticle();
			}
		} else {
			Log.info(`${this.name} - unknown notification, ignoring: ${notification}`);
		}
	},

	showFullArticle () {
		this.isShowingDescription = !this.isShowingDescription;
		this.config.showFullArticle = !this.isShowingDescription;
		// make bottom bar align to top to allow scrolling
		if (this.config.showFullArticle === true) {
			document.getElementsByClassName("region top bar")[0].style.bottom = "inherit";
			document.getElementsByClassName("region top bar")[0].style.top = "-90px";
		}
		this.stopUpdateTimer();
		Log.info(`${this.name} - showing ${this.isShowingDescription}`
			? "article description"
			: "full article");
		this.updateDom(100);
	}

});
