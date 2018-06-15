import * as React from 'react';
import { createPortal } from 'react-dom';

import $ from '../jquery.textfit';

export default class Dialogue extends React.Component<{
	open: boolean,					// Part of state specified for the react store
	title: string,
	buttonText: string,
	displayButton: boolean,
	onClose: Function,
}, {
	open: boolean,
	title: string,
	buttonText: string,
	displayButton: boolean
}> {
	private mainDiv: HTMLDivElement;
	
	constructor(props: {
		open: boolean,					// Part of state specified for the react store
		title: string,
		buttonText: string,
		displayButton: boolean,
		onClose: Function,
	
		isMobile: boolean, // Required property
		
		dispatch: Function // Provided by react-redux
	}) {
		super(props);

		this.state = {
			open: false,
			title: '',
			buttonText: '',
			displayButton: false
		};
	}

	componentDidMount() {
		let div: JQuery = $(this.mainDiv).css({
			'zIndex': 5010,
			'position': 'fixed'
		});

		let mobile = $('body').hasClass('mobile');

		if (!mobile) {
			div.css({
				'left': '50%',
				'top': '50%',
				'margin-left': function () { return -($(this).outerWidth() as number) / 2; },
				'margin-top': function () { return -($(this).outerHeight() as number) / 2; }
			});
		} else {
			div.css({
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			});
		}

		if (div.find('input[type=text]')[0]) {
			div.find('input[type=text]')[0].focus();
		}

		if (this.props.open && !this.state.open) {
			$(div).animate(
				{
					opacity: 1
				},
				250,
				'swing'
			);
			this.setState(this.props);
		} else if (!this.props.open && this.state.open) {
			$(div).animate(
				{
					opacity: 0
				},
				250,
				'swing',
				() => {
					this.setState({
						open: false
					});
				}
			);
		}

		return true;
	}

	render () {
		setTimeout(() => {
			this.componentDidMount();
		});

		return createPortal(
			<div
				id="cover"
				style={{
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					position: 'fixed',
					zIndex: this.state.open ? 5010 : -5010,
					display: 'block',
					backgroundColor: 'rgba(0, 0, 0, 0.5)'
				}}
				onClick={
					() => {
						this.props.onClose();
					}
				}
			>
				<div
					ref={
						(el: HTMLDivElement) => {
							this.mainDiv = el as HTMLDivElement;
						}
					}
					id="alert_box"
					key="main_alert"
					onClick={e => !e.isPropagationStopped() && e.stopPropagation()}
				>
					{this.state.title ? <h2>{this.state.title}</h2> : null}
					<div className="content">
						{this.props.children}
					</div>
					{
						this.state.displayButton ? 
							<div className="closeButton">
								<a
									style={{
										float: 'right'
									}}
									className="primaryButton"
									id="ok"
									href="#"
									onClick={
										(e: React.MouseEvent<HTMLAnchorElement>) => {
											e.preventDefault();
											this.props.onClose();
										}
									}
								>
									{this.state.buttonText}
								</a>
							</div> :
							null
					}
				</div>
			</div>,
			document.getElementById('dialogue-box') as HTMLElement
		);
	}
}