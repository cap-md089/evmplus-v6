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

import { Either } from 'common-lib';
import * as React from 'react';
import ReCAPTCHAInput from '../../components/form-inputs/ReCAPTCHA';
import SimpleForm, { Label, NumberInput, TextBox, Title } from '../../components/forms/SimpleForm';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

interface RequestUsernameFormValues {
	capid: number | null;
	captchaToken: string | null;
}

interface RequestUsernameState {
	form: RequestUsernameFormValues;
	error: string | null;
	tryingSubmit: boolean;
	success: boolean;
}

export default class RequestUsernameForm extends Page<PageProps, RequestUsernameState> {
	public state: RequestUsernameState = {
		form: {
			capid: null,
			captchaToken: null,
		},
		error: null,
		tryingSubmit: false,
		success: false,
	};

	public constructor(props: PageProps) {
		super(props);

		this.submit = this.submit.bind(this);
	}

	public componentDidMount(): void {
		this.props.deleteReduxState();
	}

	public render = (): JSX.Element => (
		<SimpleForm<RequestUsernameFormValues>
			values={this.state.form}
			onChange={form => this.setState({ form })}
			onSubmit={this.submit}
			disableOnInvalid={true}
			validator={{
				captchaToken: val => val !== null,
				capid: val => val !== null && val >= 100000,
			}}
			submitInfo={{
				disabled: this.state.tryingSubmit || this.state.success,
				text: 'Request login',
			}}
		>
			<Title>Request login</Title>

			{this.state.success ? (
				// Used for spacing
				<Label />
			) : null}
			{this.state.success ? (
				<TextBox>
					<div className="banner">
						<p>
							Login request successful. Please check the email associated with the CAP
							ID entered for an email with your CAP account. This email may take up to
							5 minutes to appear in your inbox.
						</p>
						<p>
							If the email is not received in your inbox, please check your Spam or
							Junk folder for the message
						</p>
					</div>
				</TextBox>
			) : null}

			{this.state.error !== null ? (
				// Used for spacing
				<Label />
			) : null}
			{this.state.error !== null ? (
				<TextBox>
					<b style={{ color: 'red' }}>{this.state.error}</b>
				</TextBox>
			) : null}

			<Label />
			<TextBox>
				<p>
					Enter your CAP ID below. Once your request is submitted, please check the email
					account associated with your CAP ID in eServices.
				</p>
				<p>
					If the email is not received in your inbox, please check your Spam or Junk
					folder for the message
				</p>
			</TextBox>

			<Label>CAP ID</Label>
			<NumberInput name="capid" />

			<ReCAPTCHAInput name="captchaToken" />
		</SimpleForm>
	);

	private submit = async (form: RequestUsernameFormValues): Promise<void> => {
		if (!form.capid || !form.captchaToken) {
			return;
		}

		window.grecaptcha.reset();

		this.setState({
			tryingSubmit: true,
			error: null,
			success: false,
		});

		const result = await fetchApi.member.account.capnhq.usernameRequest(
			{},
			{ capid: form.capid, captchaToken: form.captchaToken },
		);

		if (Either.isLeft(result)) {
			this.setState({
				tryingSubmit: false,
				error: result.value.message,
			});
		} else {
			this.setState({
				success: true,
				error: null,
				tryingSubmit: false,
			});
		}
	};
}
