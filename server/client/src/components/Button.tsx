import * as React from 'react';

import * as jQuery from 'jquery';

import * as classNames from 'classnames';

export interface ButtonProps {
	url?: string;
	className?: string;
	id?: string;

	/**
	 * Data to send on button press
	 */
	data?: any;

	/** 
	 * The function to handle data before a request is sent.
	 * 
	 * Action is determined by return data
	 * If a promise, it will wait until it resolves. If it is an object, it will send the object
	 * If boolean (or a Promise that resolves to a boolean), it will send if true
	 * If anything else, it sends the object
	 * 
	 * @param data The data currently being sent
	 * 
	 * @returns {Promise<any> | boolean | any} Data to control the request
	 */
	onClick?: (data: any) => Promise<any> | boolean | any;

	/** 
	 * The receiver function to handle the response from the server
	 * 
	 * @param data Data received, as this is a REST service it will attempt to call JSON.parse
	 * 
	 * @returns {void}
	 */
	onReceiveData?: (data: any) => void;

	/**
	 * Used for testing purposes
	 */
	jQuery?: JQueryStatic<HTMLElement>;
}

export default class Button extends React.Component<ButtonProps, {
	disabled: boolean
}> {
	constructor(props: ButtonProps) {
		super(props);

		this.handleClick = this.handleClick.bind(this);
		this.state = {
			disabled: false
		};
	}

	protected handleClick (e: React.MouseEvent<HTMLAnchorElement>) {
		let promise = new Promise<{push: boolean, data: any}> ((res, rej): void => {
			this.setState({
				disabled: true
			});
			if (typeof this.props.onClick === 'undefined') {
				res({
					push: true,
					data: null
				});
				return;
			}
			let clickResolve = this.props.onClick(this.props.data);
			console.log(clickResolve instanceof Promise);
			console.log(clickResolve);
			if (typeof clickResolve !== 'undefined' && typeof clickResolve.then !== 'undefined') {
				console.log('Handling promise');
				clickResolve.then((data: any) => {
					console.log('Promise done');
					if (typeof data === 'boolean') {
						res ({
							push: data,
							data: null
						});
					} else {
						res ({
							push: true,
							data
						});
					}
				});
			} else if (typeof clickResolve === 'boolean') {
				res({
					push: clickResolve,
					data: null
				});
			} else {
				res({
					push: true,
					data: clickResolve
				});
			}
		}).then((data) => {
			console.log('Hi', data);
			((this.props.jQuery || jQuery).getJSON as any)(
				this.props.url || '/',
				data,
				(serverData: any) => {
					this.setState({
						disabled: false
					});
					if (typeof this.props.onReceiveData === 'undefined') {
						return;
					}
					this.props.onReceiveData(serverData);
				}
			);
		});
		return promise;
	}

	render () {
		return (
			<a
				onClick={this.handleClick}
				className={
					classNames({
						[this.props.className || 'asyncButton']: true,
						disabled: this.state.disabled
					})
				}
			>
				{this.props.children}
			</a>
		);
	}
}