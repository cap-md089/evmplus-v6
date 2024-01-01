/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import ReCAPTCHA from 'react-google-recaptcha';
import React, { Component } from 'react';
import { InputProps } from './Input';

export default class ReCAPTCHAInput extends Component<InputProps<string | null>> {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	private static KEY: string = process.env.REACT_APP_RECAPTCHA_KEY!;

	public state: {} = {};

	public constructor(props: InputProps<string | null>) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: null,
			});
		}
	}

	public render = (): JSX.Element => (
		<div className="input-formbox">
			<ReCAPTCHA sitekey={ReCAPTCHAInput.KEY} onChange={this.onChange} />
		</div>
	);

	private onChange = (token: string | null): void => {
		if (this.props.onChange) {
			this.props.onChange(token);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: token,
			});
		}
	};
}
