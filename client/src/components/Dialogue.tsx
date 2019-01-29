import * as React from 'react';
import { createPortal } from 'react-dom';

import * as $ from 'jquery';

import './Dialogue.css';

export interface DialogueWithOK {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.OK;
	onClose: () => void;
	labels?: [string];
}

export interface DialogueWithOKCancel {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.OK_CANCEL;
	onClose: () => void;
	onOk: () => void;
	onCancel: () => void;
	labels?: [string, string];
}

export interface DialogueWithYesNoCancel {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.YES_NO_CANCEL;
	onClose: () => void;
	onYes: () => void;
	onNo: () => void;
	onCancel: () => void;
	labels?: [string, string, string];
}

export interface DialogueWithCustom {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.CUSTOM;
	onClose: () => void;
	labels: string[]
}

export interface DialogueWithoutButtons {
	open: boolean;
	title: string;
	displayButtons: DialogueButtons.NONE;
	onClose: () => void;
	labels?: never[]
}

export enum DialogueButtons {
	OK,
	OK_CANCEL,
	YES_NO_CANCEL,
	CUSTOM,
	NONE
}

export type DialogueProps =
	| DialogueWithOK
	| DialogueWithOKCancel
	| DialogueWithYesNoCancel
	| DialogueWithCustom
	| DialogueWithoutButtons;

interface DialogueState {
	open: boolean;
}

export default class Dialogue extends React.Component<
	DialogueProps,
	DialogueState
	> {
	public state = {
		open: false
	};

	private mainDiv: HTMLDivElement;

	constructor(props: DialogueProps) {
		super(props);
	}

	public componentDidMount() {
		const div: JQuery = $(this.mainDiv).css({
			zIndex: 5010,
			position: 'fixed'
		});

		const mobile = $('body').hasClass('mobile');

		if (!mobile) {
			div.css({
				left: '50%',
				top: '50%',
				'margin-left'() {
					return -($(this).outerWidth() as number) / 2;
				},
				'margin-top'() {
					return -($(this).outerHeight() as number) / 2;
				}
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

	public componentDidUpdate() {
		const div = $(this.mainDiv);

		if (div.find('input[type=text]')[0]) {
			div.find('input[type=text]')[0].focus();
		}

		// if (this.props.open && !this.state.open) {
		// 	div.animate(
		// 		{
		// 			opacity: 1
		// 		},
		// 		250,
		// 		'swing'
		// 	);
		// 	this.setState({
		// 		open: true
		// 	});
		// } else if (!this.props.open && this.state.open) {
		// 	div.animate(
		// 		{
		// 			opacity: 0
		// 		},
		// 		250,
		// 		'swing',
		// 		() => {
		// 			this.setState({
		// 				open: false
		// 			});
		// 		}
		// 	);
		// }
	}

	public render() {
		return createPortal(
			<div
				id="cover"
				style={{
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					position: 'fixed',
					zIndex: this.props.open ? 5010 : -5010,
					display: 'block',
					backgroundColor: 'rgba(0, 0, 0, 0.5)'
				}}
				onClick={() => {
					this.props.onClose();
				}}
			>
				<div
					ref={(el: HTMLDivElement) => {
						this.mainDiv = el as HTMLDivElement;
					}}
					id="alert_box"
					key="main_alert"
					onClick={e =>
						!e.isPropagationStopped() && e.stopPropagation()
					}
				>
					{this.props.title ? <h2>{this.props.title}</h2> : null}
					<div className="content">{this.props.children}</div>
					{this.props.displayButtons === DialogueButtons.OK ? (
						<div className="closeButton">
							<a
								style={{
									float: 'right'
								}}
								className="primaryButton"
								id="ok"
								href="#"
								onClick={(
									e: React.MouseEvent<HTMLAnchorElement>
								) => {
									e.preventDefault();
									this.props.onClose();
								}}
							>
								{this.props.labels ? this.props.labels[0] : 'OK'}
							</a>
						</div>
					) : this.props.displayButtons ===
						DialogueButtons.OK_CANCEL ? (
								<div className="closeButton">
									<a
										style={{
											float: 'right',
											marginLeft: 10
										}}
										className="primaryButton"
										id="cancel"
										href="#"
										onClick={(
											e: React.MouseEvent<HTMLAnchorElement>
										) => {
											e.preventDefault();
											this.props.onClose();
											if (this.props.displayButtons === DialogueButtons.OK_CANCEL) {
												this.props.onCancel();
											}
										}}
									>
										{this.props.labels ? this.props.labels[1] : 'Cancel'}
									</a>
									<a
										style={{
											float: 'right'
										}}
										className="primaryButton"
										id="ok"
										href="#"
										onClick={(
											e: React.MouseEvent<HTMLAnchorElement>
										) => {
											e.preventDefault();
											this.props.onClose();
											if (this.props.displayButtons === DialogueButtons.OK_CANCEL) {
												this.props.onOk();
											}
										}}
									>
										{this.props.labels ? this.props.labels[0] : 'OK'}
									</a>
								</div>
							) : this.props.displayButtons ===
								DialogueButtons.YES_NO_CANCEL ? (
									<div className="closeButton">
										<a
											style={{
												float: 'right',
												marginLeft: 10
											}}
											className="primaryButton"
											id="cancel"
											href="#"
											onClick={(
												e: React.MouseEvent<HTMLAnchorElement>
											) => {
												e.preventDefault();
												this.props.onClose();
												if (this.props.displayButtons === DialogueButtons.YES_NO_CANCEL) {
													this.props.onCancel();
												}
											}}
										>
											{this.props.labels ? this.props.labels[2] : 'Cancel'}
										</a>
										<a
											style={{
												float: 'right',
												marginLeft: 10
											}}
											className="primaryButton"
											id="no"
											href="#"
											onClick={(
												e: React.MouseEvent<HTMLAnchorElement>
											) => {
												e.preventDefault();
												this.props.onClose();
												if (this.props.displayButtons === DialogueButtons.YES_NO_CANCEL) {
													this.props.onNo();
												}
											}}
										>
											{this.props.labels ? this.props.labels[1] : 'No'}
										</a>
										<a
											style={{
												float: 'right'
											}}
											className="primaryButton"
											id="yes"
											href="#"
											onClick={(
												e: React.MouseEvent<HTMLAnchorElement>
											) => {
												e.preventDefault();
												this.props.onClose();
												if (this.props.displayButtons === DialogueButtons.YES_NO_CANCEL) {
													this.props.onYes();
												}
											}}
										>
											{this.props.labels ? this.props.labels[0] : 'Yes'}
										</a>
									</div>
								) : null}
				</div>
			</div>,
			document.getElementById('dialogue-box') as HTMLElement
		);
	}
}
