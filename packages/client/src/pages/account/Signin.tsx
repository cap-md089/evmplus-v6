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

import { always, Either, MemberCreateError, SigninTokenType } from 'common-lib';
import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router-dom';
import { AnyAction } from 'redux';
import PasswordForm from '../../components/form-inputs/PasswordForm';
import ReCAPTCHAInput from '../../components/form-inputs/ReCAPTCHA';
import SimpleForm, { Label, TextBox, TextInput, Title } from '../../components/forms/SimpleForm';
import { useAppDispatch, useAppSelector } from '../../hooks';
import fetchApi from '../../lib/apis';
import { getMember } from '../../lib/Members';
import {
	MFAFormValues,
	ResetPasswordFormValues,
	setMFAError,
	setResetError,
	setSigninError,
	SigninFormValues,
	SigninState as SigninStateR,
	startTryingMFA,
	startTryingReset,
	startTryingSignin,
	updateMFAFormValues,
	updateResetFormValues,
	updateSigninFormValues,
} from '../../state/pages/signin';
import {
	getPageId,
	getPageState,
	loadPage,
	PageState,
	signinPageAction,
	startLoadPage,
	usePageDispatch,
} from '../../state/pageState';
import { PageProps } from '../Page';
import { handleReloadFromSignin as handleReloadFromSigninAddEvent } from '../../state/pages/addevent';
import { handleReloadFromSignin as handleReloadFromSigninModifyEvent } from '../../state/pages/modifyevent';

const signinErrorMessages = {
	[MemberCreateError.NONE]: '',
	[MemberCreateError.INCORRRECT_CREDENTIALS]: 'The username and password could not be verified',
	[MemberCreateError.INVALID_SESSION_ID]: 'Invalid session',
	[MemberCreateError.PASSWORD_EXPIRED]: '',
	[MemberCreateError.ACCOUNT_USES_MFA]: '',
	[MemberCreateError.SERVER_ERROR]: 'An error occurred while trying to sign in',
	[MemberCreateError.UNKOWN_SERVER_ERROR]: 'An error occurred while trying to sign in',
	[MemberCreateError.DATABASE_ERROR]: 'An error occurred while trying to sign in',
	[MemberCreateError.RECAPTCHA_INVALID]: 'Invalid reCAPTCHA',
	[MemberCreateError.ACCOUNT_EXPIRED]: 'Your account has expired',
};

const validateNotEmpty = (val: string | null): val is string => !!val;

const validateNewPasswords = (val: string): boolean => !!val;

const defaultPageState: SigninStateR = {
	signinFormValues: {
		username: '',
		password: '',
		recaptcha: null,
	},
	resetFormValues: {
		password: '',
	},
	error: MemberCreateError.NONE,
	passwordSetResult: '',
	tryingSignin: false,
	tryingPasswordReset: false,
	mfaFormValues: {
		token: '',
	},
	mfaResult: '',
	tryingMFAToken: false,
	otherPageState: null,
};

type SigninPageProps = PageProps<{ returnurl?: string }> & { state: SigninStateR };

function go(
	dispatch: (action: AnyAction) => void,
	nextPage: PageState | null,
	routeProps: RouteComponentProps<{ returnurl?: string }>,
): void {
	const search = routeProps.location.search.replace(/\?/g, '');

	const params: { [key: string]: string } = {};

	for (const paramPair of search.split('&')) {
		params[paramPair.split('=')[0]] = decodeURIComponent(paramPair.split('=')[1]);
	}

	const returnUrl = params.returnurl || '/';

	if (returnUrl.startsWith('/api')) {
		window.open(returnUrl);
	} else if (returnUrl.startsWith('/')) {
		if (nextPage) {
			if (nextPage.page === 'addevent') {
				dispatch(
					startLoadPage({
						page: 'addevent',
						state: handleReloadFromSigninAddEvent(nextPage.state),
					}),
				);
			} else if (nextPage.page === 'modifyevent') {
				dispatch(
					startLoadPage({
						page: 'modifyevent',
						state: handleReloadFromSigninModifyEvent(nextPage.state),
					}),
				);
			} else {
				dispatch(startLoadPage(nextPage));
			}
		} else {
			dispatch(startLoadPage({ page: 'unconnected' }));
		}
		routeProps.history.push(returnUrl);
	} else {
		window.location.href = returnUrl;
	}
}

