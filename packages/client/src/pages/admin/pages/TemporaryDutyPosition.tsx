/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	Either,
	getFullMemberName,
	hasPermission,
	identity,
	isCAPMember,
	isCAPUnitDutyPosition,
	Maybe,
	MaybeObj,
	Member,
	ShortCAPUnitDutyPosition,
	stringifyMemberReference
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import Button from '../../../components/Button';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import LaxAutocomplete from '../../../components/form-inputs/LaxAutocomplete';
import SimpleForm, { DateTimeInput, Label } from '../../../components/forms/SimpleForm';
import Loader from '../../../components/Loader';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';

interface AddDutyPositionData {
	position: string;
	endDate: number;
}

interface TemporaryDutyPositionMemberCancelledState {
	state: 'CANCELLED';
}

interface TemporaryDutyPositionMemberLoadingState {
	state: 'LOADING';
}

interface TemporaryDutyPositionMemberLoadedState {
	state: 'LOADED';

	members: Member[];

	currentMember: MaybeObj<Member>;
}

interface TemporaryDutyPositionMemberErrorState {
	state: 'ERROR';

	message: string;
}

type TemporaryDutyPositionMemberState =
	| TemporaryDutyPositionMemberCancelledState
	| TemporaryDutyPositionMemberLoadingState
	| TemporaryDutyPositionMemberLoadedState
	| TemporaryDutyPositionMemberErrorState;

interface TemporaryDutyPositionViewerEditorUIState {
	addDutyPosition: AddDutyPositionData;
	showDutyPositionSave: boolean;
}

type TemporaryDutyPositionViewerEditorState = TemporaryDutyPositionViewerEditorUIState &
	TemporaryDutyPositionMemberState;

const highMarginTop = {
	marginTop: 40
};

const temporaryDutyPositions = [
	'Cadet Safety NCO',
	'Cadet Aerospace Education Officer',
	'Cadet Deputy Commander',
	'Cadet Operations Officer',
	'Cadet Recruiting Officer',
	'Cadet Leadership Officer',
	'Cadet WCAC Assistant',
	'Cadet Commander',
	'Cadet Historian Officer',
	'Cadet Safety Officer',
	'Cadet Executive Officer',
	'Cadet Activities NCO',
	'Cadet Administrative NCO',
	'Cadet Aerospace Education NCO',
	'Cadet Communications NCO',
	'Cadet Drug Demand Reduction NCO',
	'Cadet Emergency Services NCO',
	'Cadet Historian NCO',
	'Cadet Leadership NCO',
	'Cadet Logistics NCO',
	'Cadet Operations NCO',
	'Cadet Public Affairs NCO',
	'Cadet Recruiting NCO',
	'Cadet Supply NCO',
	'Cadet Activities Officer',
	'Cadet Public Affairs Officer',
	'Cadet Supply Officer',
	'Cadet Administrative Officer',
	'Cadet Flight Commander',
	'Cadet IT Officer',
	'Cadet IT Officer NCO',
	'Cadet WCAC Representative',
	'Cadet Flight Sergeant',
	'Cadet Emergency Services Officer',
	'Cadet First Sergeant',
	'Cadet Element Leader',
	'Finance Officer',
	'Health Services Officer',
	'Safety Officer',
	'Aerospace Education Officer',
	'Operations Officer',
	'Standardization/Evaluation Officer',
	'Character Development Instructor',
	'Communications Officer ',
	'Drug Demand Reduction Officer',
	'Activities Officer',
	'Administrative Officer',
	'Advisor to the Commander',
	'Alerting Officer',
	'Deputy Commander',
	'Deputy Commander for Cadets',
	'Disaster Preparedness Officer',
	'Emergency Services Officer',
	'Emergency Services Training Officer',
	'Historian',
	'Homeland Security Officer',
	'Information Technologies Officer',
	'Logistics Officer',
	'Personnel Officer',
	'Professional Development Officer',
	'Public Affairs Officer',
	'Recruiting & Retention Officer',
	'Search and Rescue Officer',
	'Squadron Activities Officer',
	'Testing Officer',
	'Transportation Officer',
	'Web Security Administrator',
	'Maintenance Officer',
	'Cadet Activities Officer',
	'Commander',
	'Deputy Commander for Seniors',
	'Squadron Leadership Officer',
	'Supply Officer'
];

