/**
 * jQuery Text Fit v1.0
 * https://github.com/nbrunt/TextFit
 *
 * Copyright 2013 Nick Brunt
 * http://nickbrunt.com
 *
 * Free to use and abuse under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

/// <reference path="jquery.textfit.d.ts" />

import * as jQuery from 'jquery';

(function( $: JQueryStatic<HTMLElement> ) {
	// Helper methods

	let innerWrap = function( el: JQuery<HTMLElement> ): JQuery<HTMLElement> {
		// Wrap the content of the target element in a div with
		// with the same width
		el.wrapInner($('<div id="textfit-inner"></div>').css('width', el.css('width')));
		return $('#textfit-inner');
	};
	
	let removeWrap = function( el: JQuery<HTMLElement> ) {
		el.replaceWith(el.contents() as JQuery<HTMLElement>);
	};
	
	let bestfit = function(el: JQuery<HTMLElement>): JQuery<HTMLElement> {
		var fs = parseInt(el.css('font-size'), 10);

		// Wrap the content of the target element in a div with
		// with the same width
		var i = innerWrap(el);

		// Keep reducing the font size of the target element
		// until the inner div fits
		while ((i.height() as number) > (el.height() as number)) {
			el.css('font-size', --fs + 'px');
		}

		removeWrap(i);
		return el;
	};

	$.fn.textfit = function( method: string ) {

		// If applied on multiple items
		if (this.length > 1) {
			this.each(function () {
				$(this).textfit(method);
			});
			return;
		}

		return bestfit(this);
	};

})( jQuery );

export default jQuery;