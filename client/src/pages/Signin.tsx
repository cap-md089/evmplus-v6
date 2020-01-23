import {
	MemberCreateError,
	PasswordSetResult,
	SigninReturn,
	EitherObj,
	api,
	either
} from 'common-lib';
import React from 'react';
import { Link } from 'react-router-dom';
import PasswordForm from '../components/form-inputs/PasswordForm';
import ReCAPTCHAInput from '../components/form-inputs/ReCAPTCHA';
import SimpleForm, { Label, TextBox, TextInput, Title } from '../components/forms/SimpleForm';
import APIInterface from '../lib/APIInterface';
import { getMember } from '../lib/Members';
import myFetch, { fetchFunction } from '../lib/myFetch';
import Page, { PageProps } from './Page';

interface ResetPasswordFormValues {
	password: string;
}

interface SigninFormValues {
	username: string;
	password: string;
	recaptcha: string | null;
}

interface SigninState {
	signinFormValues: SigninFormValues;
	resetFormValues: ResetPasswordFormValues;
	error: MemberCreateError;
	passwordSetResult: string;
	updatePasswordSessionID: string | null;
	tryingSignin: boolean;
	tryingPasswordReset: boolean;
}

const signinErrorMessages = {
	[MemberCreateError.NONE]: '',
	[MemberCreateError.INCORRRECT_CREDENTIALS]: 'The username and password could not be verified',
	[MemberCreateError.INVALID_SESSION_ID]: 'Invalid session',
	[MemberCreateError.PASSWORD_EXPIRED]: '',
	[MemberCreateError.SERVER_ERROR]: 'An error occurred while trying to sign in',
	[MemberCreateError.UNKOWN_SERVER_ERROR]: 'An error occurred while trying to sign in',
	[MemberCreateError.DATABASE_ERROR]: 'An error occurred while trying to sign in'
};

const validateNotEmpty = (val: string | null) => !!val;

const validateNewPasswords = (val: string, others: ResetPasswordFormValues) => !!val;

export default class Signin extends Page<PageProps<{ returnurl?: string }>, SigninState> {
	public state: SigninState = {
		signinFormValues: {
			username: '',
			password: '',
			recaptcha: null
		},
		resetFormValues: {
			password: ''
		},
		error: MemberCreateError.NONE,
		passwordSetResult: '',
		updatePasswordSessionID: null,
		tryingSignin: false,
		tryingPasswordReset: false
	};

	private get returnUrl(): string {
		const search = this.props.routeProps.location.search.replace(/\?/g, '');

		const params: { [key: string]: string } = {};

		for (const paramPair of search.split('&')) {
			params[paramPair.split('=')[0]] = decodeURIComponent(paramPair.split('=')[1]);
		}

		return params.returnurl || '/';
	}

	public constructor(props: PageProps) {
		super(props);

		this.trySignin = this.trySignin.bind(this);
		this.resetPassword = this.resetPassword.bind(this);
	}

	public render() {
		return this.state.error !== MemberCreateError.PASSWORD_EXPIRED ? (
			<div>
				Enter your CAPUnit.com login information below to sign in to the site. By logging
				into this site you agree to the terms and conditions located{' '}
				<Link to="/terms-and-conditions">here</Link>. Our Privacy Policy may be accessed at{' '}
				<Link to="/privacy-policy">this page</Link>.
				<br />
				<br />
				Don't have an account with us? <Link to="/create-account">Create one here</Link>
				<br />
				<SimpleForm<SigninFormValues>
					onSubmit={this.trySignin}
					onChange={signinFormValues => this.setState({ signinFormValues })}
					values={this.state.signinFormValues}
					validator={{
						username: validateNotEmpty,
						password: validateNotEmpty,
						recaptcha: validateNotEmpty
					}}
					submitInfo={{
						text: 'Sign in',
						disabled: this.state.tryingSignin
					}}
					disableOnInvalid={true}
				>
					<Title>Sign in</Title>

					{this.state.error !== MemberCreateError.NONE ? <Label /> : null}
					{this.state.error !== MemberCreateError.NONE ? (
						<TextBox>
							<b style={{ color: 'red' }}>{signinErrorMessages[this.state.error]}</b>
						</TextBox>
					) : null}

					<Label>Username</Label>
					<TextInput name="username" />

					<Label>Password</Label>
					<TextInput name="password" password={true} />

					<ReCAPTCHAInput name="recaptcha" />
				</SimpleForm>
			</div>
		) : (
			<div>
				<SimpleForm<ResetPasswordFormValues>
					onSubmit={this.resetPassword}
					validator={{
						password: validateNewPasswords
					}}
					submitInfo={{
						text: 'Update password',
						disabled: this.state.tryingPasswordReset
					}}
					values={this.state.resetFormValues}
					onChange={resetFormValues => this.setState({ resetFormValues })}
					disableOnInvalid={true}
				>
					<Title>Reset password</Title>

					<Label />
					<TextBox>Your password has expired and needs to be reset</TextBox>

					{this.state.passwordSetResult !== '' ? <Label /> : null}
					{this.state.passwordSetResult !== '' ? (
						<TextBox>{this.state.passwordSetResult}</TextBox>
					) : null}

					<PasswordForm name="password" />
				</SimpleForm>
			</div>
		);
	}

	private async trySignin() {
		this.setState({
			tryingSignin: true
		});

		try {
			const fetchResult = await fetchFunction('/api/signin', {
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify(this.state.signinFormValues),
				method: 'POST'
			});

			const signinResults: SigninReturn = await fetchResult.json();

			if (signinResults.error === MemberCreateError.NONE) {
				this.props.authorizeUser(signinResults);
				this.props.routeProps.history.push(this.returnUrl);
			} else if (signinResults.error === MemberCreateError.PASSWORD_EXPIRED) {
				this.setState({
					error: signinResults.error,
					tryingSignin: false,
					updatePasswordSessionID: signinResults.sessionID
				});
			} else {
				// @ts-ignore
				window.grecaptcha.reset();
				this.setState({
					error: signinResults.error,
					tryingSignin: false
				});
			}
		} catch (e) {
			// @ts-ignore
			window.grecaptcha.reset();
			this.setState({
				error: MemberCreateError.UNKOWN_SERVER_ERROR,
				tryingSignin: false
			});
		}
	}

	private async resetPassword() {
		this.setState({
			tryingPasswordReset: true
		});

		const token = await APIInterface.getTokenForSession(
			this.props.account.id,
			this.state.updatePasswordSessionID!
		);
		const fetchResult = await myFetch('/api/member/passwordreset', {
			headers: {
				'authorization': this.state.updatePasswordSessionID!,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				password: this.state.resetFormValues.password,
				token
			}),
			method: 'POST'
		});
		const eith: EitherObj<api.HTTPError, PasswordSetResult> = await fetchResult.json();

		either(eith)
			.cata(
				async e => {
					this.setState({
						passwordSetResult: e.message,
						tryingPasswordReset: false
					});
				},
				async () => {
					const member = await getMember(this.state.updatePasswordSessionID!);

					if (member) {
						this.props.authorizeUser(member);
						this.props.routeProps.history.push(this.returnUrl);
					}
				}
			)
			.catch(() => {
				this.setState({
					passwordSetResult: 'There was an error connecting to the server',
					tryingPasswordReset: false
				});
			});
	}
}
