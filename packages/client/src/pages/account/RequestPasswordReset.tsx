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
import SimpleForm, { Label, TextBox, TextInput, Title } from '../../components/forms/SimpleForm';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

interface RequestPasswordResetFormValues {
	username: string;
	captchaToken: string | null;
}

interface RequestPasswordResetState {
	form: RequestPasswordResetFormValues;
	error: string | null;
	tryingSubmit: boolean;
	success: boolean;
}

export default class RequestPasswordResetForm extends Page<PageProps, RequestPasswordResetState> {
	public state: RequestPasswordResetState = {
		form: {
			username: '',
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
		<SimpleForm<RequestPasswordResetFormValues>
			values={this.state.form}
			onChange={form => this.setState({ form })}
			onSubmit={this.submit}
			disableOnInvalid={true}
			validator={{
				captchaToken: val => val !== null,
				username: val => val?.length > 0,
			}}
			submitInfo={{
				disabled: this.state.tryingSubmit,
				text: 'Request password reset',
			}}
		>
			<Title>Request password reset</Title>

			{this.state.success ? (
				// Used for spacing
				<Label />
			) : null}
			{this.state.success ? (
				<TextBox>
					<p>
						Password reset request succesful. Please check your inbox for a password
						reset link.
					</p>
					<p>
						If the email is not received in your inbox, please check your Spam or Junk
						folder for the message
					</p>
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
					Enter your username, and if it exists an email containing a password reset link
					will be sent to the associated email address.
				</p>
				<p>
					If the email is not received in your inbox, please check your Spam or Junk
					folder for the message
				</p>
			</TextBox>

			<Label>Username</Label>
			<TextInput name="username" />

			<ReCAPTCHAInput name="captchaToken" />
		</SimpleForm>
	);

	private submit = async (form: RequestPasswordResetFormValues): Promise<void> => {
		if (!form.captchaToken) {
			return;
		}

		window.grecaptcha.reset();

		this.setState({
			tryingSubmit: true,
			error: null,
			success: false,
		});

		const result = await fetchApi.member.account.passwordResetRequest(
			{},
			{
				username: form.username,
				captchaToken: form.captchaToken,
			},
		);

		if (Either.isLeft(result)) {
			this.setState({
				error: result.value.message,
				tryingSubmit: false,
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
