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
			captchaToken: null
		},
		error: null,
		tryingSubmit: false,
		success: false
	};

	public constructor(props: PageProps) {
		super(props);

		this.submit = this.submit.bind(this);
	}

	public render() {
		return (
			<SimpleForm<RequestPasswordResetFormValues>
				values={this.state.form}
				onChange={form => this.setState({ form })}
				onSubmit={this.submit}
				disableOnInvalid={true}
				validator={{
					captchaToken: val => val !== null,
					username: val => val?.length > 0
				}}
				submitInfo={{
					disabled: this.state.tryingSubmit,
					text: 'Request password reset'
				}}
			>
				<Title>Request password reset</Title>

				{this.state.success ? (
					// Used for spacing
					<Label />
				) : null}
				{this.state.success ? (
					<TextBox>
						Password reset request succesful. Please check your inbox for a password
						reset link.
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
					Enter your username, and if it exists an email containing a password reset link
					will be sent to the associated email address.
				</TextBox>

				<Label>Username</Label>
				<TextInput name="username" />

				<ReCAPTCHAInput name="captchaToken" />
			</SimpleForm>
		);
	}

	private async submit(form: RequestPasswordResetFormValues) {
		if (!form.captchaToken) {
			return;
		}

		// @ts-ignore
		window.grecaptcha.reset();

		this.setState({
			tryingSubmit: true,
			error: null,
			success: false
		});

		const result = await fetchApi.member.account.passwordResetRequest(
			{},
			{
				username: form.username,
				captchaToken: form.captchaToken
			}
		);

		if (Either.isLeft(result)) {
			this.setState({
				error: result.value.message,
				tryingSubmit: false
			});
		} else {
			this.setState({
				success: true,
				error: null,
				tryingSubmit: false
			});
		}
	}
}
