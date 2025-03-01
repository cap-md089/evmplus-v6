/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	always,
	api,
	CAPMemberContact,
	CAPMemberContactPriority,
	CAPMemberContactType,
	ClientUser,
	dutyPositions,
	Either,
	EitherObj,
	getFullMemberName,
	hasPermission,
	HTTPError,
	identity,
	isRioux,
	Maybe,
	NHQ,
	pipe,
	ShortNHQDutyPosition,
	stringifyMemberReference
} from 'common-lib';
import React, { ReactElement, useCallback } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { applyMiddleware, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware, StateObservable } from 'redux-observable';
import {
	debounceTime,
	filter,
	from,
	map,
	mapTo,
	merge,
	mergeMap,
	Observable,
	of,
	OperatorFunction,
} from 'rxjs';
import Button from '../../../components/Button';
import Dialogue, { DialogueButtons } from '../../../components/dialogues/Dialogue';
import Checkbox from '../../../components/form-inputs/Checkbox';
import LaxAutocomplete from '../../../components/form-inputs/LaxAutocomplete';
import Loader from '../../../components/Loader';
import { FetchAPIProps, withFetchApi } from '../../../globals';
import { TFetchAPI } from '../../../lib/apis';
import { PageProps } from '../../Page';
import { MemberSearchResult } from 'common-lib/dist/typings/apis/member';

interface MemberSearchStateLoaded {
	state: 'LOADED';

	members: api.member.MemberSearchResult[];
}

interface MemberSearchStateLoading {
	state: 'LOADING';
}

interface MemberSearchStateError {
	state: 'ERROR';

	message: string;
}

interface MemberSearchUIState {
	firstNameInput: string;
	lastNameInput: string;
	unitNameInput: string;
	dutyNameInput: string;
	includeAssts: boolean;
	dialogueOpen: boolean;
	inputHasBeenEntered: boolean;
	memberViewed: api.member.MemberSearchResult | null;
}

type MemberSearchState = (
	| MemberSearchStateLoaded
	| MemberSearchStateLoading
	| MemberSearchStateError
) &
	MemberSearchUIState;

interface MemberSearchResultsLoadedAction {
	type: 'RESULTS_LOADED';

	payload: EitherObj<HTTPError, api.member.MemberSearchResult[]>;
}

interface MemberSearchStartLoadingAction {
	type: 'START_LOADING';
}

interface MemberSearchFirstNameSearchInputAction {
	type: 'FIRST_NAME_SEARCH_UPDATE';

	payload: string;
}

interface MemberSearchLastNameSearchInputAction {
	type: 'LAST_NAME_SEARCH_UPDATE';

	payload: string;
}

interface MemberSearchUnitNameSearchInputAction {
	type: 'UNIT_NAME_SEARCH_UPDATE';

	payload: string;
}

interface MemberSearchDutyNameSearchInputAction {
	type: 'DUTY_NAME_SEARCH_UPDATE';

	payload: string;
}

interface MemberSearchOpenUIAction {
	type: 'OPEN_UI';
}

interface MemberSearchCloseUIAction {
	type: 'CLOSE_UI';
}

interface MemberSearchSelectMemberAction {
	type: 'SELECT_MEMBER';
	payload: api.member.MemberSearchResult;
}

interface MemberSearchClearMembersAction {
	type: 'CLEAR_MEMBERS';
}

interface MemberSearchToggleIncludeAssistants {
	type: 'TOGGLE_INCLUDE_ASSISTANTS';
}

type MemberSearchActions =
	| MemberSearchResultsLoadedAction
	| MemberSearchStartLoadingAction
	| MemberSearchFirstNameSearchInputAction
	| MemberSearchLastNameSearchInputAction
	| MemberSearchUnitNameSearchInputAction
	| MemberSearchDutyNameSearchInputAction
	| MemberSearchOpenUIAction
	| MemberSearchCloseUIAction
	| MemberSearchSelectMemberAction
	| MemberSearchClearMembersAction
	| MemberSearchToggleIncludeAssistants;

const updateFirstName = (payload: string): MemberSearchActions => ({
	type: 'FIRST_NAME_SEARCH_UPDATE',
	payload,
});

const updateLastName = (payload: string): MemberSearchActions => ({
	type: 'LAST_NAME_SEARCH_UPDATE',
	payload,
});

