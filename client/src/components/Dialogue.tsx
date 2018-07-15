import * as React from 'react';
import { createPortal } from 'react-dom';

import * as $ from 'jquery';

interface DialogueWithButton {
	open: boolean,
	title: string,
	buttonText: string,
	displayButton: true,
	onClose: () => void,
}

interface DialogueWithoutButton {
	open: boolean;
	title: string;
	displayButton: false;
	onClose: () => void;
}

export default class Dialogue extends React.Component<
DialogueWithButton | DialogueWithoutButton, DialogueWithButton | DialogueWithoutButton> {
	private mainDiv: HTMLDivElement;
	
	constructor(props: DialogueWithButton | DialogueWithoutButton) {
		super(props);

		this.state = {
			open: this.props.open,
			title: '',
			displayButton: false
		} as DialogueWithButton | DialogueWithoutButton;
	}

	public componentDidMount() {
		const div: JQuery = $(this.mainDiv).css({
			'zIndex': 5010,
			'position': 'fixed'
		});

		const mobile = $('body').hasClass('mobile');

		if (!mobile) {
			div.css({
				'left': '50%',
				'top': '50%',
				'margin-left'() { return -($(this).outerWidth() as number) / 2; },
				'margin-top'() { return -($(this).outerHeight() as number) / 2; }
			});
		} else {
			div.css({
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			});
		}


		return true;
	}

	public componentDidUpdate () {
		const div = $(this.mainDiv);

		if (div.find('input[type=text]')[0]) {
			div.find('input[type=text]')[0].focus();
		}

		if (this.props.open && !this.state.open) {
			div.animate(
				{
					opacity: 1
				},
				250,
				'swing'
			);
			this.setState(this.props);
		} else if (!this.props.open && this.state.open) {
			div.animate(
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
	}

	public render () {
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