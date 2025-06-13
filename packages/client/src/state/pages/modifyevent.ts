import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { FullTeamObject, Member, RawResolvedEventObject } from 'common-lib';
import {
	NewEventFormValues,
	convertToFormValues,
} from '../../components/forms/usable-forms/EventForm';

export interface ModifyEventState {
	saving: boolean;
	data: ModifyEventLoadingState | ModifyEventLoadedState | ModifyEventErrorState;
}

export interface ModifyEventLoadingState {
	state: 'LOADING';
}

export interface ModifyEventErrorState {
	state: 'ERROR';

	message: string;
}

export interface ModifyEventLoadedState {
	state: 'LOADED';

	event: RawResolvedEventObject;
	eventFormValues: NewEventFormValues;
	memberList: Member[];
	teamList: FullTeamObject[];
}

const initialState: ModifyEventState = {
	data: { state: 'LOADING' },
	saving: false,
};

export const modifyEventSlice = createSlice({
	name: 'addevent',
	initialState,
	reducers: {
		setErrorInfo(state, action: PayloadAction<string>) {
			state.data = {
				state: 'ERROR',
				message: action.payload,
			};
		},
		setLoadedInformation(
			state,
			action: PayloadAction<[RawResolvedEventObject, Member[], FullTeamObject[]]>,
		) {
			const [event, memberList, teamList] = action.payload;
			state.data = {
				state: 'LOADED',
				event,
				eventFormValues: convertToFormValues(event),
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
				eventFormValues: action.payload,
				memberList: state.data.memberList,
				teamList: state.data.teamList,
				event: state.data.event,
			};
		},
		startSaving(state) {
			state.saving = true;
		},
	},
});

export const { setErrorInfo, setLoadedInformation, updateFormValues, startSaving } =
	modifyEventSlice.actions;
export default modifyEventSlice.reducer;

export const handleReloadFromSignin = (state: ModifyEventState): ModifyEventState => ({
	...state,
	saving: false,
});
