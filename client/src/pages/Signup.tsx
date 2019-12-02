import React from 'react';
import ReCAPTCHAInput from '../components/form-inputs/ReCAPTCHA';
import SimpleForm, {
	Label,
	NumberInput,
	TextBox,
	TextInput,
	Title
} from '../components/forms/SimpleForm';
import { fetchFunction } from '../lib/myFetch';
import Page, { PageProps } from './Page';
import { EitherObj, api, either } from 'common-lib';

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
			recaptcha: null
		},
		error: null,
		tryingSignup: false,
		success: false
	};

	public constructor(props: PageProps) {
		super(props);

		this.signup = this.signup.bind(this);
	}

	public render() {
		return (
			<SimpleForm<SignupFormValues>
				values={this.state.form}
				onChange={form => this.setState({ form })}
				onSubmit={this.signup}
				disableOnInvalid={true}
				validator={{
					capid: id => id !== null && id >= 100000 && id <= 999999,
					email: email => !!email && !!email.match(/.*?@.*/),
					recaptcha: val => val !== null
				}}
				submitInfo={{
					disabled: this.state.tryingSignup,
					text: 'Sign up'
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
						Account request successful. Check your inbox and spam folder for a link to
						finish creating your account
					</TextBox>
				) : null}

				<Label />
				<TextBox>
					Enter your CAPID and email address as stored in eServices to register for a
					CAPUnit.com account. You will receive an email with a link to select a username
					and password and complete the account registration process. Only one CAPUnit.com
					account may be created per CAP ID.
				</TextBox>

				<Label>CAP ID number</Label>
				<NumberInput name="capid" />

				<Label>Email Address</Label>
				<TextInput name="email" />

				<ReCAPTCHAInput name="recaptcha" />
			</SimpleForm>
		);
	}

	private async signup(values: SignupFormValues) {
		try {
			// @ts-ignore
			window.grecaptcha.reset();

			const fetchResult = await fetchFunction('/api/member/account/cap/request', {
				body: JSON.stringify(values),
				headers: {
					'content-type': 'application/json'
				},
				method: 'POST'
			});

			const result: EitherObj<api.HTTPError, void> = await fetchResult.json();

			either(result).cata(
				error => {
					this.setState({
						error: error.message
					})
				},
				() => {
					this.setState({
						success: true,
						error: null
					})
				}
			)
		} catch (e) {
			this.setState({
				error: 'Could not request account',
				tryingSignup: false
			});
		}
	}
}
