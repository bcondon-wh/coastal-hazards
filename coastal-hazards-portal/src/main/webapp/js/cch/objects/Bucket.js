/*jslint browser: true*/
/*global $*/
/*global CCH*/
CCH.Objects.Bucket = function (args) {
	"use strict";
	CCH.LOG.trace('CCH.Objects.Bucket::constructor: Bucket class is initializing.');

	var me = (this === window) ? {} : this;

	me.slide = args.slide;
	me.$BUCKET_CONTAINER_CONTROL_CONTAINER_ID = $('#app-navbar-bucket-control-container');
	me.BUCKET_COUNT_CONTAINER_ID = 'app-navbar-bucket-button-count';
	me.BUCKET_CONTAINER_ID = 'app-navbar-bucket-button-container';
	me.IMAGE_LOCATION_BUCKET_WITH_SAND = 'images/banner/bucket/bucket.svg';
	me.IMAGE_LOCATION_BUCKET_WITHOUT_SAND = 'images/banner/bucket/bucket-no-sand.svg';
	me.BUCKET_POPULATED_CLASS = 'app-navbar-bucket-button-container-populated';
	me.BUCKET_UNPOPULATED_CLASS = 'app-navbar-bucket-button-container-unpopulated';
	me.INITIAL_BUCKET_COUNT_MARGIN_LEFT = $('#' + me.BUCKET_COUNT_CONTAINER_ID).css('margin-left');
	me.MARGIN_WIDTH = 0;
	me.bucket = [];

	me.bucketAddClickHandler = function (evt, args) {
		args = args || {};
		var item = args.item,
			visibility = args.visibility || false;

		if (item) {
			me.add({
				item: item,
				visibility: visibility
			});
		}
	};
	me.bucketRemoveClickHandler = function (evt, args) {
		args = args || {};
		var id = args.id,
			item = id ? CCH.items.getById({id: id}) : args.item;

		if (item) {
			item.hideLayer();
			me.remove({
				item: item
			});
		}
	};

	me.countChanged = function () {
		var count = me.getCount(),
			bucketContainer = $('#' + me.BUCKET_CONTAINER_ID);

		if (count > 0) {
			if (!bucketContainer.hasClass(me.BUCKET_POPULATED_CLASS)) {
				bucketContainer.removeClass(me.BUCKET_UNPOPULATED_CLASS);
				bucketContainer.addClass(me.BUCKET_POPULATED_CLASS);
			}
		} else {
			bucketContainer.removeClass(me.BUCKET_POPULATED_CLASS);
			bucketContainer.addClass(me.BUCKET_UNPOPULATED_CLASS);
		}

		if (count >= 0 && count < 10) {
			$('#' + me.BUCKET_COUNT_CONTAINER_ID).css({
				'marginLeft': '17px'
			});
		}

		if (count >= 10 && count < 100) {
			$('#' + me.BUCKET_COUNT_CONTAINER_ID).css({
				'marginLeft': '12px'
			});
		}

		if (count >= 100) {
			$('#' + me.BUCKET_COUNT_CONTAINER_ID).css({
				'marginLeft': '7px'
			});
		}
		CCH.LOG.debug('CCH.Objects.Bucket::countChanged: Bucket count changed. Current count: ' + count);
		// TODO: Not sure what we're doing after 999
		// TODO: Make 0-99 text larger
		return count;
	};

	$('#' + me.BUCKET_CONTAINER_ID).on('click', function () {
		$(window).trigger('app-navbar-button-clicked');
	});

	$(window).on({
		'cch.card.bucket.add': me.bucketAddClickHandler,
		'cch.slide.search.button.bucket.add': me.bucketAddClickHandler,
		'cch.card.bucket.remove': me.bucketRemoveClickHandler,
		'cch.slide.bucket.remove': me.bucketRemoveClickHandler,
		'bucket-remove': me.bucketRemoveClickHandler
	});

	// Preload required images
	CCH.LOG.trace('CCH.Objects.Bucket::constructor: Pre-loading images.');
	$.get(me.IMAGE_LOCATION_BUCKET_WITH_SAND);
	$.get(me.IMAGE_LOCATION_BUCKET_WITHOUT_SAND);

	CCH.LOG.trace('CCH.Objects.Bucket::constructor: Bucket class initialized.');

	return $.extend(me, {
		add: function (args) {
			args = args || {};

			// Make sure I get what I need to remove
			if (!args.item) {
				throw "item not passed to CCH.Objects.Bucket";
			}

			var item = args.item,
				id = item.id,
				visibility = args.visibility;

			if (!me.getItemById(id)) {
				// Add the item to my personal bucket array
				me.bucket.push(item);

				// Add the item to the bucket slide
				me.slide.add({
					item: item,
					visibility: visibility
				});

				// Add the item to the session
				CCH.session.addItem({
					item: item,
					visible: visibility
				});

				// Increase the bucket count visually
				me.increaseCount();

				// Trigger the addition in the window
				$(window).trigger('bucket-added', {
					id: id
				});
			}

			return me.bucket;
		},
		remove: function (args) {
			args = args || {};

			if (!args.item && !args.id) {
				throw "item not passed to CCH.Objects.Bucket";
			}

			var id = args.id,
				item = args.item;

			if (id) {
				item = me.getItemById(id);
			}

			if (item) {
				id = item.id;

				// Take the item out of my personal bucket array
				me.bucket.remove(function (item) {
					return item.id === id;
				});

				// Remove the item from the slide
				me.slide.remove(item);

				// Remove the item from the session
				CCH.session.removeItem(item);

				// Visually decrease the count
				me.decreaseCount();

				// Trigger the removal
				$(window).trigger('cch.bucket.card.removed', {
					id: id
				});
			}
		},
		removeAll: function () {
			me.bucket.each(function (item) {
				me.remove({
					item: item
				});
			});
		},
		bucket: me.bucket,
		getItems: function () {
			return me.bucket;
		},
		getItemById: function (id) {
			var item = null;
			if (id) {
				item = me.bucket.find(function (item) {
					return item.id === id;
				});
			}
			return item;
		},
		getCount: function () {
			var bucketContainer = $('#' + me.BUCKET_COUNT_CONTAINER_ID),
				countString = bucketContainer.html(),
				count = parseInt(countString, 10);

			if (isNaN(count)) {
				count = 0;
			}

			return count;
		},
		setCount: function (args) {
			args = args || {};
			var count = parseInt(args.count, 10),
				$countContainer = $('#' + me.BUCKET_COUNT_CONTAINER_ID);
			
			if (!isNaN(count) && count % 1 === 0) {
				if (count !== undefined && !isNaN(count)) {
					$countContainer.html(count);
				}
			} else {
				throw 'setCount called with a double. Only integers allowed';
			}

			me.countChanged();

			return count;
		},
		increaseCount: function () {
			var count = me.getCount();

			count = count + 1;
			me.setCount({
				count: count
			});
		},
		decreaseCount: function () {
			var count = me.getCount();

			if (count > 0) {
				count = count - 1;
			}

			me.setCount({
				count: count
			});
		},
		CLASS_NAME: 'CCH.Objects.Bucket'
	});

};