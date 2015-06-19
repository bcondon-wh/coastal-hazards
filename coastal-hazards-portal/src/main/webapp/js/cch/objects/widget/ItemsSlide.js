/*jslint browser: true*/
/*jslint plusplus: true */
/*global $*/
/*global CCH*/

window.CCH = CCH || {};
CCH.Objects = CCH.Objects || {};
CCH.Objects.Widget = CCH.Objects.Widget || {};

/**
 * Slider widget holding cards
 * 
 * @param {type} args
 * @returns {CCH.Objects.ItemsSlide.Anonym$5}
 */
CCH.Objects.Widget.ItemsSlide = function (args) {
	"use strict";
	args = args || {};

	if (!args.containerId) {
		throw 'containerId is required when initializing a items slide';
	}

	CCH.LOG.trace('ItemsSlide.js::constructor: ItemsSlide class is initializing.');

	var me = (this === window) ? {} : this;

	me.SLIDE_ITEMS_CONTAINER_ID = args.containerId;
	me.MAP_DIV_ID = args.mapdivId || 'map';
	me.APPLICATION_CONTAINER_ID = 'application-container';
	me.$APPLICATION_CONTAINER = $('#' + me.APPLICATION_CONTAINER_ID);
	me.$HEADER_ROW = me.$APPLICATION_CONTAINER.find('> div:nth-child(1)');
	me.$CONTENT_ROW = me.$APPLICATION_CONTAINER.find('> div:nth-child(2)');
	me.SLIDE_TAB_ID = $('#' + me.SLIDE_ITEMS_CONTAINER_ID + ' .application-slide-tab').attr('id');
	me.$SLIDE_CONTENT_ID = $('#' + me.SLIDE_ITEMS_CONTAINER_ID + ' .application-slide-content').attr('id');
	me.CARD_TEMPLATE_ID = 'application-slide-items-container-card-template';
	me.SLIDE_CONTENT_CONTAINER = 'application-slide-items-content-container';
	me.HEADER_ROW_ID = args.headerRowId || 'header-row';
	me.FOOTER_ROW_ID = args.footerRowId || 'footer-row';
	me.SMALL_BELLOW_CONTAINER_ID = 'application-slide-items-content-container-inner-scrollable';
	me.bucket = args.bucket;
	me.isSmall = args.isSmall;
	me.borderWidth = 2;
	me.desktopSpanSize = 3;
	me.animationTime = 500;
	me.placement = 'right';
	me.displayTab = me.isSmall();
	me.startClosed = me.isSmall() ? false : true;
	me.isInitialized = false;
	me.isClosed = me.startClosed;

	me.open = function () {
		var slideContainer = $('#' + me.SLIDE_ITEMS_CONTAINER_ID),
			slideContent = $('#' + me.$SLIDE_CONTENT_ID),
			$slideTab = $('#' + me.SLIDE_TAB_ID),
			extents = me.getExtents(),
			windowWidth = $(window).outerWidth(),
			toExtent = extents.small;

		if (me.isClosed) {
			$(window).trigger('cch.slide.items.opening');

			// When opening this slider, we don't want to show scroll bars showing up 
			// at the bottom of the window due to the width of the slider sliding 
			// into view. When closed, the slider is invisible except for the tab. 
			// When making it visible before sliding open, we need to set the body
			// overflow to hidden and then reset it once the slider is opened. We also 
			// reset the width of the container that was set to be as wide as the 
			// tab only 
			$('body').css({
				overflow: 'hidden'
			});
			
			$slideTab.find('i').removeClass('fa-chevron-left').addClass('fa-chevron-right');
			
			slideContainer.css({
				width: windowWidth - toExtent.left
			});
			
			slideContent.css({
				display: '',
				width: slideContainer.outerWidth() - $slideTab.outerWidth() - me.borderWidth
			});
			
			slideContent.offset({
				left: windowWidth - me.borderWidth,
				top: slideContainer.offset().top
			});
			
			slideContainer.animate({
				left: toExtent.left
			}, me.animationTime, function () {
				me.isClosed = false;
				$('body').css({
					overflow: ''
				});
				$(window).trigger('cch.slide.items.opened');
			});
		} else {
			$(window).trigger('cch.slide.items.opened');
		}
		// Set the session
		CCH.session.setItemSlideOpen(true);
	};

	me.close = function () {
		var container = $('#' + me.SLIDE_ITEMS_CONTAINER_ID),
			$slideTab = $('#' + me.SLIDE_TAB_ID),
			slideContent = $('#' + me.$SLIDE_CONTENT_ID),
			windowWidth = $(window).outerWidth();

		if (!me.isClosed) {
			$(window).trigger('cch.slide.items.closing');

			// We will be scrolling the entire pane out of the viewport. In order to
			// avoid scrollbars along the bottom of the screen, we temporarily set
			// the overflow to hidden for the body. We will set the display of 
			// the content to none, set the width of the container to just be the tab
			// and reset the overflow
			$('body').css({
				overflow: 'hidden'
			});
			$slideTab.find('i').removeClass('fa-chevron-right').addClass('fa-chevron-left');
			container.animate({
				left: windowWidth - $slideTab.outerWidth() - (me.borderWidth * 2)
			}, me.animationTime, function () {
				me.isClosed = true;

				slideContent.css({
					display: 'none'
				});

				$('body').css({
					overflow: ''
				});

				$(window).trigger('cch.slide.items.closed');
			});
		} else {
			$(window).trigger('cch.slide.items.closed');
		}
		// Set the session
		CCH.session.setItemSlideOpen(false);
	};

	// Toggles the container open/closed. This is only valid for when the 
	// application is in mobile mode. Otherwise, the item slide is a panel in
	// the application and does not toggle open or closed
	me.toggle = function () {
		if (me.isSmall()) {
			if (me.isClosed) {
				me.open();
			} else {
				me.close();
			}
		}
	};

	me.redimensioned = function (evt, isSmall) {
		var $slideContainer = $('#' + me.SLIDE_CONTENT_CONTAINER),
			$slideItemsContainer = $('#' + me.SLIDE_ITEMS_CONTAINER_ID),
			$slideTab = $('#' + me.SLIDE_TAB_ID),
			$searchContainer;

		if (isSmall) {
			// When I am switched to small mode, I want to remove the slideContainer's 
			// span class because it's no longer a span.
			$slideItemsContainer.removeClass('col-lg-3 col-md-4');

			$searchContainer = me.$HEADER_ROW.find('> div:nth-child(3)');

			// Move the Search bar from the header to my slider
			$searchContainer.prependTo($slideContainer);

			if (me.isClosed) {
				$slideTab.find('i').removeClass('fa-chevron-right').addClass('fa-chevron-left');
			} else {
				$slideTab.find('i').removeClass('fa-chevron-left').addClass('fa-chevron-right');
			}
		} else {
			$searchContainer = $slideContainer.find('> div:first-child:not(#application-slide-items-content-container-inner-scrollable)');

			$slideItemsContainer.addClass('col-lg-4 col-md-5');

			$searchContainer.insertAfter(me.$HEADER_ROW.find('> div:nth-child(2)'));
		}
	};

	me.windowScrollHandler = function () {
		var $slideContainer = $('#' + me.SLIDE_ITEMS_CONTAINER_ID),
			$slideTab = $('#' + me.SLIDE_TAB_ID);

		if (me.isSmall()) {
			var top;
			if (window.innerHeight < CCH.ui.minimumHeight) {
				top = window.innerHeight - $slideTab.outerHeight() * 2;
				if (top < 0) {
					top = $slideContainer.offset().top + $slideTab.outerHeight();
				}
				if (top < $(window).scrollTop()) {
					top = $(window).scrollTop() + $slideTab.outerHeight();
				}
			} else {
				top = $slideContainer.height() - $slideTab.outerHeight() - 20;
			}

			$slideTab.offset({
				top: top
			});
		}
	};
	$(window).scroll(me.windowScrollHandler);

	me.resized = function () {
		var extents = me.getExtents(),
			toExtent = me.isSmall() ? extents.small : extents.large,
			isSmall = me.isSmall(),
			$slideContainer = $('#' + me.SLIDE_ITEMS_CONTAINER_ID),
			$slideTab = $('#' + me.SLIDE_TAB_ID),
			$slideContent = $('#' + me.$SLIDE_CONTENT_ID),
			bodyWidth = $('body').outerWidth(),
			bodyHeight = $('#' + me.APPLICATION_CONTAINER_ID).outerHeight(),
			borderSize = 4,
			top;

		// I've got to know what my form factor is. Bootstrap uses a special number,
		// 992px at which to resize and I do some special stuff when bootstrap resizes.
		// - When switching to small (<=991px), my item slide container goes from being a column
		//   to a free-floating column and needs quite a bit of help in resizing when
		//   that happens
		if (isSmall) {
			// Then there's special sizing depending on if I'm closed or not. 
			if (me.isClosed) {
				// If I'm closed, my container, which holds my tab and content, 
				// should be off screen to the right except for the width of the tab
				// and its border so that just the tab is peeking out of the 
				// right side of the screen
				$slideContainer.offset({
					left: bodyWidth - $slideTab.outerWidth() - (me.borderWidth * 2)
				});
				// I hide the content dom since it's off screen and I don't want 
				// to show it
				$slideContent.css({
					display: 'none'
				});
			} else {
				// If I'm open...
				$slideContainer.offset(toExtent);

				$slideContent.css({
					display: ''
				});
			}


			$slideContainer.offset({
				'top': toExtent.top
			});
			$slideContainer.css({
				'width': bodyWidth - toExtent.left,
				'height': bodyHeight - toExtent.top
			});

			$slideContent.css({
				'width': $slideContainer.outerWidth() - $slideTab.outerWidth() - me.borderWidth
			});
			$slideContent.offset({
				'top': toExtent.top
			});


			if (window.innerHeight < CCH.ui.minimumHeight) {
				top = window.innerHeight - $slideTab.outerHeight() * 2;
				if (top < 0) {
					top = $slideContainer.offset().top + $slideTab.outerHeight();
				}
				if (top < $(window).scrollTop()) {
					top = $(window).scrollTop() + $slideTab.outerHeight();
				}
			}

			$slideTab.offset({
				left: $slideContainer.offset().left + borderSize,
				top: top
			});

			me.windowScrollHandler();
		} else {
			$slideContent.css({
				width: '',
				display: '',
				top: ''
			});
			$slideContainer.
				css({
					'height': me.$CONTENT_ROW.height(),
					'position': '',
					'top': '',
					'left': '',
					'width': ''
				});
		}

		$(window).trigger('cch.slide.items.resized');
	};

	me.getExtents = function () {
		var extents = {
			large: {
				top: me.$CONTENT_ROW.offset().top,
				left: me.$CONTENT_ROW.outerWidth() + me.$CONTENT_ROW.offset().left
			},
			small: {
				top: me.$CONTENT_ROW.offset().top + 20,
				left: 25
			}
		};

		return extents;
	};

	me.addCard = function (args) {
		args = args || {};

		if (args.card) {
			$('#' + me.SLIDE_CONTENT_CONTAINER).append(args.card);
		}
	};

	me.createCard = function (args) {
		args = args || {};
		var id = args.id || new Date().getMilliseconds(),
			title = args.title || 'Title Not Provided',
			content = args.content || 'Description Not Provided',
			titleContainerClass = 'application-slide-bucket-container-card-title',
			descriptionContainerClass = 'application-slide-bucket-container-card-description',
			newItem = $('#' + me.CARD_TEMPLATE_ID).children().clone(true),
			titleContainer = newItem.find('.' + titleContainerClass),
			titleContainerPNode = newItem.find('.' + titleContainerClass + ' p'),
			descriptionContainer = newItem.find('.' + descriptionContainerClass);

		newItem.attr('id', 'application-slide-bucket-container-card-' + id);
		titleContainer.attr('id', titleContainerClass + '-' + id);
		titleContainerPNode.html(title);
		descriptionContainer.attr('id', descriptionContainerClass + '-' + id).html(content);

		return newItem;
	};

	$(window).on({
		'cch.ui.resized': me.resized,
		'cch.ui.redimensioned': me.redimensioned,
		'cch.slide.bucket.opening': function () {
			if (me.isSmall()) {
				me.open();
			}
		},
		'cch.slide.search.opening': function () {
			if (me.isSmall()) {
				me.open();
			}
		},
		'cch.slide.bucket.item.thumbnail.click': function () {
			if (me.isSmall()) {
				me.toggle();
			}
		},
		'cch.card.click.zoomto': function () {
			if (me.isSmall()) {
				me.close();
			}
		}		
	});

	// This is a horrible hack - Chrome for android seems to be not show anything
	// above or below the cutoff of my cards whenever I scroll into view. Updating
	// the CSS slightly forces Chrome to perform a re-flow of the DOM in the container
	if (new RegExp("Android").test(navigator.userAgent) &&
		new RegExp("Chrome/[.0-9]*").test(navigator.userAgent)) {
		$.fn.scrollStopped = function (callback) {
			$(this).scroll(function () {
				var self = this,
					$this = $(self);
				if ($this.data('scrollTimeout')) {
					clearTimeout($this.data('scrollTimeout'));
				}
				$this.data('scrollTimeout', setTimeout(callback, 1, self));
			});
		};
		$('#' + me.SLIDE_CONTENT_CONTAINER).scrollStopped(function (element) {
			setTimeout(function (element) {
				$(element).height($(element).height() - 1);
			}, 2, element);
			setTimeout(function (element) {
				$(element).height($(element).height() + 1);
			}, 3, element);
		});
	}

	me.redimensioned(null, me.isSmall());

	$('#' + me.SLIDE_TAB_ID).on('click', me.toggle);

	CCH.LOG.trace('CCH.Objects.Widget.ItemsSlide::constructor: ItemsSlide class initialized.');
	return {
		open: me.open,
		close: me.close,
		toggle: me.toggle,
		addCard: me.addCard,
		createCard: me.createCard,
		isClosed: me.isClosed
	};
};