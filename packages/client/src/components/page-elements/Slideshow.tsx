/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import './Slideshow.css';

interface SlideshowProps {
	fileIDs: string[];
}

interface SlideshowState {
	slideIndex: number;
}

export default class Slideshow extends React.PureComponent<SlideshowProps, SlideshowState> {
	public render = (): JSX.Element => (
		<section className="slideshow-box">
			<div className="slideshow-top" />
			<div className="slideshow">
				<div className="image" />
			</div>
			<div className="slideshow-bottom" />
		</section>
	);
}
