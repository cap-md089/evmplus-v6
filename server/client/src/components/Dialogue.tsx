import * as React from 'react';

import { connect } from 'react-redux';
import $ from '../jquery.textfit';

import { closeDialogue } from '../actions/dialogue';

class Dialogue extends React.Component<{
	open: boolean,					// Part of state specified for the react store
	title: string,
	text: JSX.Element | string,
	buttontext: string,
	displayButton: boolean,
	onClose: Function,

	isMobile: boolean, // Required property
	
	dispatch: Function // Provided by react-redux
}, {
	open: boolean,
	title: string,
	text: JSX.Element | string,
	buttonText: string,
	displayButton: boolean
}> {
	private mainDiv: HTMLDivElement;
	
	constructor(props: {
		open: boolean,					// Part of state specified for the react store
		title: string,
		text: JSX.Element | string,
		buttontext: string,
		displayButton: boolean,
		onClose: Function,
	
		isMobile: boolean, // Required property
		
		dispatch: Function // Provided by react-redux
	}) {
		super(props);

		this.state = {
			open: false,
			title: '',
			text: '',
			buttonText: '',
			displayButton: false
		};
	}

	componentDidMount() {
		let div: JQuery = $(this.mainDiv).css({
			'zIndex': 5010,
			'position': 'fixed'
		});
		if (!this.props.isMobile) {
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

		if (this.props.open) {
			$(div).animate(
				{
					opacity: 1
				},
				250,
				'swing'
			);
		} else {
			$(div).animate(
				{
					opacity: 0
				},
				250,
				'swing',
				() => {
					this.setState({
						open: this.props.open,
						title: this.props.title,
						text: this.props.text,
						buttonText: this.props.buttontext,
						displayButton: this.props.displayButton
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

		return (
			<div
				id="cover"
				style={{
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					position: 'fixed',
					zIndex: 5010,
					display: this.state.open ? 'block' : 'none'
				}}
				onClick={
					() => {
						// this.props.dispatch(closeDialogue());
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
				>
					{this.state.title ? <h2>{this.state.title}</h2> : null}
					<div className="content">
						{this.state.text}
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
											console.log('Closing');
											this.props.onClose();
											this.props.dispatch(closeDialogue());
										}
									}
								>
									{this.state.buttonText}
								</a>
							</div> :
							null
					}
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state: {
	Dialogue: {
		open: boolean,
		title: string,
		text: JSX.Element | string,
		buttontext: string,
		displayButton: boolean,

		onClose: Function
	} 
}) => {
	return state.Dialogue;
};

const mapDispatchToProps = (dispatch: Function) => {
	return {
		dispatch
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(Dialogue);