const updateUnitName = (payload: string): MemberSearchActions => ({
	type: 'UNIT_NAME_SEARCH_UPDATE',
	payload,
});

const updateDutyName = (payload: string): MemberSearchActions => ({
	type: 'DUTY_NAME_SEARCH_UPDATE',
	payload,
});

const startLoading = (): MemberSearchActions => ({
	type: 'START_LOADING',
});

const closeDialogue = (): MemberSearchActions => ({
	type: 'CLOSE_UI',
});

const openDialogue = (): MemberSearchActions => ({
	type: 'OPEN_UI',
});

const selectMember = (payload: api.member.MemberSearchResult): MemberSearchActions => ({
	type: 'SELECT_MEMBER',
	payload,
});

const finishLoadingMembers = (
	payload: EitherObj<HTTPError, api.member.MemberSearchResult[]>,
): MemberSearchActions => ({
	type: 'RESULTS_LOADED',
	payload,
});

const clearMembers = (): MemberSearchActions => ({
	type: 'CLEAR_MEMBERS',
});

const toggleIncludeAssistants = (): MemberSearchToggleIncludeAssistants => ({
	type: 'TOGGLE_INCLUDE_ASSISTANTS',
});

export function configureStore(fetchApi: TFetchAPI): Store<MemberSearchState, MemberSearchActions> {
	const defaultState: MemberSearchState = {
		state: 'LOADED',
		members: [],
		firstNameInput: '',
		lastNameInput: '',
		unitNameInput: '',
		dutyNameInput: '',
		includeAssts: true,
		dialogueOpen: false,
		inputHasBeenEntered: false,
		memberViewed: null,
	};

	const reducer = (
		state: MemberSearchState = defaultState,
		action: MemberSearchActions,
	): MemberSearchState => {
		switch (action.type) {
			case 'RESULTS_LOADED':
				if (Either.isLeft(action.payload)) {
					return {
						...state,

						state: 'ERROR',
						message: action.payload.value.message,
					};
				} else {
					return {
						...state,

						state: 'LOADED',
						members: action.payload.value,
					};
				}

			case 'FIRST_NAME_SEARCH_UPDATE':
				return {
					...state,

					firstNameInput: action.payload,
				};

			case 'LAST_NAME_SEARCH_UPDATE':
				return {
					...state,

					lastNameInput: action.payload,
				};

			case 'UNIT_NAME_SEARCH_UPDATE':
				return {
					...state,

					unitNameInput: action.payload,
				};

			case 'DUTY_NAME_SEARCH_UPDATE':
				return {
					...state,

					dutyNameInput: action.payload,
				};

			case 'START_LOADING':
				return {
					...state,

					state: 'LOADING',
				};

			case 'CLOSE_UI':
				return {
					...state,
					dialogueOpen: false,
				};

			case 'OPEN_UI':
				return {
					...state,
					dialogueOpen: true,
				};

			case 'SELECT_MEMBER':
				return {
					...state,
					memberViewed: action.payload,
				};

			case 'CLEAR_MEMBERS':
				return {
					...state,

					state: 'LOADED',
					members: [],
				};

			case 'TOGGLE_INCLUDE_ASSISTANTS':
				return {
					...state,

					includeAssts: !state.includeAssts,
				};

			default:
				return state;
		}
	};

	const validSearchActions = (
		state$: StateObservable<MemberSearchState>,
	): OperatorFunction<
		MemberSearchActions,
		| MemberSearchFirstNameSearchInputAction
		| MemberSearchLastNameSearchInputAction
		| MemberSearchUnitNameSearchInputAction
		| MemberSearchDutyNameSearchInputAction
		| MemberSearchToggleIncludeAssistants
	> =>
		filter<
			MemberSearchActions,
			| MemberSearchFirstNameSearchInputAction
			| MemberSearchLastNameSearchInputAction
			| MemberSearchUnitNameSearchInputAction
			| MemberSearchDutyNameSearchInputAction
			| MemberSearchToggleIncludeAssistants
		>(
			(
				action,
			): action is
				| MemberSearchFirstNameSearchInputAction
				| MemberSearchLastNameSearchInputAction
				| MemberSearchUnitNameSearchInputAction
				| MemberSearchDutyNameSearchInputAction
				| MemberSearchToggleIncludeAssistants =>
				(action.type === 'FIRST_NAME_SEARCH_UPDATE' &&
					state$.value.unitNameInput.length +
					state$.value.lastNameInput.length +
					state$.value.dutyNameInput.length +
					action.payload.length >=
					3) ||
				(action.type === 'LAST_NAME_SEARCH_UPDATE' &&
					state$.value.unitNameInput.length +
					state$.value.firstNameInput.length +
					state$.value.dutyNameInput.length +
					action.payload.length >=
					3) ||
				(action.type === 'UNIT_NAME_SEARCH_UPDATE' &&
					state$.value.firstNameInput.length +
					state$.value.lastNameInput.length +
					state$.value.dutyNameInput.length +
					action.payload.length >=
					3) ||
				(action.type === 'DUTY_NAME_SEARCH_UPDATE' &&
					state$.value.firstNameInput.length +
					state$.value.lastNameInput.length +
					state$.value.unitNameInput.length +
					action.payload.length >=
					3) ||
				action.type === 'TOGGLE_INCLUDE_ASSISTANTS',
		);

	const loadSearchEpic = (
		action$: Observable<MemberSearchActions>,
		state$: StateObservable<MemberSearchState>,
	): Observable<MemberSearchActions> =>
		action$.pipe(
			validSearchActions(state$),
			debounceTime(500),
			mergeMap(() =>
				merge(
					of(startLoading()),
					from(
						fetchApi.member.memberSearch(
							{
								unitName: encodeURIComponent(state$.value.unitNameInput || '%'),
								firstName: encodeURIComponent(state$.value.firstNameInput || '%'),
								lastName: encodeURIComponent(state$.value.lastNameInput || '%'),
								dutyName: encodeURIComponent(state$.value.dutyNameInput || '%'),
								includeAssts: state$.value.includeAssts ? 'true' : 'false',
							},
							{},
						),
					).pipe(map(finishLoadingMembers)),
				),
			),
		);

	const handleInvalidSearchesEpic = (
		action$: Observable<MemberSearchActions>,
		state$: StateObservable<MemberSearchState>,
	): Observable<MemberSearchActions> =>
		action$.pipe(
			filter(
				(
					action,
				): action is
					| MemberSearchFirstNameSearchInputAction
					| MemberSearchLastNameSearchInputAction
					| MemberSearchUnitNameSearchInputAction
					| MemberSearchDutyNameSearchInputAction =>
					(action.type === 'FIRST_NAME_SEARCH_UPDATE' &&
						state$.value.unitNameInput.length +
						state$.value.lastNameInput.length +
						state$.value.dutyNameInput.length +
						action.payload.length <
						3) ||
					(action.type === 'LAST_NAME_SEARCH_UPDATE' &&
						state$.value.unitNameInput.length +
						state$.value.firstNameInput.length +
						state$.value.dutyNameInput.length +
						action.payload.length <
						3) ||
					(action.type === 'UNIT_NAME_SEARCH_UPDATE' &&
						state$.value.firstNameInput.length +
						state$.value.lastNameInput.length +
						state$.value.dutyNameInput.length +
						action.payload.length <
						3) ||
					(action.type === 'DUTY_NAME_SEARCH_UPDATE' &&
						state$.value.firstNameInput.length +
						state$.value.lastNameInput.length +
						state$.value.unitNameInput.length +
						action.payload.length <
						3),
			),
			mapTo(clearMembers()),
		);
	const epics = combineEpics<MemberSearchActions, MemberSearchActions, MemberSearchState>(
		loadSearchEpic,
		handleInvalidSearchesEpic,
	);

	const epicMiddleware = createEpicMiddleware<
		MemberSearchActions,
		MemberSearchActions,
		MemberSearchState
	>();

	const store = createStore(reducer, applyMiddleware(epicMiddleware));

	epicMiddleware.run(epics);

	return store;
}

