import ReCAPTCHA from 'react-google-recaptcha';
import React, { Component } from 'react';
import { InputProps } from './Input';

export default class ReCAPTCHAInput extends Component<InputProps<string | null>> {
	private static KEY: string = process.env.REACT_APP_RECAPTCHA_KEY!;

	public state: {} = {};

	constructor(props: InputProps<string | null>) {
		super(props);

		this.onChange = this.onChange.bind(this);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: null
			});
		}
	}

	public render() {
		return (
			<div className="input-formbox">
				<ReCAPTCHA sitekey={ReCAPTCHAInput.KEY} onChange={this.onChange} />
			</div>
		);
	}

	private onChange(token: string | null) {
		if (this.props.onChange) {
			this.props.onChange(token);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: token
			});
		}
	}
}
