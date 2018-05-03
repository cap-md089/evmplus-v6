import * as React from 'react';

import myFetch from '../lib/myFetch';

import * as classNames from 'classnames';

export interface ButtonProps<C, S> {
	url?: string;
	className?: string;
	id?: string;

	/**
	 * Data to send on button press
	 */
	data?: C;

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
	onClick?: (data?: C) => Promise<any> | boolean | any;

	/** 
	 * The receiver function to handle the response from the server
	 * 
	 * Will not be called if onClick resolves to a boolean that is false
	 * Data will be undefined if the `url` property is undefined
	 * 
	 * @param data Data received, as this is a REST service it will attempt to call JSON.parse
	 * 
	 * @returns {void}
	 */
	onReceiveData?: (data?: S) => void;

	/**
	 * Same as onReceiveData except the first parameter is client data
	 * 
	 * @param clientData Data to send
	 * @param serverData Data that was received
	 * 
	 * @returns {void}
	 */
	onFinish?: (clientData?: C, serverData?: S) => void;

	/**
	 * Used for testing purposes
	 */
	jQuery?: JQueryStatic<HTMLElement>;

	/**
	 * Used for testing purposes
	 */
	fetch?: (url: string, options: RequestInit) => Promise<Response>;

	buttonType?: 'primaryButton' | 'secondaryButton' | ('none' | '');
}

export default class Button<C, S> extends React.Component<ButtonProps<C, S>, {
	disabled: boolean
}> {
	constructor(props: ButtonProps<C, S>) {
		super(props);

		this.handleClick = this.handleClick.bind(this);
		this.state = {
			disabled: false
		};
	}

	public handleClick (e: React.MouseEvent<HTMLAnchorElement>): void {
		(new Promise<{push: boolean, data: any}> ((res, rej): void => {
			this.setState({
				disabled: true
			});
			if (typeof this.props.onClick === 'undefined') {
				res({
					push: true,
					data: this.props.data
				});
				return;
			}
			let clickResolve;
			if (typeof this.props.data !== 'undefined') {
				clickResolve = this.props.onClick(this.props.data);
			} else {
				clickResolve = this.props.onClick();
			}
			if (typeof clickResolve !== 'undefined' && typeof clickResolve.then !== 'undefined') {
				clickResolve.then((data: any) => {
					if (typeof data === 'boolean') {
						res ({
							push: data,
							data: this.props.data
						});
					} else {
						res ({
							push: true,
							data: typeof data === 'undefined' ? this.props.data : data
						});
					}
				});
			} else if (typeof clickResolve === 'boolean') {
				res({
					push: clickResolve,
					data: this.props.data
				});
			} else {
				res({
					push: true,
					data: clickResolve
				});
			}
		}).then((pushData) => {
			if (pushData.push && this.props.url) {
				(this.props.fetch || myFetch)(this.props.url, {
					body: JSON.stringify(pushData.data),
					method: 'POST',
					credentials: 'same-origin',
					headers: {
						'Content-type': 'application/json'
					}
				}).then(res => {
					return res.json();
				}).then((serverData: S) => {
					this.setState({
						disabled: false
					});
					if (typeof this.props.onReceiveData !== 'undefined') {
						this.props.onReceiveData(serverData);
					}
					if (typeof this.props.onFinish !== 'undefined') {
						this.props.onFinish(this.props.data, serverData);
					}
				}).catch((err: Error) => {
					console.log(err);	
				});
			} else if (pushData.push) {
				if (typeof this.props.onReceiveData !== 'undefined') {
					this.props.onReceiveData(undefined);
				}
			}
		}));
	}

	render () {
		return (
			<a
				onClick={this.handleClick}
				style={
					{
						cursor: 'pointer'
					}
				}
				className={
					classNames({
						[typeof this.props.buttonType === 'string' ? this.props.buttonType : 'primaryButton']: true,
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
