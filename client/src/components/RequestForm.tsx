import * as React from 'react';

import myFetch from '../lib/myFetch';

import Form, { FormProps } from './Form';

interface RequestFormProps<C, S> extends FormProps<C> {
	/**
	 * URL to submit the form request to
	 */
	url: string;

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
	onReceiveData?: (data: S, fields: C) => void;
	
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
	 * @returns {Promise<boolean | any> | boolean | any} Data to control the request
	 */
	onSubmit?: (fields: C) => Promise<boolean | any> | boolean | any;
}

export default class RequestForm<C extends object, S> extends Form<C, RequestFormProps<C, S>> {
	protected submit (e: React.FormEvent<HTMLFormElement>): void {
		e.preventDefault();
		let formFields: C & {token: string} = {
			...(this.fields as any),
			token: this.token
		};
		this.setState({
			disabled: true
		});
		(new Promise<{push: boolean, data: any}> ((res, rej): void => {
			if (typeof this.props.onSubmit === 'undefined') {
				res({
					push: true,
					data: formFields
				});
				return;
			}
			let clickResolve = this.props.onSubmit(this.fields);
			if (typeof clickResolve !== 'undefined' && typeof clickResolve.then !== 'undefined') {
				clickResolve.then((data: any) => {
					if (typeof data === 'boolean') {
						res ({
							push: data,
							data: formFields
						});
					} else {
						res ({
							push: true,
							data: typeof data === 'undefined' ? formFields : data
						});
					}
				});
			} else if (typeof clickResolve === 'boolean') {
				res({
					push: clickResolve,
					data: formFields
				});
			} else {
				res({
					push: true,
					data: clickResolve
				});
			}
		}).then(pushData => {
			if (pushData.push && this.props.url) {
				myFetch(this.props.url, {
					body: JSON.stringify(pushData.data),
					method: 'POST',
					credentials: 'same-origin',
					headers: {
						'Content-type': 'application/json',
						'Authorization': this.sessionID
					}
				}).then(res => {
					return res.json();
				}).then((serverData: S) => {
					this.setState({
						disabled: false
					});
					if (typeof this.props.onReceiveData !== 'undefined') {
						this.props.onReceiveData(serverData, this.fields);
					}
				}).catch((err: Error) => {
					console.log(err);	
				});
			} else {
				this.setState({
					disabled: false
				});
			}
		}));
	}
}