export const RegularSignin: React.FC<SigninPageProps> = ({ state, authorizeUser, routeProps }) => {
	const dispatch = usePageDispatch(signinPageAction);
	const appDispatch = useAppDispatch();

	const trySignin = async (): Promise<void> => {
		dispatch(startTryingSignin());

		if (!state.signinFormValues.recaptcha) {
			return;
		}

		const signinResults = await fetchApi
			.signin(
				{},
				{
					username: state.signinFormValues.username,
					password: state.signinFormValues.password,
					token: {
						type: SigninTokenType.RECAPTCHA,
						recaptchToken: state.signinFormValues.recaptcha,
					},
				},
			)
			.leftFlatMap(
				always(Either.right({ error: MemberCreateError.UNKOWN_SERVER_ERROR as const })),
			)
			.fullJoin();

		if (signinResults.error === MemberCreateError.NONE) {
			authorizeUser(signinResults);
			go(appDispatch, state.otherPageState, routeProps);
		} else {
			if (
				signinResults.error !== MemberCreateError.PASSWORD_EXPIRED &&
				signinResults.error !== MemberCreateError.ACCOUNT_USES_MFA
			) {
				window.grecaptcha.reset();
			}

			dispatch(setSigninError(signinResults.error));
		}
	};

	return (
		<div>
			Enter your EvMPlus.org login information below to sign in to the site. By logging into
			this site you agree to the terms and conditions located{' '}
			<Link to="/terms-and-conditions">here</Link>. Our Privacy Policy may be accessed at{' '}
			<Link to="/privacy-policy">this page</Link>.
			<br />
			<br />
			See the{' '}
			<a
				href="https://github.com/cap-md089/evmplus-guides/wiki/Establish-Account"
				target="_blank"
			>
				Operator Guide
			</a>{' '}
			for help with account access.
			<br />
			<br />
			Don&#39;t have an account with us? <Link to="/create-account">Create one here</Link>
			<br />
			Forget your username? <Link to="/usernamerequest">Request it here</Link>
			<br />
			Forget your password? <Link to="/passwordreset">Reset your password</Link>
			<br />
			<SimpleForm<SigninFormValues>
				onSubmit={trySignin}
				onChange={signinFormValues => dispatch(updateSigninFormValues(signinFormValues))}
				values={state.signinFormValues}
				validator={{
					username: validateNotEmpty,
					password: validateNotEmpty,
					recaptcha: validateNotEmpty,
				}}
				submitInfo={{
					text: 'Sign in',
					disabled: state.tryingSignin,
				}}
				disableOnInvalid={true}
			>
				<Title>Sign in</Title>

				{state.error !== MemberCreateError.NONE ? <Label /> : null}
				{state.error !== MemberCreateError.NONE ? (
					<TextBox>
						<b style={{ color: 'red' }}>{signinErrorMessages[state.error]}</b>
					</TextBox>
				) : null}

				{state.otherPageState !== null ? <Label /> : null}
				{state.otherPageState !== null ? (
					<TextBox>
						<b>
							Please sign in to continue where you were; your form inputs have been
							saved!
						</b>
					</TextBox>
				) : null}

				<Label>Username</Label>
				<TextInput name="username" />

				<Label>Password</Label>
				<TextInput name="password" password={true} />

				<ReCAPTCHAInput name="recaptcha" />
			</SimpleForm>
		</div>
	);
};