export const shouldRenderMemberSearchWidget = ({ member }: PageProps): boolean =>
	!!member && ((member.seniorMember && member.dutyPositions.length > 0) || isRioux(member)
		|| hasPermission('MemberSearch')(Permissions.MemberSearch.YES)(props.member));

export interface RequiredMember extends PageProps, FetchAPIProps {
	member: ClientUser;
}

const MemberSearchFirstNameFilter = React.memo(
	(): ReactElement => {
		const dispatch = useDispatch();

		const setFirstName = useCallback(name => dispatch(updateFirstName(name)), [dispatch]);

		const firstName = useSelector<MemberSearchState, string>(state => state.firstNameInput);

		return (
			<div className="input-formbox" key="lastName-formbox">
				<input
					type="text"
					value={firstName}
					onChange={e => setFirstName(e.target.value)}
					key="lastName-input"
					name="lastName"
				/>
			</div>
		);
	},
);

const MemberSearchLastNameFilter = React.memo(
	(): ReactElement => {
		const dispatch = useDispatch();

		const setLastName = useCallback(name => dispatch(updateLastName(name)), [dispatch]);

		const lastName = useSelector<MemberSearchState, string>(state => state.lastNameInput);

		return (
			<div className="input-formbox" key="lastName-formbox">
				<input
					type="text"
					value={lastName}
					onChange={e => setLastName(e.target.value)}
					key="lastName-input"
					name="lastName"
				/>
			</div>
		);
	},
);

