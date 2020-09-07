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

import * as React from 'react';
import Page, { PageProps } from '../../Page';
import Loader from '../../../components/Loader';
import FlightRow from '../../../components/flightassign/FlightRow';
import Button from '../../../components/Button';
import {
	MemberReference,
	Member,
	hasPermission,
	Either,
	areMembersTheSame,
	toReference,
	Permissions,
} from 'common-lib';
import fetchApi from '../../../lib/apis';

interface FlightAssignStateLoaded {
	members: Member[];
	loaded: true;
	open: boolean;
	highlighted: string | null;
	saved: boolean;
	saving: boolean;
}

interface FlightAssignStateUnloaded {
	members: null;
	loaded: false;
	open: boolean;
	highlighted: string | null;
	saving: boolean;
	saved: false;
}

type FlightAssignState = FlightAssignStateLoaded | FlightAssignStateUnloaded;

const saveButtonMargin = {
	margin: 15,
	marginRight: 35,
};

const saveMessage = {
	marginLeft: 10,
};

export default class FlightAssign extends Page<PageProps, FlightAssignState> {
	public state: FlightAssignState = {
		members: null,
		loaded: false,
		open: true,
		highlighted: null,
		saving: false,
		saved: false,
	};

	public constructor(props: PageProps) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onSaveClick = this.onSaveClick.bind(this);
	}

	public async componentDidMount() {
		if (
			!this.props.member ||
			!hasPermission('FlightAssign')(Permissions.FlightAssign.YES)(this.props.member)
		) {
			return;
		}

		this.updateTitle('Administration', 'Flight Assignment');
		this.props.updateSideNav([
			...this.props.registry.RankAndFile.Flights.map((flight, i) => ({
				text: flight,
				target: flight.toLowerCase() + '-' + i,
				type: 'Reference' as 'Reference',
			})),
			{
				target: 'unassigned-' + this.props.registry.RankAndFile.Flights.length,
				text: 'Unassigned',
				type: 'Reference',
			},
			{
				target: 'save',
				text: 'Save',
				type: 'Reference',
			},
		]);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/admin',
				text: 'Administration',
			},
			{
				target: '/admin/flightassign',
				text: 'Flight Assignment',
			},
		]);

		const membersEither = await fetchApi.member.memberList({}, {}, this.props.member.sessionID);

		if (Either.isLeft(membersEither)) {
			// TODO: add error message
		} else {
			this.setState({
				members: membersEither.value,
				loaded: true,
			});
		}
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (this.state.loaded === false) {
			return <Loader />;
		}

		const unusedMembers = this.state.members.slice().filter(mem => !mem.seniorMember);
		const flights: Array<[string, Member[]]> = [];

		for (const flight of this.props.registry.RankAndFile.Flights) {
			flights.push([flight, []]);
			for (let i = unusedMembers.length - 1; i >= 0; i--) {
				if (unusedMembers[i].flight === flight && !unusedMembers[i].seniorMember) {
					const oldMember = unusedMembers.splice(i, 1)[0];
					flights[flights.length - 1][1].push(oldMember);
				}
			}
		}

		unusedMembers.forEach(mem => {
			mem.flight = null;
		});

		flights.push(['Unassigned', unusedMembers]);

		let first = 0;

		return (
			<div>
				{flights.map((flight, index) => (
					<FlightRow
						key={index}
						index={index}
						open={this.state.open}
						onDragStart={this.onDragStart}
						onDrop={this.onDrop(flight[0])}
						name={flight[0]}
						members={flight[1]}
						first={!first++}
						highlighted={flight[0] === this.state.highlighted}
					/>
				))}
				<div style={saveButtonMargin} id="save">
					<Button
						buttonType="primaryButton"
						onClick={this.onSaveClick}
						disabled={this.state.saving}
					>
						{this.state.saving ? 'Saving...' : 'Save'}
					</Button>
					{this.state.saved ? <span style={saveMessage}>Saved!</span> : null}
				</div>
			</div>
		);
	}

	private onDragStart(flight: string) {
		this.setState({
			open: false,
			highlighted: flight,
		});
	}

	private onDrop(flight: string) {
		return (memRef: MemberReference) => {
			for (const member of this.state.members!) {
				if (areMembersTheSame(memRef)(member)) {
					member.flight = flight;
				}
			}
			this.setState({
				highlighted: null,
				open: true,
				saved: false,
			});
		};
	}

	private async onSaveClick() {
		const payload: {
			members: Array<{
				member: MemberReference;
				newFlight: string | null;
			}>;
		} = {
			members: [],
		};

		for (const i of this.state.members!) {
			if (i.flight && this.props.registry.RankAndFile.Flights.indexOf(i.flight) > -1) {
				payload.members.push({
					member: toReference(i),
					newFlight: i.flight,
				});
			} else {
				payload.members.push({
					member: toReference(i),
					newFlight: null,
				});
			}
		}

		this.setState({
			saved: false,
			saving: true,
		});

		await fetchApi.member.flight.assignBulk({}, payload, this.props.member!.sessionID);

		this.setState({
			saved: true,
			saving: false,
		});
	}
}
