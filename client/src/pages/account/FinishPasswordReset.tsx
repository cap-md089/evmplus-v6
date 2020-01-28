import { api, either } from 'common-lib';
import * as React from 'react';
import SimpleForm, { Label, TextBox, Title } from '../../components/forms/SimpleForm';
import { fetchFunction } from '../../lib/myFetch';
import Page, { PageProps } from '../Page';
import PasswordForm from '../../components/form-inputs/PasswordForm';
import { getMember } from '../../lib/Members';

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
		try {
			this.setState({
				tryingSubmit: true,
				error: null,
				success: false
			});

			const fetchResult = await fetchFunction(
				'/api/member/account/capnhq/finishpasswordreset',
				{
					body: JSON.stringify({
						...form,
						token: this.props.routeProps.match.params.token
					}),
					headers: {
						'content-type': 'application/json'
					},
					method: 'POST'
				}
			);

			const result: api.member.account.cap.FinishPasswordReset = await fetchResult.json();

			either(result).cata(
				e => {
					this.setState({
						tryingSubmit: false,
						error: e.message
					});
				},
				async ({ sessionID }) => {
					const member = await getMember(sessionID);

					this.props.authorizeUser(member);
					this.props.routeProps.history.push('/admin');
				}
			);
		} catch (e) {
			this.setState({
				error: 'Could not reset password',
				tryingSubmit: false
			});
		}
	}
}
