import { FullTeamObject, Member } from 'common-lib';
import {
	NewEventFormValues,
	emptyEventFormValues,
} from '../../components/forms/usable-forms/EventForm';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AddEventState {
	saving: boolean;
	data: AddEventLoadingState | AddEventLoadedState | AddEventErrorState;
}

export interface AddEventLoadingState {
	state: 'LOADING';
}

export interface AddEventErrorState {
	state: 'ERROR';

	message: string;
}

export interface AddEventLoadedState {
	state: 'LOADED';

	event: NewEventFormValues;
	memberList: Member[];
	teamList: FullTeamObject[];
}

const initialState: AddEventState = {
	data: { state: 'LOADING' },
	saving: false,
};

export const addEventSlice = createSlice({
	name: 'addevent',
	initialState,
	reducers: {
		setErrorInfo(state, action: PayloadAction<string>) {
			state.data = {
				state: 'ERROR',
				message: action.payload,
			};
		},
		setLoadedInformation(state, action: PayloadAction<[Member[], FullTeamObject[]]>) {
			const [memberList, teamList] = action.payload;
			state.data = {
				state: 'LOADED',
				event: emptyEventFormValues(),
				memberList,
				teamList,
			};
		},
		updateFormValues(state, action: PayloadAction<NewEventFormValues>) {
			if (state.data.state !== 'LOADED') {
				return;
			}

			state.data = {
				state: 'LOADED',
				event: action.payload,
				memberList: state.data.memberList,
				teamList: state.data.teamList,
			};
		},
		startSaving(state) {
			state.saving = true;
		},
	},
});

export const { setErrorInfo, setLoadedInformation, updateFormValues, startSaving } =
	addEventSlice.actions;
export default addEventSlice.reducer;

export const handleReloadFromSignin = (state: AddEventState): AddEventState => ({
	...state,
	saving: false,
});
