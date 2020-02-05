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
					text: 'Request login'
				}}
			>
				<Title>Request login</Title>

				{this.state.success ? (
					// Used for spacing
					<Label />
				) : null}
				{this.state.success ? (
					<TextBox>
						Login request successful. Please check the email associated with the CAP ID
						entered for an email with your CAP account.
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
					Enter your CAP ID below. Once your request is submitted, please check the email
					account associated with your CAP ID in eServices.
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
						error: error.message,
						tryingSubmit: false
					});
				},
				() => {
					this.setState({
						success: true,
						error: null,
						tryingSubmit: false
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