const MemberSearchUnitNameFilter = React.memo(
	(): ReactElement => {
		const dispatch = useDispatch();

		const setUnitName = useCallback(name => dispatch(updateUnitName(name)), [dispatch]);

		const unitName = useSelector<MemberSearchState, string>(state => state.unitNameInput);

		return (
			<div className="input-formbox" key="unitName-formbox">
				<input
					type="text"
					value={unitName}
					onChange={e => setUnitName(e.target.value)}
					key="unitName-input"
					name="unitName"
				/>
			</div>
		);
	},
);

const MemberSearchDutyNameFilter = React.memo(
	(): ReactElement => {
		const dispatch = useDispatch();

		const setDutyName = useCallback(name => dispatch(updateDutyName(name)), [dispatch]);

		const dutyName = useSelector<MemberSearchState, string>(state => state.dutyNameInput);

		return (
			<LaxAutocomplete
				renderItem={identity}
				name="position"
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				items={dutyPositions}
				value={dutyName}
				onChange={setDutyName}
			/>
		);
	},
);

const MemberSearchToggleIncludeAssistants = React.memo(
	(): ReactElement => {
		const dispatch = useDispatch();

		const toggleIncludeAssts = useCallback(() => dispatch(toggleIncludeAssistants()), [
			dispatch,
		]);

		const includeAssts = useSelector<MemberSearchState, boolean>(state => state.includeAssts);

		return <Checkbox name="primaryOnly" value={includeAssts} onChange={toggleIncludeAssts} />;
	},
);

const MemberSearchRenderSearchedMembers = (): ReactElement => {
	const dispatch = useDispatch();

	const updateMember = useCallback(
		(member: api.member.MemberSearchResult) => dispatch(selectMember(member)),
		[dispatch],
	);

	const inputHasBeenEntered = useSelector<MemberSearchState, boolean>(
		state => state.inputHasBeenEntered,
	);
	const dutyInput = useSelector<MemberSearchState, string>(
		state => state.dutyNameInput
	);
	const currentMember = useSelector<MemberSearchState, api.member.MemberSearchResult | null>(
		state => state.memberViewed,
		(a, b) =>
			(!a && !b) ||
			(!!a &&
				!!b &&
				stringifyMemberReference(a.member) === stringifyMemberReference(b.member)),
	);
	const dataState = useSelector<
		MemberSearchState,
		MemberSearchStateLoaded | MemberSearchStateLoading | MemberSearchStateError
	>(
		state =>
			state.state === 'ERROR'
				? { state: 'ERROR', message: state.message }
				: state.state === 'LOADED'
					? { state: 'LOADED', members: state.members }
					: { state: 'LOADING' },
		(a, b) =>
			a.state === b.state ||
			(a.state === 'LOADED' && b.state === 'LOADED' && a.members.length === b.members.length),
	);

	return dataState.state === 'LOADED' && dataState.members.length === 0 ? (
		<div className="selector-values" style={{ padding: '10px' }}>
			<i>
				{inputHasBeenEntered
					? 'Could not find members'
					: 'Enter a first or last name to search for'}
			</i>
		</div>
	) : dataState.state === 'LOADED' ? (
		<ul
			className="selector-values"
			style={{
				overflow: 'auto',
				maxHeight: 400,
			}}
		>
			{dataState.members.map(val => {
				const dutyDisplay = val.member.dutyPositions
					.filter((duty): duty is ShortNHQDutyPosition => duty.duty === dutyInput && duty.type === 'NHQ')
					.map(duty => {
						const dutyOrg = duty.orgid === val.member.orgid
							? val.organization
							: Maybe.fromValue(val.dutyOrgs.find(({ ORGID }) => ORGID === duty.orgid));

						return `${duty.assistant ? ', Asst' : ', Pri'} ${Maybe.cata<NHQ.Organization, string>(always(''))(org => 'for [' + org.Wing + '-' + org.Unit + ']')(dutyOrg)}`
					});

				return <li
					key={stringifyMemberReference(val.member)}
					onClick={() => updateMember(val)}
					className={
						!!currentMember &&
							stringifyMemberReference(val.member) ===
							stringifyMemberReference(currentMember.member)
							? 'selected'
							: ''
					}
				>
					{getFullMemberName(val.member)}&nbsp;
					{Maybe.orSome('')(
						Maybe.map((org: NHQ.Organization) => '[' + org.Wing + '-' + org.Unit + ']')(
							val.organization,
						),
					)}
					{dutyDisplay.join('')}
				</li>
			})}
		</ul>
	) : (
		<div className="selector-values" style={{ padding: '10px' }}>
			<Loader forceDisplay={true} />
		</div>
	);
};

