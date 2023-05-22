import { createSlice, createAction } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { MemberCreateError } from 'common-lib';
import type { PageState } from '../pageState';
import { AppDispatch } from '../../store';
import { RouteComponentProps } from 'react-router-dom';

export const prepareEmergencySignin = createAction('pagestate/prepareemergencysignin');

export interface ResetPasswordFormValues {
	password: string;
}

export interface SigninFormValues {
	username: string;
	password: string;
	recaptcha: string | null;
}

export interface MFAFormValues {
	token: string;
}

export interface SigninState {
	signinFormValues: SigninFormValues;
	resetFormValues: ResetPasswordFormValues;
	mfaFormValues: MFAFormValues;
	error: MemberCreateError;
	passwordSetResult: string;
	mfaResult: string;
	tryingSignin: boolean;
	tryingPasswordReset: boolean;
	tryingMFAToken: boolean;
	otherPageState: PageState | null;
}

const initialState: SigninState = {
	signinFormValues: {
		password: '',
		recaptcha: null,
		username: '',
	},
	resetFormValues: {
		password: '',
	},
	mfaFormValues: {
		token: '',
	},
	error: MemberCreateError.NONE,
	passwordSetResult: '',
	tryingSignin: false,
	mfaResult: '',
	tryingPasswordReset: false,
	tryingMFAToken: false,
	otherPageState: null,
};

export const pageSlice = createSlice({
	name: 'signin',
	initialState,
	reducers: {
		updateSigninFormValues(state, action: PayloadAction<SigninFormValues>) {
			state.signinFormValues = action.payload;
		},
		updateResetFormValues(state, action: PayloadAction<ResetPasswordFormValues>) {
			state.resetFormValues = action.payload;
		},
		updateMFAFormValues(state, action: PayloadAction<MFAFormValues>) {
			state.mfaFormValues = action.payload;
		},
		startTryingSignin(state) {
			state.tryingSignin = true;
			state.error = MemberCreateError.NONE;
		},
		startTryingMFA(state) {
			state.tryingMFAToken = true;
		},
		startTryingReset(state) {
			state.tryingPasswordReset = true;
		},
		setSigninError(state, action: PayloadAction<MemberCreateError>) {
			state.tryingMFAToken = false;
			state.tryingSignin = false;
			state.tryingPasswordReset = false;
			state.error = action.payload;
		},
		setMFAError(state, action: PayloadAction<string>) {
			state.tryingMFAToken = false;
			state.mfaResult = action.payload;
		},
		setResetError(state, action: PayloadAction<string>) {
			state.tryingPasswordReset = false;
			state.passwordSetResult = action.payload;
		},
	},
});

export const goToSignin = (
	dispatch: AppDispatch,
	routeProps: RouteComponentProps,
	returnUrl?: string,
): void => {
	dispatch(prepareEmergencySignin());
	returnUrl ??= window.location.pathname;
	routeProps.history.push('/signin?returnurl=' + encodeURIComponent(returnUrl));
};

export const {
	updateMFAFormValues,
	updateResetFormValues,
	updateSigninFormValues,
	startTryingSignin,
	startTryingMFA,
	startTryingReset,
	setSigninError,
	setMFAError,
	setResetError,
} = pageSlice.actions;
export default pageSlice.reducer;
