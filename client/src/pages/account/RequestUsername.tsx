import { api, either } from 'common-lib';
import * as React from 'react';
import ReCAPTCHAInput from '../../components/form-inputs/ReCAPTCHA';
import SimpleForm, { Label, NumberInput, TextBox, Title } from '../../components/forms/SimpleForm';
import { fetchFunction } from '../../lib/myFetch';
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
			<SimpleForm<RequestUsernameFormValues>
				values={this.state.form}
				onChange={form => this.setState({ form })}
				onSubmit={this.submit}
				disableOnInvalid={true}
				validator={{
					captchaToken: val => val !== null,
					capid: val => val !== null
				}}
				submitInfo={{
					disabled: this.state.tryingSubmit,
					text: 'Request username'
				}}
			>
				<Title>Request username</Title>

				{this.state.success ? (
					// Used for spacing
					<Label />
				) : null}
				{this.state.success ? (
					<TextBox>
						Username request successful. If there is an account assigned to the username
						provided, please check your inbox and spam folder for an email with your
						username in it.
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
					Enter your CAPID. If there is an account associated with the CAPID provided, an
					email will be sent to the associated account email address containing your
					username.
				</TextBox>

				<Label>CAP ID</Label>
				<NumberInput name="capid" />

				<ReCAPTCHAInput name="captchaToken" />
			</SimpleForm>
		);
	}

	private async submit(form: RequestUsernameFormValues) {
		try {
			// @ts-ignore
			window.grecaptcha.reset();

			this.setState({
				tryingSubmit: true,
				error: null,
				success: false
			});

			const fetchResult = await fetchFunction('/api/member/account/capnhq/username', {
				body: JSON.stringify(form),
				headers: {
					'content-type': 'application/json'
				},
				method: 'POST'
			});

			const result: api.member.account.cap.UsernameRequest = await fetchResult.json();

			either(result).cata(
				error => {
					this.setState({
						error: error.message
					});
				},
				() => {
					this.setState({
						success: true,
						error: null
					});
				}
			);
		} catch (e) {
			this.setState({
				error: 'Could not request username',
				tryingSubmit: false
			});
		}
	}
}