const MemberSearchRenderCurrentMemberInfo = (): ReactElement => {
	const currentMember = useSelector<MemberSearchState, api.member.MemberSearchResult | null>(
		state => state.memberViewed,
		(a, b) =>
			(!a && !b) ||
			(!!a &&
				!!b &&
				stringifyMemberReference(a.member) === stringifyMemberReference(b.member)),
	);

	const displayContactInfoItem = (
		displayName: string,
		key: CAPMemberContactType,
		level: CAPMemberContactPriority,
	): ((info: CAPMemberContact) => ReactElement | null) =>
		pipe(
			(info: CAPMemberContact) => info[key][level],
			Maybe.fromValue,
			Maybe.map(contact => (
				<li>
					{displayName}: {contact}
				</li>
			)),
			Maybe.orSome<ReactElement | null>(null),
		);


	const dutyDisplay = ({ member, dutyOrgs, organization }: MemberSearchResult): React.ReactNode[] => 
		member.dutyPositions.map(duty => (
			duty.type === 'NHQ'
			? <li key={`${duty.duty}-${duty.orgid}`}>
				{duty.assistant ? 'Assistant ' : ''}{duty.duty}: 
				{Maybe.orSome('')(Maybe.map((org: NHQ.Organization) => ` [${org.Wing}-${org.Unit}]`)(
					member.orgid === duty.orgid ? organization : Maybe.fromValue(dutyOrgs.find(({ ORGID }) => ORGID === duty.orgid))
				))}
			</li>
			: null
		));

	const orgDisplay =
		currentMember && Maybe.isSome(currentMember.organization)
			? ` (${currentMember.organization.value.Name})`
			: null;

	return currentMember ? (
		<div className="member-contact-view-box has-info">
			<h3>
				Information for {getFullMemberName(currentMember.member)}
				&nbsp;({currentMember.member.id}){orgDisplay}
			</h3>

			<ul>
				{displayContactInfoItem(
					'Primary email',
					'EMAIL',
					'PRIMARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Secondary email',
					'EMAIL',
					'SECONDARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Emergency email',
					'EMAIL',
					'EMERGENCY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Primary parent email',
					'CADETPARENTEMAIL',
					'PRIMARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Secondary parent email',
					'CADETPARENTEMAIL',
					'SECONDARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Emergency parent email',
					'CADETPARENTEMAIL',
					'EMERGENCY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Primary cell phone number',
					'CELLPHONE',
					'PRIMARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Secondary cell phone number',
					'CELLPHONE',
					'SECONDARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Emergency cell phone number',
					'CELLPHONE',
					'EMERGENCY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Primary work phone number',
					'WORKPHONE',
					'PRIMARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Secondary work phone number',
					'WORKPHONE',
					'SECONDARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Emergency work phone number',
					'WORKPHONE',
					'EMERGENCY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Primary home phone number',
					'HOMEPHONE',
					'PRIMARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Secondary home phone number',
					'HOMEPHONE',
					'SECONDARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Emergency home phone number',
					'HOMEPHONE',
					'EMERGENCY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Primary cell phone number',
					'CADETPARENTPHONE',
					'PRIMARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Secondary cell phone number',
					'CADETPARENTPHONE',
					'SECONDARY',
				)(currentMember.member.contact)}
				{displayContactInfoItem(
					'Emergency cell phone number',
					'CADETPARENTPHONE',
					'EMERGENCY',
				)(currentMember.member.contact)}
				{dutyDisplay(currentMember)}
			</ul>
		</div>
	) : (
		<div className="member-contact-view-box">
			<i>Select a member to view their contact info</i>
		</div>
	);
};

