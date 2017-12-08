/*jslint browser: true*/
/*global $*/
$(document).ready(function () {
	"use strict";
	
	// For any ajax call going out, change the mouse pointer to a wait cursors, change it back on ajax stop/error
	$(document).ajaxStart(function () {
		$('body').css('cursor', 'wait');
	});
	$(document).ajaxStop(function () {
		$('body').css('cursor', 'default');
	});
	$(document).ajaxError(function () {
		$('body').css('cursor', 'default');
	});
	
	var id = CCH.config.id;
	
	CCH.ui = new CCH.Objects.Publish.Tree.UI({
		'id' : id,
		'$diagramContainer' : $('#app-container'),
		'$treeContainer' : $('#tree-container'),
		'$saveButton' : $('#save-button'),
		'$clearSearchButton' : $('#clear-search'),
		'$searchButton' : $('#search-button'),
		'$searchInput' : $('#search-input')
	});
});