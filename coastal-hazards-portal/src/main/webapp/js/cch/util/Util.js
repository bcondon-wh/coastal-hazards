/*jslint browser: true*/
/*global CCH*/
window.CCH = window.CCH ? window.CCH : {};
CCH.Util = CCH.Util ? CCH.Util : {};
CCH.Util.Util = {
	
	/**
	 * Creates a HEAD request to the item download cache. This will do one of three things:
	 * - Return 200 if the download already exists in the cache
	 * - Return 202 is the item exists but the cache does not yet exist. This 
	 *   effectively primes the cache and a saturated cache may be expected 'soon'
	 * - Return 404 if the item does not exist
	 * @param {type} err Error callback
	 * @param {type} callback Success callback
	 * @param {type} itemId The item id 
	 * @returns {undefined}
	 */
	interrogateDownloadCache: function (err, callback, itemId) {
		"use strict";
		
		if (!itemId) {
			throw new TypeError('Item ID is mandatory');
		}
		
		$.ajax({
			'url' : CCH.CONFIG.contextPath + CCH.CONFIG.data.sources.download.endpoint + itemId,
			'type' : 'HEAD',
			'success' : callback,
			'err' : err
		});
	},
	
	/**
	 * http://guid.us/GUID/JavaScript
	 * 
	 * @returns {Number}
	 */
	generateUUID: function () {
		"use strict";
		var rnd = function () {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return rnd() + "_" + rnd() + "_" + rnd();
	},
	
	/** 
	 * Creates a legend for display on back of card
	 */
	getSLD: function (args) {
		"use strict";
		args = args || {};
		args.callbacks = args.callbacks || {};
		args.callbacks.success = args.callbacks.success || [];
		args.callbacks.error = args.callbacks.error || [];
		return $.ajax({
			url: args.contextPath + '/data/sld/' + args.itemId,
			context: args.context || arguments.callee.caller,
			headers: {
				'Accept': "application/json; charset=utf-8",
				'Content-Type': "application/json; charset=utf-8"
			},
			dataType: 'json',
			success: function (data, status, jqXHR) {
				args.callbacks.success.each(function (cb) {
					cb.apply(args.context, [data, status, jqXHR]);
				});
			},
			error: function (jqXHR, textStatus, errorThrown) {
				args.callbacks.error.each(function (cb) {
					cb.apply(args.context, [jqXHR, textStatus, errorThrown]);
				});
			}
		});
	},
	getMinifiedEndpoint: function (args) {
		"use strict";
		var location = args.location || window.location.href;
		var callbacks = args.callbacks || {
			success: [],
			error: []
		};

		return $.ajax(CCH.CONFIG.contextPath + '/data/minifier/minify/' + location, {
			type: 'GET',
			dataType: 'json',
			success: function (json, textStatus, jqXHR) {
				if (callbacks.success && callbacks.success.length > 0) {
					callbacks.success.each(function (callback) {
						callback.call(null, json, textStatus, jqXHR);
					});
				}
			},
			error: function (data, textStatus, jqXHR) {
				if (callbacks.error && callbacks.error.length > 0) {
					callbacks.error.each(function (callback) {
						callback.call(null, data, textStatus, jqXHR);
					});
				}
			}
		});
	},
	getGeolocation: function (args) {
		"use strict";
		args = args || {};
		var callbacks = args.callbacks || {
			success: function (pos) {
				CCH.LOG.debug("Latitude: " + pos.coords.latitude + ", Longitude: " + pos.coords.longitude);
			},
			error: function (err) {
				switch (err.code) {
				case err.PERMISSION_DENIED:
					CCH.LOG.warn("User denied the request for Geolocation.");
					break;
				case err.POSITION_UNAVAILABLE:
					CCH.LOG.warn("Location information is unavailable.");
					break;
				case err.TIMEOUT:
					CCH.LOG.warn("The request to get user location timed out.");
					break;
				case err.UNKNOWN_ERROR:
					CCH.LOG.warn("An unknown error occurred.");
					break;
				}
			}
		};

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(callbacks.success, callbacks.error);
		}
	}
};

// http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
String.prototype.hashCode = function () {
	"use strict";
	var hash = 0, i, chr, len;
	if (this.length === 0) {
		return hash;
	}
	for (i = 0, len = this.length; i < len; i++) {
		chr = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};