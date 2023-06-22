/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Either } from 'common-lib';
import * as React from 'react';
import PasswordForm from '../../components/form-inputs/PasswordForm';
import SimpleForm, { Label, TextBox, Title } from '../../components/forms/SimpleForm';
import fetchApi from '../../lib/apis';
import { getMember } from '../../lib/Members';
import Page, { PageProps } from '../Page';

interface FinishPasswordResetFormValues {
	newPassword: string;
}

interface FinishPasswordResetState {
	form: FinishPasswordResetFormValues;
	error: string | null;
	tryingSubmit: boolean;
	success: boolean;
}

export default class FinishPasswordResetForm extends Page<
	PageProps<{ token: string }>,
	FinishPasswordResetState
> {
	public state: FinishPasswordResetState = {
		form: {
			newPassword: '',
		},
		error: null,
		tryingSubmit: false,
		success: false,
	};

	public constructor(props: PageProps<{ token: string }>) {
		super(props);

		this.submit = this.submit.bind(this);
	}

	public componentDidMount(): void {
		this.props.deleteReduxState();
	}
		
	public render = (): JSX.Element => (
		<SimpleForm<FinishPasswordResetFormValues>
			values={this.state.form}
			onChange={form => this.setState({ form })}
			onSubmit={this.submit}
			disableOnInvalid={true}
			validator={{
				newPassword: val => val !== null,
			}}
			submitInfo={{
				disabled: this.state.tryingSubmit,
				text: 'Request password reset',
			}}
		>
			<Title>Password reset</Title>

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
			<TextBox>Enter a new password</TextBox>

			<PasswordForm name="newPassword" fullWidth={true} />
		</SimpleForm>
	);

	private submit = async (form: FinishPasswordResetFormValues): Promise<void> => {
		const { newPassword } = form;

		if (!newPassword) {
			return;
		}

		this.setState({
			tryingSubmit: true,
			error: null,
			success: false,
		});

		const fetchResult = await fetchApi.member.account.finishPasswordReset(
			{},
			{ token: this.props.routeProps.match.params.token, newPassword },
		);

		if (Either.isLeft(fetchResult)) {
			this.setState({
				tryingSubmit: false,
				error: fetchResult.value.message,
			});
		} else {
			const member = await getMember();

			this.props.authorizeUser(member);
			this.props.routeProps.history.push('/admin');
		}
	};
}
