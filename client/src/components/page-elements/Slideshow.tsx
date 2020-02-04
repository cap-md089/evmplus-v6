import * as React from 'react';
import './Slideshow.scss';

interface SlideshowProps {
	fileIDs: string[];
}

interface SlideshowState {
	slideIndex: number;
}

export default class Slideshow extends React.PureComponent<SlideshowProps, SlideshowState> {
	public render() {
		return (
			<section className="slideshow-box">
				<div className="slideshow-top" />
				<div className="slideshow">
					<div className="image" />
				</div>
				<div className="slideshow-bottom" />
			</section>
		);
	}
}
