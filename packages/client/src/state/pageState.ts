import type { PayloadAction } from '@reduxjs/toolkit';
import { createAction, createSlice, PayloadActionCreator } from '@reduxjs/toolkit';
import { MemberCreateError } from 'common-lib';
import { useDispatch } from 'react-redux';
import type { AnyAction } from 'redux';
import signinReducer, { SigninState } from './pages/signin';
import addEventReducer, { AddEventState } from './pages/addevent';
import type { RootState } from '../store';
import modifyEventReducer, { ModifyEventState } from './pages/modifyevent';

export interface UnconnectedPageState {
	page: 'unconnected';
}

export interface AddEventPageSuperState {
	page: 'addevent';
	state: AddEventState;
}
export const addEventPageAction = createAction<PayloadAction>('pagestate/addeventpageaction');

export interface ModifyEventPageSuperState {
	page: 'modifyevent';
	state: ModifyEventState;
}
export const modifyEventPageAction = createAction<PayloadAction>('pagestate/modifyeventpageaction');

export interface SigninPageSuperState {
	page: 'signin';
	state: SigninState;
}
export const signinPageAction = createAction<PayloadAction>('pagestate/signinpageaction');
export const prepareEmergencySignin = createAction('pagestate/prepareemergencysignin');

export type PageState =
	| UnconnectedPageState
	| AddEventPageSuperState
	| ModifyEventPageSuperState
	| SigninPageSuperState;

interface PageSuperState {
	// current state to render, and once a loadPage action comes in
	// potentially replaced with nextState
	state: PageState;
	nextState: PageState | null;
}

const initialState: PageSuperState = {
	nextState: null,
	state: { page: 'unconnected' },
};

export const pageSlice = createSlice({
	name: 'pagestate',
	initialState,
	reducers: {
		startLoadPage(state, action: PayloadAction<PageState>) {
			state.nextState = action.payload;
		},
		loadPage(state, action: PayloadAction<PageState>) {
			if (state.nextState?.page === action.payload.page) {
				if (state.nextState !== null) {
					state.state = state.nextState;
					state.nextState = null;
				}
			} else {
				state.state = action.payload;
			}
		},
	},
	extraReducers(builder) {
		builder
			.addCase(prepareEmergencySignin, state => {
				state.nextState = {
					page: 'signin',
					state: {
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
						otherPageState: state.state,
					},
				};
			})
			.addCase(signinPageAction, (state, action) => {
				if (state.state.page === 'signin') {
					signinReducer(state.state.state, action.payload);
				}
			})
			.addCase(addEventPageAction, (state, action) => {
				if (state.state.page === 'addevent') {
					addEventReducer(state.state.state, action.payload);
				}
			})
			.addCase(modifyEventPageAction, (state, action) => {
				if (state.state.page === 'modifyevent') {
					modifyEventReducer(state.state.state, action.payload);
				}
			});
	},
});

export const { startLoadPage, loadPage } = pageSlice.actions;
export default pageSlice.reducer;

export type PageDispatch = (action: AnyAction) => void;

export const usePageDispatch = (pageAction: PayloadActionCreator<any, any>): PageDispatch => {
	const dispatch = useDispatch();

	return action => {
		dispatch(pageAction(action));
	};
};

export const getPageState = (state: RootState): PageState => state.page.state;
export const getPageId = (state: RootState): PageState['page'] => state.page.state.page;
