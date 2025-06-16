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
import PasswordForm from '../../components/form-inputs/PasswordForm';
import SimpleForm, { Label, TextBox, TextInput, Title } from '../../components/forms/SimpleForm';
import fetchApi from '../../lib/apis';
import { getMember } from '../../lib/Members';
import Page, { PageProps } from '../Page';

interface FormValues {
	username: string;
	password: null | string;
}

interface FinishSignupState {
	form: FormValues;
	error: string | null;
	success: boolean;
	tryingFinish: boolean;
}

export default class FinishSignup extends Page<PageProps<{ token: string }>, FinishSignupState> {
	public state: FinishSignupState = {
		form: {
			password: null,
			username: '',
		},
		error: null,
		success: false,
		tryingFinish: false,
	};

	public componentDidMount(): void {
		this.props.deleteReduxState();
	}

	public render = (): JSX.Element => (
		<SimpleForm<FormValues>
			disableOnInvalid={true}
			values={this.state.form}
			onChange={form => this.setState({ form })}
			validator={{
				username: name =>
					!!name &&
					name.length > 0 &&
					name.length < 45 &&
					!name.startsWith(' ') &&
					!name.endsWith(' '),
				password: password => password !== null,
			}}
			onSubmit={this.finishAccount}
			submitInfo={{
				disabled: this.state.tryingFinish,
				text: this.state.tryingFinish ? 'Finalizing...' : 'Finish creating account',
			}}
		>
			<Title>Finish account setup</Title>

			{this.state.error !== null ? <Label /> : null}
			{this.state.error !== null ? (
				<TextBox>
					<b style={{ color: 'red' }}>{this.state.error}</b>
				</TextBox>
			) : null}

			<Label />
			<TextBox>
				Please select a user name for use in authenticating your access to Event Manager.
				<br />
				User names should be 45 characters or less. Only one user name may be associated
				with each CAPID.
				<br />
			</TextBox>

			<Label>Please choose a username</Label>
			<TextInput
				name="username"
				errorMessage="Username cannot be empty, must be between 0 and 45 characters and cannot start or end with a space"
			/>

			<PasswordForm name="password" fullWidth={true} />
		</SimpleForm>
	);

	private finishAccount = async (): Promise<void> => {
		const token = this.props.routeProps.match.params.token;
		const { username, password } = this.state.form;

		if (!password) {
			return;
		}

		this.setState({
			error: null,
			tryingFinish: true,
			success: false,
		});

		const fetchResult = await fetchApi.member.account.finishAccountSetup(
			{},
			{ token, username: username.trim(), password },
		);

		if (Either.isLeft(fetchResult)) {
			this.setState({
				tryingFinish: false,
				error: fetchResult.value.message,
			});
		} else {
			const member = await getMember();

			this.props.authorizeUser(member);
			this.props.routeProps.history.push('/admin');
		}
	};
}