export default class TemporaryDutyPositions extends Page<
	PageProps,
	TemporaryDutyPositionViewerEditorState
> {
	public state: TemporaryDutyPositionViewerEditorState = {
		state: 'CANCELLED',
		addDutyPosition: {
			position: '',
			endDate: Date.now()
		},
		showDutyPositionSave: false
	};

	public constructor(props: PageProps) {
		super(props);

		this.selectMember = this.selectMember.bind(this);
		this.onDutyPositionAddChange = this.onDutyPositionAddChange.bind(this);
	}

	public async componentDidMount() {
		this.updateTitle('Administration', 'Temporary Duty Positions');
		this.props.updateBreadCrumbs([
			{
				text: 'Home',
				target: '/'
			},
			{
				text: 'Administration',
				target: '/admin'
			},
			{
				text: 'Temporary Duty Positions',
				target: '/admin/tempdutypositions'
			}
		]);

		this.props.updateSideNav([]);
		if (!this.props.member) {
			return;
		}

		if (!hasPermission('AssignTemporaryDutyPositions')()(this.props.member)) {
			return;
		}

		this.setState({
			state: 'LOADING'
		});

		const memberListEither = await fetchApi.member.memberList(
			{},
			{},
			this.props.member.sessionID
		);

		if (Either.isLeft(memberListEither)) {
			this.setState(prev => ({
				...prev,

				state: 'ERROR',
				message: memberListEither.value.message
			}));
		} else {
			this.setState(prev => ({
				...prev,

				state: 'LOADED',
				members: memberListEither.value,
				currentMember: Maybe.none()
			}));
		}
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in to view your temporary duty positions</div>;
		}

		if (this.state.state === 'ERROR') {
			return (
				<div>There was an error fetching the request information: {this.state.message}</div>
			);
		}

		const currentTemporaryDutyPositions = this.props.member.dutyPositions.filter(
			isCAPUnitDutyPosition
		);

		const positionsView = (
			<>
				<h3>Current Temporary Duty Positions</h3>
				{currentTemporaryDutyPositions.length === 0 ? (
					<div>You do not currently have any temporary duty positions</div>
				) : (
					<ul>
						{currentTemporaryDutyPositions.map((pos, i) => (
							<li key={i}>
								{pos.duty} (Expires{' '}
								{DateTime.fromMillis(pos.expires).toLocaleString({
									...DateTime.DATETIME_SHORT,
									hour12: false
								})}
								)
							</li>
						))}
					</ul>
				)}
			</>
		);

		const positionsEdit = hasPermission('AssignTemporaryDutyPositions')()(this.props.member) ? (
			<div style={highMarginTop}>
				<h3>Assign temporary duty positions</h3>
				{this.state.state === 'LOADING' || this.state.state === 'CANCELLED' ? (
					<Loader />
				) : (
					<MemberSelectorButton
						memberList={Promise.resolve(this.state.members)}
						title="Select a member"
						displayButtons={DialogueButtons.OK_CANCEL}
						onMemberSelect={this.selectMember}
					>
						Select a member
					</MemberSelectorButton>
				)}
				{this.state.state === 'LOADED' && this.state.currentMember.hasValue ? (
					<div>
						<h3>
							Duty positions for {getFullMemberName(this.state.currentMember.value)}
						</h3>
						{this.getDutyPositionListForMember(this.state)}
						{this.getDutyPositionAddForm(this.state)}
					</div>
				) : null}
			</div>
		) : null;

		return (
			<div>
				{positionsView}
				{positionsEdit}
			</div>
		);
	}

	private selectMember(currentMember: Member | null) {
		if (currentMember === null || isCAPMember(currentMember)) {
			this.setState(prev =>
				prev.state === 'LOADED'
					? {
							...prev,
							currentMember: Maybe.fromValue(currentMember)
					  }
					: prev
			);
		}
	}

	private getRemover(positionToRemove: string) {
		return async () => {
			if (this.state.state !== 'LOADED' || !this.state.currentMember.hasValue) {
				return;
			}
			if (!this.props.member) {
				return;
			}

			const dutyPositions = this.state.currentMember.value.dutyPositions.filter(
				({ duty, type }) => type !== 'CAPUnit' || duty !== positionToRemove
			);

			await fetchApi.member.temporaryDutyPositions.set(
				{ id: stringifyMemberReference(this.state.currentMember.value) },
				{ dutyPositions: dutyPositions.filter(isCAPUnitDutyPosition) },
				this.props.member.sessionID
			);

			const newMember = {
				...this.state.currentMember.value,
				dutyPositions
			};

			this.setState({
				...this.state,

				currentMember: Maybe.some(newMember)
			});
		};
	}

	private getDutyPositionListForMember(state: TemporaryDutyPositionMemberLoadedState) {
		if (!state.currentMember.hasValue) {
			return;
		}

		if (state.currentMember.value.dutyPositions.length === 0) {
			return <div>The selected member has no temporary duty positions active</div>;
		}

		return (
			<>
				<ul>
					{(state.currentMember.value.dutyPositions.filter(
						pos => pos.type === 'CAPUnit'
					) as ShortCAPUnitDutyPosition[]).map((pos, index) => (
						<li key={index}>
							{pos.duty} (Expires{' '}
							{DateTime.fromMillis(pos.expires).toLocaleString({
								...DateTime.DATETIME_SHORT,
								hour12: false
							})}
							){' '}
							<Button buttonType="none" onClick={this.getRemover(pos.duty)}>
								Remove this duty position
							</Button>
						</li>
					))}
				</ul>
			</>
		);
	}

	private getDutyPositionAddForm(state: TemporaryDutyPositionMemberLoadedState) {
		if (!state.currentMember.hasValue) {
			return;
		}

		return (
			<>
				<h3>Add a temporary duty position</h3>
				<SimpleForm<AddDutyPositionData>
					onChange={this.onDutyPositionAddChange}
					onSubmit={this.newDutyPositionSubmitter(state)}
					values={this.state.addDutyPosition}
					successMessage={this.state.showDutyPositionSave && 'Saved!'}
				>
					<Label>Duty Position to assign</Label>
					<LaxAutocomplete
						renderItem={identity}
						name="position"
						items={temporaryDutyPositions}
					/>
					{/* <Select name="position" labels={temporaryDutyPositions} /> */}

					<Label>Duration of position</Label>
					<DateTimeInput
						account={this.props.account}
						time={true}
						name="endDate"
						originalTimeZoneOffset={'America/New_York'}
					/>
				</SimpleForm>
			</>
		);
	}

	private newDutyPositionSubmitter(state: TemporaryDutyPositionMemberLoadedState) {
		return async (data: AddDutyPositionData) => {
			if (!state.currentMember.hasValue) {
				return;
			}
			if (!this.props.member) {
				return;
			}

			const newMember = {
				...state.currentMember.value,
				dutyPositions: [
					...state.currentMember.value.dutyPositions,
					{
						date: Date.now(),
						duty: data.position,
						expires: data.endDate,
						type: 'CAPUnit' as const
					}
				]
			};

			await fetchApi.member.temporaryDutyPositions.set(
				{ id: stringifyMemberReference(state.currentMember.value) },
				{ dutyPositions: newMember.dutyPositions.filter(isCAPUnitDutyPosition) },
				this.props.member.sessionID
			);

			this.setState({
				showDutyPositionSave: true,
				addDutyPosition: {
					endDate: Date.now(),
					position: ''
				}
			});
		};
	}

	private onDutyPositionAddChange(data: AddDutyPositionData) {
		this.setState({
			addDutyPosition: data,
			showDutyPositionSave: false
		});
	}
}