export const HandleMFAChallenge: React.FC<SigninPageProps> = ({
	state,
	authorizeUser,
	routeProps,
}) => {
	const dispatch = usePageDispatch(signinPageAction);
	const appDispatch = useAppDispatch();

	const mfaTokenInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		mfaTokenInputRef.current?.focus();
	}, []);

	const useMFAToken = async (): Promise<void> => {
		dispatch(startTryingMFA());

		const mfaTokenResult = await fetchApi.member.session.finishMFA(
			{},
			{ mfaToken: state.mfaFormValues.token },
		);

		if (Either.isLeft(mfaTokenResult)) {
			dispatch(setMFAError(mfaTokenResult.value.message));
		} else {
			if (mfaTokenResult.value === MemberCreateError.NONE) {
				const member = await getMember();

				authorizeUser(member);
				go(appDispatch, state.otherPageState, routeProps);
			} else {
				dispatch(setSigninError(MemberCreateError.PASSWORD_EXPIRED));
			}
		}
	};

	return (
		<SimpleForm<MFAFormValues>
			onSubmit={useMFAToken}
			validator={{
				token: token => token.length === 6 && !isNaN(parseInt(token, 10)),
			}}
			onChange={mfaFormValues => dispatch(updateMFAFormValues(mfaFormValues))}
			values={state.mfaFormValues}
			disableOnInvalid={true}
			submitInfo={{
				text: 'Submit challenge',
				disabled: state.tryingMFAToken,
			}}
		>
			<Title>Multi-factor challenge</Title>

			{state.mfaResult !== '' ? <Label /> : null}
			{state.mfaResult !== '' ? (
				<TextBox>
					<b>{state.mfaResult}</b>
				</TextBox>
			) : null}

			<Label>Please input a multi-factor token</Label>
			<TextInput name="token" ref={mfaTokenInputRef} showSuggestions={false} />
		</SimpleForm>
	);
};

export const HandlePasswordReset: React.FC<SigninPageProps> = ({
	state,
	authorizeUser,
	routeProps,
}) => {
	const dispatch = usePageDispatch(signinPageAction);
	const appDispatch = useAppDispatch();

	const resetPassword = async (): Promise<void> => {
		dispatch(startTryingReset());

		const resetPasswordResult = await fetchApi.member.passwordReset(
			{},
			{ password: state.resetFormValues.password },
		);

		if (Either.isLeft(resetPasswordResult)) {
			dispatch(setResetError(resetPasswordResult.value.message));
		} else {
			const member = await getMember();

			authorizeUser(member);
			go(appDispatch, state.otherPageState, routeProps);
		}
	};

	return (
		<div>
			<SimpleForm<ResetPasswordFormValues>
				onSubmit={resetPassword}
				validator={{
					password: validateNewPasswords,
				}}
				submitInfo={{
					text: 'Update password',
					disabled: state.tryingPasswordReset,
				}}
				values={state.resetFormValues}
				onChange={resetFormValues => dispatch(updateResetFormValues(resetFormValues))}
				disableOnInvalid={true}
			>
				<Title>Reset password</Title>

				<Label />
				<TextBox>Your password has expired and needs to be reset</TextBox>

				{state.passwordSetResult !== '' ? <Label /> : null}
				{state.passwordSetResult !== '' ? (
					<TextBox>
						<b>{state.passwordSetResult}</b>
					</TextBox>
				) : null}

				<PasswordForm fullWidth={true} name="password" />
			</SimpleForm>
		</div>
	);
};

export const SigninF: React.FC<PageProps<{ returnurl?: string }>> = props => {
	const dispatch = useDispatch();
	const currentPageId = useAppSelector(getPageId);
	if (currentPageId !== 'signin') {
		dispatch(loadPage({ page: 'signin', state: defaultPageState }));
	}

	const pageState = useAppSelector(getPageState);
	if (pageState.page !== 'signin') {
		return null;
	}

	const { error, otherPageState } = pageState.state;

	if (props.member) {
		go(dispatch, otherPageState, props.routeProps);
		return null;
	}

	if (
		error !== MemberCreateError.PASSWORD_EXPIRED &&
		error !== MemberCreateError.ACCOUNT_USES_MFA
	) {
		return <RegularSignin {...props} state={pageState.state} />;
	} else if (error === MemberCreateError.ACCOUNT_USES_MFA) {
		return <HandleMFAChallenge {...props} state={pageState.state} />;
	} else {
		return <HandlePasswordReset {...props} state={pageState.state} />;
	}
};
