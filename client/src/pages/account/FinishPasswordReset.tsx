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
			newPassword: ''
		},
		error: null,
		tryingSubmit: false,
		success: false
	};

	public constructor(props: PageProps<{ token: string }>) {
		super(props);

		this.submit = this.submit.bind(this);
	}

	public render() {
		return (
			<SimpleForm<FinishPasswordResetFormValues>
				values={this.state.form}
				onChange={form => this.setState({ form })}
				onSubmit={this.submit}
				disableOnInvalid={true}
				validator={{
					newPassword: val => val !== null
				}}
				submitInfo={{
					disabled: this.state.tryingSubmit,
					text: 'Request password reset'
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

				<PasswordForm name="newPassword" />
			</SimpleForm>
		);
	}

	private async submit(form: FinishPasswordResetFormValues) {
		const { newPassword } = form;

		if (!newPassword) {
			return;
		}

		this.setState({
			tryingSubmit: true,
			error: null,
			success: false
		});

		const fetchResult = await fetchApi.member.account.finishPasswordReset(
			{},
			{ token: this.props.routeProps.match.params.token, newPassword }
		);

		if (Either.isLeft(fetchResult)) {
			this.setState({
				tryingSubmit: false,
				error: fetchResult.value.message
			});
		} else {
			const member = await getMember(fetchResult.value.sessionID);

			this.props.authorizeUser(member);
			this.props.routeProps.history.push('/admin');
		}
	}
}
