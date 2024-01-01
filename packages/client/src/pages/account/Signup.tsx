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
import React from 'react';
import ReCAPTCHAInput from '../../components/form-inputs/ReCAPTCHA';
import SimpleForm, {
	Label,
	NumberInput,
	TextBox,
	TextInput,
	Title,
} from '../../components/forms/SimpleForm';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

interface SignupFormValues {
	capid: number | null;
	email: string;
	recaptcha: string | null;
}

interface SignupFormState {
	form: SignupFormValues;
	error: string | null;
	tryingSignup: boolean;
	success: boolean;
}

export default class Signup extends Page<PageProps, SignupFormState> {
	public state: SignupFormState = {
		form: {
			capid: null,
			email: '',
			recaptcha: null,
		},
		error: null,
		tryingSignup: false,
		success: false,
	};

	public componentDidMount(): void {
		this.props.deleteReduxState();
	}

	public constructor(props: PageProps) {
		super(props);

		this.signup = this.signup.bind(this);
	}

	public render = (): JSX.Element => (
		<SimpleForm<SignupFormValues>
			values={this.state.form}
			onChange={form => this.setState({ form })}
			onSubmit={this.signup}
			disableOnInvalid={true}
			validator={{
				capid: id => id !== null && id >= 100000,
				email: email => !!email && !!/.*?@.*/.exec(email),
				recaptcha: val => val !== null,
			}}
			submitInfo={{
				disabled: this.state.tryingSignup,
				text: 'Sign up',
			}}
		>
			<Title>Create account</Title>

			{this.state.error !== null ? (
				// Used for spacing
				<Label />
			) : null}
			{this.state.error !== null ? (
				<TextBox>
					<b style={{ color: 'red' }}>{this.state.error}</b>
				</TextBox>
			) : null}

			{this.state.success ? (
				// Used for spacing
				<Label />
			) : null}
			{this.state.success ? (
				<TextBox>
					<div className="banner">
						Account request successful. Check your inbox and spam folder for a link to
						finish creating your account
					</div>
				</TextBox>
			) : null}

			<Label />
			<TextBox>
				Enter your CAPID and email address as stored in eServices to register for an
				Event Manager account. You will receive an email with a link to select a username and
				password and complete the account registration process. Only one Event Manager account
				may be created per CAP ID.
				{/* <br />
					If you have signed up for an account on any of Event Manager's subdomains, you can
					use that account instead of attempting to create a new Event Manager account */}
			</TextBox>

			<Label>CAP ID number</Label>
			<NumberInput name="capid" />

			<Label>Email Address</Label>
			<TextInput name="email" />

			<ReCAPTCHAInput name="recaptcha" />
		</SimpleForm>
	);

	private signup = async (values: SignupFormValues): Promise<void> => {
		try {
			if (!values.capid || !values.recaptcha) {
				return;
			}

			this.setState({
				tryingSignup: true,
				success: false,
				error: null,
			});

			window.grecaptcha.reset();

			const result = await fetchApi.member.account.capnhq.requestNHQAccount(
				{},
				{ capid: values.capid, recaptcha: values.recaptcha, email: values.email },
			);

			if (Either.isLeft(result)) {
				this.setState({
					error: result.value.message,
					tryingSignup: false,
				});
			} else {
				this.setState({
					success: true,
					error: null,
				});
			}
		} catch (e) {
			this.setState({
				error: 'Could not request account',
				tryingSignup: false,
			});
		}
	};
}
