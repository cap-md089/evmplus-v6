/**
 * Copyright (C) 2020 Glenn Rioux
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
	AsyncEither,
	AuditableEvents,
	ChangeEvent,
	DeleteEvent,
	Either,
	EventAuditEvents,
	EventObject,
	formatEventViewerDate as formatDate,
	FromDatabase,
	getURIComponent,
	NewEventObject,
} from 'common-lib';
import * as React from 'react';
import DropDownList from '../../components/DropDownList';
import fetchApi from '../../lib/apis';
import Loader from '../../components/Loader';
import Page, { PageProps } from '../Page';
import './AuditViewer.css';
import SigninLink from '../../components/SigninLink';

interface AuditViewerLoadingState {
	viewerState: 'LOADING';
}

interface AuditViewerLoadedState {
	viewerState: 'LOADED';

	auditInformation: EventAuditEvents[];
	eventInformation: EventObject;
}

interface AuditViewerErrorState {
	viewerState: 'ERROR';

	viewerMessage: string;
}

type AuditViewerState = AuditViewerErrorState | AuditViewerLoadedState | AuditViewerLoadingState;

type AuditViewerProps = PageProps<{ id: string }>;

const getCalendarDate = (inDate: number): string => {
	const dateObject = new Date(inDate);
	const nowObject = new Date();
	return `${dateObject.getMonth()}/${dateObject.getFullYear()}` ===
		`${nowObject.getMonth()}/${nowObject.getFullYear()}`
		? ''
		: `${dateObject.getMonth() + 1}/${dateObject.getFullYear()}`;
};

export default class AuditViewer extends Page<AuditViewerProps> {
	public state: AuditViewerState = {
		viewerState: 'LOADING',
	};

	public async componentDidMount(): Promise<void> {
		const informationEither = await AsyncEither.All([
			fetchApi.events.events.getAuditData(
				{ id: this.props.routeProps.match.params.id.split('-')[0] },
				{},
			),
			fetchApi.events.events.get(
				{ id: this.props.routeProps.match.params.id.split('-')[0] },
				{},
			),
		]);

		this.props.deleteReduxState();

		if (Either.isLeft(informationEither)) {
			this.setState(prev => ({
				...prev,

				viewerState: 'ERROR',
				viewerMessage: informationEither.value.message,
			}));
		} else {
			const [auditInformation, eventInformation] = informationEither.value;
			this.setState(prev => ({
				...prev,

				viewerState: 'LOADED',
				auditInformation,
				eventInformation,
			}));

			this.props.updateBreadCrumbs([
				{
					text: 'Home',
					target: '/',
				},
				{
					target: '/calendar/' + getCalendarDate(eventInformation.startDateTime),
					text: 'Calendar',
				},
				{
					target: '/eventviewer/' + getURIComponent(eventInformation),
					text: `View ${eventInformation.name}`,
				},
			]);

			this.updateTitle(`View audit for event ${eventInformation.name}`);
		}

		this.props.updateSideNav([
			{
				target: 'information',
				text: 'Event Information',
				type: 'Reference',
			},
		]);
	}

	public render(): JSX.Element {
		if (this.state.viewerState === 'LOADING') {
			return <Loader />;
		}

		if (this.state.viewerState === 'ERROR') {
			return <div>{this.state.viewerMessage}</div>;
		}

		if (!this.props.member) {
			return <SigninLink>Please sign in</SigninLink>;
		}

		const eventAuditInfo = this.state.auditInformation;
		const eventInfo = this.state.eventInformation;

		return (
			<>
				<div className="auditviewerroot">
					<h1>Audit Viewer</h1>
					<h2>View audit for event {eventInfo.name}</h2>
					<h3>All Audit Items</h3>
					<DropDownList<EventAuditEvents>
						titles={auditTitle =>
							setAuditType(auditTitle) +
							' at ' +
							formatDate(auditTitle.timestamp) +
							' by ' +
							auditTitle.actorName
						}
						values={eventAuditInfo}
						onlyOneOpen={false}
					>
						{val =>
							'changes' in val
								? FormatEventAuditChange(val)
								: 'objectData' in val
								? FormatEventAuditDelete(val)
								: FormatEventAuditCreate()
						}
					</DropDownList>
				</div>
			</>
		);
	}
}

function setAuditType(inData: AuditableEvents<FromDatabase<NewEventObject>>): string {
	if (inData.type === 'Add') {
		return 'Created';
	} else if (inData.type === 'Modify') {
		let debriefFlag = false;
		if ('debrief' in inData.changes) {
			debriefFlag = true;
		}
		if (debriefFlag === false) {
			return 'Modified';
		} else {
			return 'Debrief';
		}
	} else {
		return 'Deleted';
	}
}

const FormatEventAuditChange = (
	auditRecord: ChangeEvent<FromDatabase<NewEventObject>>,
): JSX.Element => (
	<>
		<div className="auditlist">
			<table>
				<tr>
					<th>Key</th>
					<th>Before Value</th>
					<th>After Value</th>
				</tr>
				{Object.keys(auditRecord.changes)
					.map(key => (key as any) as keyof typeof auditRecord.changes)
					.flatMap(key => [
						<>
							<tr>
								{changeValues(
									key,
									auditRecord.changes[key]?.oldValue,
									auditRecord.changes[key]?.newValue,
								)}
							</tr>
						</>,
					])}
			</table>
		</div>
	</>
);

const FormatEventAuditDelete = (
	auditRecord: DeleteEvent<FromDatabase<NewEventObject>>,
): JSX.Element => (
	<>
		<div>This event was deleted by {auditRecord.actorName}</div>
	</>
);

const FormatEventAuditCreate = (): JSX.Element => <></>;

function changeValues(inKey: string, oldValue: any, newValue: any): JSX.Element {
	const inType = typeof newValue;
	if (inType === 'string') {
		// any string
		return (
			<>
				<td>{inKey}</td>
				<td>{oldValue}</td>
				<td>{newValue}</td>
			</>
		);
	} else if (inType === 'number') {
		if (inKey !== 'desiredNumberOfParticipants') {
			// all dates
			return (
				<>
					<td>{inKey}</td>
					<td>{formatDate(oldValue)}</td>
					<td>{formatDate(newValue)}</td>
				</>
			);
		} else {
			// desired number of participants (need to check for fee amount once input fixed)
			return (
				<>
					<td>{inKey}</td>
					<td>{oldValue}</td>
					<td>{newValue}</td>
				</>
			);
		}
	} else {
		// everything else -- can insert custom handlers above this 'else' statement
		return (
			<>
				<td>{inKey}</td>
				<td>{JSON.stringify(oldValue, null, 2)}</td>
				<td>{JSON.stringify(newValue, null, 2)}</td>
			</>
		);
	}
}