const MemberSearchRenderError = (): ReactElement => {
	const errorMessage = useSelector<MemberSearchState, string>(state =>
		state.state === 'ERROR' ? state.message : '',
	);

	return (
		<>
			<h3>Error loading data!</h3>

			<p>{errorMessage}</p>
		</>
	);
};

const MemberSearchDataBox = (): ReactElement => (
	<>
		<div
			key="selector-box"
			className="input-formbox selector-box"
			style={{
				clear: 'both',
				width: '98%',
			}}
		>
			<div className="selector-filters" key="filters-box">
				<ul key="filters-list">
					<li key="lastName">
						<div className="selector-left-filter">Last name</div>
						<div className="selector-right-filter" key="lastName-div">
							<MemberSearchLastNameFilter key="lastName-box" />
						</div>
					</li>
					<li key="firstName">
						<div className="selector-left-filter">First name</div>
						<div className="selector-right-filter" key="firstName-div">
							<MemberSearchFirstNameFilter key="firstName-box" />
						</div>
					</li>
					<li key="orgName">
						<div className="selector-left-filter">Unit name</div>
						<div className="selector-right-filter" key="unitName-div">
							<MemberSearchUnitNameFilter key="unitName-box" />
						</div>
					</li>
					<li key="dutyName">
						<div className="selector-left-filter">Duty name</div>
						{/* <Label>Duty Position</Label> */}

						{/* <Select name="position" labels={temporaryDutyPositions} /> */}
						<div className="selector-right-filter" key="dutyName-div">
							<MemberSearchDutyNameFilter key="dutyName-box" />
						</div>
					</li>
					<li key="primaryOnly">
						<div className="selector-left-filter">Include assistants</div>
						<div className="selector-right-filter" key="primaryOnly-div">
							<MemberSearchToggleIncludeAssistants key="primaryOnly-box" />
						</div>
					</li>
				</ul>
			</div>
			<MemberSearchRenderSearchedMembers />
		</div>

		<MemberSearchRenderCurrentMemberInfo />
	</>
);

const MemberSearchDialogue = (): ReactElement => {
	const dispatch = useDispatch();

	const close = useCallback(() => dispatch(closeDialogue()), [dispatch]);
	const isDialogueOpen = useSelector<MemberSearchState, boolean>(state => state.dialogueOpen);
	const dataState = useSelector<MemberSearchState, MemberSearchState['state']>(
		state => state.state,
		(a, b) =>
			(a === 'ERROR' && b === 'ERROR') || (a.startsWith('LOAD') && b.startsWith('LOAD')),
	);

	return (
		<Dialogue
			key="memberdialogue-dialogue"
			open={isDialogueOpen}
			title="Member Search"
			displayButtons={DialogueButtons.OK}
			onClose={close}
			labels={['Close']}
		>
			{dataState === 'ERROR' ? <MemberSearchRenderError /> : <MemberSearchDataBox />}
		</Dialogue>
	);
};

const MemberSearchOpenButton = (): ReactElement => {
	const dispatch = useDispatch();

	const openDialogueAction = useCallback(() => dispatch(openDialogue()), [dispatch]);

	return (
		<Button onClick={openDialogueAction} buttonType="none">
			Search for a member
		</Button>
	);
};

const FindMember = (props: RequiredMember): ReactElement => {
	const store = configureStore(props.fetchApi);

	return (
		<div className="widget">
			<div className="widget-title">Find Member</div>
			<div className="widget-body">
				<Provider store={store}>
					<MemberSearchDialogue key="dialogue" />
					<MemberSearchOpenButton />
				</Provider>
			</div>
		</div>
	);
};

export default withFetchApi<RequiredMember>(FindMember);
