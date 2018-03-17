import * as React from 'react';

import Form, { FormProps } from './Form';

interface RequestFormProps<T, S> extends FormProps<T> {
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
	onReceiveData?: (data?: S) => void;
	
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
	onSubmit: (data?: T) => Promise<any> | boolean | any;
}

class RequestForm<T, S> extends Form<T, RequestFormProps<T, S>> {
	// tslint:disable-next-line:no-empty
	protected submit (e: React.FormEvent<HTMLFormElement>): void {
		
	}
}

export default RequestForm;