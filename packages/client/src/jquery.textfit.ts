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

import $ from 'jquery/dist/jquery.slim';

export const innerWrap = (el: JQuery): JQuery => {
	// Wrap the content of the target element in a div with
	// with the same width
	el.wrapInner($('<div id="textfit-inner"></div>').css('width', el.css('width')));
	return $('#textfit-inner');
};

export const removeWrap = (el: JQuery<HTMLElement>): void => {
	el.replaceWith(el.contents() as JQuery<HTMLElement>);
};

export const bestfit = (el: JQuery): JQuery => {
	let fs = parseInt(el.css('font-size'), 10);

	// Wrap the content of the target element in a div with
	// with the same width
	const i = innerWrap(el);

	// Keep reducing the font size of the target element
	// until the inner div fits
	while ((i.height() as number) > (el.height() as number)) {
		el.css('font-size', `${--fs}px`);
	}

	removeWrap(i);
	return el;
};

export default $;
