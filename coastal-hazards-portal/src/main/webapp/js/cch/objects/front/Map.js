/*jslint browser: true */
/*jslint plusplus: true */
/*global $*/
/*global CCH*/
/*global OpenLayers*/
window.CCH = CCH || {};
CCH.Objects = CCH.Objects || {};
CCH.Objects.Front = CCH.Objects.Front || {};
CCH.Objects.Front.Map = function (args) {
	"use strict";
	var me = (this === window) ? {} : this;

	// Continental United States
	me.initialExtent = [-14819398.304233, -92644.611414691, -6718296.2995848, 9632591.3700111];
	me.mapDivId = args.mapDiv;
	me.$MAP_DIV = $('#' + me.mapDivId);
	me.bboxFadeoutDuration = 2000;
	me.mapProjection = "EPSG:900913";
	me.markerLayerName = 'LocationMarkerLayer';
	me.locationResultIcon = CCH.CONFIG.contextPath + '/images/map/markers/redmarker.png';
	me.locationResultIconHighlighted = CCH.CONFIG.contextPath + '/images/map/markers/yellowmarker.png';
	me.displayProjection = new OpenLayers.Projection(me.mapProjection);
	//me.attributionSource = CCH.CONFIG.contextPath + '/images/openlayers/usgs.svg';

	// Map Controls
	me.scaleLineControl = new OpenLayers.Control.ScaleLine({
		geodesic: true
	});
	me.layerSwitcher = new OpenLayers.Control.LayerSwitcher({
		roundedCorner: true
	});
	//me.attributionControl = new OpenLayers.Control.Attribution({
	//	'template': '<a id="attribution-link" href="http://www.usgs.gov/"><img id="openlayers-map-attribution-image" src="' + me.attributionSource + '" /></a>'
	//});
	me.getFeatureInfoControl = new CCH.Objects.LayerIdentifyControl();
	me.zoomToCurrentLocationControl = new CCH.Objects.Widget.OLZoomToIcon();
	me.drawBoxControl =  new CCH.Objects.Widget.OLDrawBoxControl(CCH.CONFIG.map.layers.drawBoxLayer);
	me.clickControl = null; // Defined in init 

	me.showLayer = function (args) {
		var item = args.item,
			ribbonIndex = args.ribbon || 0,
			name = args.name,
			visible = args.visible === false ? false : true,
			layer;

		layer = me.map.getLayersByName(name)[0];

		if (!layer) {
			if (item && 'function' === typeof item.getWmsLayer) {
				layer = item.getWmsLayer(args);
			}
		}

		layer.name = name;
		
		if (ribbonIndex !== 0 && layer.params.SLD && layer.params.SLD.indexOf('ribbon') === -1) {
			layer.mergeNewParams({
				'SLD': layer.params.SLD + '?ribbon=' + ribbonIndex,
				'buffer': (ribbonIndex - 1) * 6
			});
		}

		layer.setVisibility(visible);

		me.addLayer(layer);

		$(window).trigger('cch.map.shown.layer', {
			layer: layer
		});
		
		me.legendControl.maximizeControl();
		
		return layer;
	};
	
	me.getMarkerLayer = function () {
		var markerLayers = me.getMap().getLayersByName(me.markerLayerName);
		if (markerLayers.length > 0) {
			return markerLayers[0];
		}
		return null;
	};
	
	me.createMarkerLayer = function () {
		var markerLayer = me.getMarkerLayer();
		if (!markerLayer) {
			markerLayer = new OpenLayers.Layer.Markers(me.markerLayerName);
			me.getMap().addLayer(markerLayer);
			
			while (markerLayer !== me.getMap().layers.last()) {
				me.getMap().raiseLayer(markerLayer, 1);
			}
		}
		return markerLayer;
	};
	
	me.removeMarkerLayer = function () {
		var markerLayer = me.getMarkerLayer();
		if (markerLayer) {
			me.getMap().removeLayer(markerLayer, false);
		}
	};
	
	me.addLocationMarkers = function (locations) {
		var markerLayer = me.getMarkerLayer();
		if (!markerLayer) {
			markerLayer = me.createMarkerLayer();
		}
		locations.forEach(function (location) {
			var locationMeterGeometry = location.feature.geometry,
				size = new OpenLayers.Size(21, 25),
				offset = new OpenLayers.Pixel(-(size.w / 2), -size.h),
				icon = new OpenLayers.Icon(me.locationResultIcon, size, offset),
				marker = new OpenLayers.Marker(new OpenLayers.LonLat(locationMeterGeometry.x, locationMeterGeometry.y), icon),
				$markerDiv = $(marker.icon.imageDiv);
				
			marker.location = location;
			marker.events.fallThrough = false;
			$markerDiv.popover({
				'container' : 'body',
				'content' : location.feature.attributes.Place_addr,
				'html' : true,
				'title' : location.name,
				'placement' : 'auto',
				'trigger' : 'hover'
			});
			
			marker.events.register('click', null, function () {
				var extent = this.location.extent;
				// I don't want this popover to still be around when I zoom in
				$(this.icon.imageDiv).popover('hide');
				// Zoom to where the pointer is based on the original location search's extent
				me.getMap().zoomToExtent(new OpenLayers.Bounds(extent.xmin, extent.ymin, extent.xmax, extent.ymax));
				ga('send', 'event', {
					'eventCategory': 'map',
					'eventAction': 'locationMarkerClicked',
					'eventLabel': 'map event'
				});
			});
			marker.events.register('mouseover', null, function () {
				var $iconDiv = $(this.icon.imageDiv);
				$iconDiv.find('img').attr('src', me.locationResultIconHighlighted);
			});
			marker.events.register('mouseout', null, function () {
				var $iconDiv = $(this.icon.imageDiv);
				$iconDiv.find('img').attr('src', me.locationResultIcon);
			});
			markerLayer.addMarker(marker);
		});
	};

	me.hideLayer = function (layer) {
		layer.setVisibility(false);
		$(window).trigger('cch.map.hid.layer', {
			layer: layer
		});
	};

	me.hideAllLayers = function () {
		var hiddenLayerNames = [];

		me.getLayersBy('type', 'cch').each(function (layer) {
			me.hideLayer(layer);
			hiddenLayerNames.push(layer.name);
		});
		return hiddenLayerNames;
	};

	me.removeLayerCallback = function (evt) {
		var layer = evt.layer;
		$(window).trigger('cch.map.removed.layer', {
			layer: layer
		});
	};

	me.addLayerCallback = function (evt) {
		var layer = evt.layer;
		$(window).trigger('cch.map.added.layer', {
			layer: layer
		});
	};

	me.onUIResized = function () {
		$(me.$MAP_DIV).height($('#content-row').height());
		me.removeAllPopups();
		me.map.updateSize();
	};

	me.onSessionLoaded = function () {
		// A session has been loaded. The map will be rebuilt from the session
		me.updateFromSession();
	};

	me.removeAllPopups = function () {
		if (CCH.map.getMap().popups.length) {
			CCH.map.getMap().popups.each(function (popup) {
				popup.closeDiv.click();
			});
		}
	};

	return $.extend(me, {
		init: function () {
			CCH.LOG.trace('Map.js::init():Map class is initializing.');

			CCH.LOG.debug('Map.js::init():Building map object');
			me.map = new OpenLayers.Map(me.mapDivId, {
				projection: me.mapProjection,
				displayProjection: me.displayProjection,
				tileManager : new CCH.Objects.FixedTileManager({
					maps : [me.map]
				})
			});

			me.clickControl = new CCH.Objects.ClickControl({
				handlerOptions: {
					"single": true,
					"map": me.map
				}
			});

			me.legendControl = new CCH.Objects.Widget.OLLegend({
				startHidden: true
			});

			CCH.LOG.debug('Map.js::init():Adding base layers to map');
			me.map.addLayers(CCH.CONFIG.map.layers.baselayers);
			me.map.addLayers([CCH.CONFIG.map.layers.worldBoundariesAndPlaces, CCH.CONFIG.map.layers.drawBoxLayer]);
			
			CCH.LOG.debug('Map.js::init():Adding controls to map');
			me.map.addControls([
				me.layerSwitcher,
				me.getFeatureInfoControl,
				//me.attributionControl,
				me.clickControl,
				me.scaleLineControl,
				me.legendControl,
				me.zoomToCurrentLocationControl,
				me.drawBoxControl
			]);
			me.clickControl.activate();
			me.legendControl.activate();
			me.zoomToCurrentLocationControl.activate();

			CCH.LOG.debug('Map.js::init():Binding map event handlers');
			me.map.events.on({
				'zoomend': me.zoomendCallback,
				'moveend': me.moveendCallback,
				'removelayer': me.removeLayerCallback,
				'preaddlayer': me.preAddLayerCallback,
				'addlayer': me.addLayerCallback,
				'changelayer': me.changelayerCallback,
				'changebaselayer' : me.changeBaseLayerCallback
			});

			if (CCH.session && CCH.session.getSession() && CCH.session.getSession().baseLayer) {
				me.map.setBaseLayer(me.map.getLayersByName(CCH.session.getSession().baseLayer));
			}

			CCH.LOG.debug('Map.js::init():Replacing map graphics');
			$('#OpenLayers_Control_MaximizeDiv_innerImage').attr('src', CCH.CONFIG.contextPath + '/images/openlayers/maximize_minimize_toggle/cch-layer-switcher-closed.svg');
			$('#OpenLayers_Control_MinimizeDiv_innerImage').attr('src', CCH.CONFIG.contextPath + '/images/openlayers/maximize_minimize_toggle/cch-layer-switcher-opened.svg');

			// Bind application event handlers
			$(window).on({
				'cch.data.session.loaded.true': me.onSessionLoaded,
				'cch.ui.resized': me.onUIResized,
				'cch.slide.search.closed': me.removeMarkerLayer,
				'cch.data.locations.searched': function (evt, locations) {
					if (locations && locations.items && locations.items.length > 0) {
						me.map.zoomToExtent(new CCH.Util.Search().getBboxOfLocationResults(locations.items));
						me.removeMarkerLayer();
						me.createMarkerLayer();
						me.addLocationMarkers(locations.items);
					}
				}
			});

			me.map.events.register("click", me.map, function (e) {
				$(me).trigger('map-click', e);
			});

			return me;
		},
		showLegend: function () {
			me.legendControl.show();
		},
		hideLegend: function () {
			me.legendControl.hide();
		},
		getLegendControl: function () {
			return me.legendControl;
		},
		getMap: function () {
			return me.map;
		},
		addLayerToFeatureInfoControl: function (layer) {
			var control = me.getFeatureInfoControl;
			layer.params.STYLES = '';
			layer.url = layer.url.substring(layer.url.indexOf('geoserver'));
			control.layers.push(layer);
			control.activate();
		},
		zoomToBoundingBox: function (args) {
			args = args || {};
			var bbox = args.bbox,
				fromProjection = args.fromProjection || me.displayProjection,
				layerBounds = OpenLayers.Bounds.fromArray(bbox),
				attemptClosest = args.attemptCloses || false;

			if (fromProjection) {
				layerBounds.transform(new OpenLayers.Projection(fromProjection), me.displayProjection);
			}
			me.map.zoomToExtent(layerBounds, attemptClosest);
		},
		zoomToActiveLayers: function () {
			var activeLayers = me.getLayersBy('type', 'cch'),
				bounds = new OpenLayers.Bounds(),
				lIdx,
				activeLayer,
				layerBounds;

			if (activeLayers.length) {
				// Zoom to pinned cards
				for (lIdx = 0; lIdx < activeLayers.length; lIdx++) {
					activeLayer = activeLayers[lIdx];
					layerBounds = OpenLayers.Bounds.fromArray(activeLayer.bbox).transform(CCH.CONFIG.map.modelProjection, CCH.map.getMap().displayProjection);
					bounds.extend(layerBounds);
				}
			} else {
				// No pinned cards, zoom to the collective bbox of all cards
				CCH.cards.getCards().each(function (card) {
					bounds.extend(OpenLayers.Bounds.fromArray(card.bbox).transform(CCH.CONFIG.map.modelProjection, CCH.map.getMap().displayProjection));
				});
			}

			me.map.zoomToExtent(bounds, false);
		},
		updateSession: function () {
			var map = me.map,
				session = CCH.session.getSession(),
				center = map.getCenter().transform(CCH.map.getMap().displayProjection, CCH.CONFIG.map.modelProjection);
		
			session.baselayer = map.baseLayer.name;
			session.center = [
				center.lon,
				center.lat
			];
			session.scale = map.getScale();
			session.bbox = map.getExtent().transform(CCH.map.getMap().displayProjection, CCH.CONFIG.map.modelProjection).toArray();
			return session;
		},
		/**
		 * Updates the map based on the information contained in the session object
		 * 
		 * @returns {undefined}
		 */
		updateFromSession: function () {
			CCH.LOG.info('Map.js::updateFromSession():Map being recreated from session');
			var session = CCH.session.getSession(),
				baselayer,
				center = new OpenLayers.LonLat(session.center[0], session.center[1]).transform(CCH.CONFIG.map.modelProjection, CCH.map.getMap().displayProjection);

			// Becaue we don't want these events to write back to the session, 
			// unhook the event handlers for map events tied to session writing.
			// They will be rehooked later
			me.map.events.un({
				'moveend': me.moveendCallback,
				'addlayer': me.addlayerCallback,
				'changelayer': me.changelayerCallback,
				'removelayer': me.removeLayerCallback
			});

			// A session will have a base layer set. Check if the base layer is 
			// different from the current base layer. If so, switch to that base layer
			if (session.baselayer && session.baselayer !== me.map.baseLayer.name) {
				// Try to find the named base layer from the configuration object's
				// list of layers. If found, set it to the map's new base layer
				baselayer = CCH.CONFIG.map.layers.baselayers.find(function (bl) {
					return bl.name === session.baselayer;
				});

				if (baselayer) {
					// The base layer from the config object has been found.
					// Add it to the map as a new baselayer
					me.map.setBaseLayer(baselayer);
				}
			}
			
			me.map.setCenter(center);
			me.map.zoomToScale(session.scale);
			
			// We're done altering the map to fit the session. Let's re-register those 
			// events we disconnected earlier
			me.map.events.on({
				'moveend': me.moveendCallback,
				'removelayer': me.removeLayerCallback,
				'addlayer': me.addLayerCallback,
				'changelayer': me.changelayerCallback
			});
		},
		hideAllLayers: me.hideAllLayers,
		/**
		 * Removes a layer from the map based on the layer's name. If more
		 * than one layer with the same name exists in the map, removes
		 * all layers with that name
		 * 
		 * @param {type} name
		 * @returns {undefined}
		 */
		hideLayersByName: function (name) {
			CCH.LOG.trace('Map.js::hideLayersByName: Trying to hide a layer. Layer name: ' + name);
			var layers = me.map.getLayersByName(name) || [];
			layers.each(function (layer) {
				me.hideLayer(layer);
			});
			return layers;
		},
		showLayer: me.showLayer,
		removeLayer: me.hideLayer,
		addLayer: function (layer) {
			var layerName = layer.name,
				mapLayerArray = me.map.getLayersByName(layerName);

			if (mapLayerArray.length === 0) {
				me.map.addLayer(layer);
				me.addLayerToFeatureInfoControl(layer);
			}

			return layer;
		},
		zoomendCallback: function () {
			var map = me.map;
			if (map.baseLayer.name.toLowerCase() === "ocean" && map.getZoom() > 13) {
				var baseLayers = map.getLayersByName("World Imagery");
				if (baseLayers.length > 0) {
					map.setBaseLayer(baseLayers[0]);
				}
			}
			
			// It was reported that the scale control was sometimes not updating 
			// on zoom. This is an attempt to force that to happen. 
			map.getControlsByClass('OpenLayers.Control.ScaleLine')[0].update();
						
			CCH.session.updateSession();
		},
		moveendCallback: function () {
			CCH.session.updateSession();
			$(window).trigger('cch.map.action.moveend', {
				map : me.map
			});
		},
		changelayerCallback: function (evt) {
			var layer = evt.layer;
			$(window).trigger('cch.map.layer.changed', {
				property: evt.property,
				layer: layer
			});
			CCH.map.removeAllPopups();
		},
		changeBaseLayerCallback : function (evt) {
			// I want to make sure that if the layer chosen is not the world imagery layer,
			// that I turn off the world labels and place names layer because all 
			// other base layers have labels.
			
			// A possible future improvement is to note whether the place names 
			// layer was on at the time of choosing another base layer and if not, 
			// don't flip it back on when the user comes back to world imagery
			// Value = low, complexity = medium
			var placeNames = CCH.map.getMap().getLayersBy('name', 'Place Names')[0];
			if (evt.layer.name === 'World Imagery') {
				placeNames.setVisibility(true);
			} else {
				placeNames.setVisibility(false);
			}
			
			ga('send', 'event', {
				'eventCategory': 'map',
				'eventAction': 'baseLayerChange',
				'eventLabel': 'map event'
			});
			
			return placeNames.getVisibility();
		},
		preAddLayerCallback: function (evt) {
			var layer = evt.layer,
				mapDiv = 'div.olMap',
				body = 'body',
				cursor = 'cursor';

			layer.events.register('loadstart', layer, function () {
				$(mapDiv).css(cursor, 'wait');
				$(body).css(cursor, 'wait');
			});
			layer.events.register('loadend', layer, function () {
				var layers = CCH.map.getMap().layers.findAll(function (l) {
					return l.type === 'cch';
				}),
					layersStillLoading = 0;

				layers.each(function (l) {
					layersStillLoading += l.numLoadingTiles;
				});

				if (layersStillLoading === 0) {
					$(mapDiv).css(cursor, 'default');
					$(body).css(cursor, 'default');
				}
			});
		},
		getLayersBy: function (attr, value) {
			return me.map.getLayersBy(attr, value);
		},
		getLayersByName: function (name) {
			return me.map.getLayersByName(name);
		},
		CLASS_NAME: 'CCH.Objects.Map'
	});
};
