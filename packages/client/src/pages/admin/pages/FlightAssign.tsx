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
	areMembersTheSame,
	Either,
	hasPermission,
	Member,
	MemberReference,
	Permissions,
	toReference,
} from 'common-lib';
import * as React from 'react';
import Button from '../../../components/Button';
import FlightRow from '../../../components/flightassign/FlightRow';
import Loader from '../../../components/Loader';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';

interface WrappedMember {
	changed: boolean;
	member: Member;
}

interface FlightAssignStateLoaded {
	members: WrappedMember[];
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

const wrapMember = (member: Member): WrappedMember => ({
	changed: false,
	member,
});

const unwrapMember = ({ member }: WrappedMember): Member => member;

const memberChanged = ({ changed }: WrappedMember): boolean => changed;

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

	public async componentDidMount(): Promise<void> {
		if (
			!this.props.member ||
			!hasPermission('FlightAssign')(Permissions.FlightAssign.YES)(this.props.member)
		) {
			return;
		}

		this.props.deleteReduxState();
		
		this.updateTitle('Administration', 'Flight Assignment');
		this.props.updateSideNav([
			...this.props.registry.RankAndFile.Flights.map((flight, i) => ({
				text: flight,
				target: `${flight.toLowerCase()}-${i}`,
				type: 'Reference' as const,
			})),
			{
				target: `unassigned-${this.props.registry.RankAndFile.Flights.length}`,
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

		const membersEither = await fetchApi.member.memberList({}, {});

		if (Either.isLeft(membersEither)) {
			// TODO: add error message
		} else {
			this.setState({
				members: membersEither.value.map(wrapMember),
				loaded: true,
			});
		}
	}

	public render(): JSX.Element {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (this.state.loaded === false) {
			return <Loader />;
		}

		const unusedMembers = this.state.members
			.map(unwrapMember)
			.slice();
			// .filter(mem => !mem.seniorMember);
		const flights: Array<[string, Member[]]> = [];

		for (const flight of this.props.registry.RankAndFile.Flights) {
			flights.push([flight, []]);
			for (let i = unusedMembers.length - 1; i >= 0; i--) {
				if (unusedMembers[i].flight === flight) {
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
			<>
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
				<p>
					Duty responsibilities are indicated by letters in front of the Cadet:
					<ul>
						<li>"cc" for duty assignment as Cadet Commander</li>
						<li>"do" for duty assignment as Cadet Deputy Commander for Operations</li>
						<li>"1st" for duty assignment as Cadet First Sergeant</li>
						<li>"fc" for duty assignment as Cadet Flight Commander</li>
						<li>"fs" for duty assignment as Cadet Flight Sergeant</li>
						<li>"el" for duty assignment as Cadet Element Leader</li>
						<li>"ds" for duty assignment as Cadet Deputy for Support</li>
						<li>"s" for duty assignments involving Support</li>
						<li>"c" for duty assignments on a Cadet Advisory Council</li>
					</ul>
				</p>
			</>
		);
	}

	private onDragStart = (flight: string): void => {
		this.setState({
			open: false,
			highlighted: flight,
		});
	};

	private onDrop = (flight: string) => (memRef: MemberReference) => {
		if (!this.state.members) {
			return;
		}

		for (const member of this.state.members) {
			if (areMembersTheSame(memRef)(member.member)) {
				member.member.flight = flight;
				member.changed = true;
			}
		}
		this.setState(prev =>
			prev.loaded
				? {
						...prev,
						highlighted: null,
						open: true,
						saved: false,
				  }
				: prev,
		);
	};

	private onSaveClick = async (): Promise<void> => {
		const payload: {
			members: Array<{
				member: MemberReference;
				newFlight: string | null;
			}>;
		} = {
			members: [],
		};

		for (const i of this.state.members?.filter?.(memberChanged) ?? []) {
			if (
				i.member.flight &&
				this.props.registry.RankAndFile.Flights.indexOf(i.member.flight) > -1
			) {
				payload.members.push({
					member: toReference(i.member),
					newFlight: i.member.flight,
				});
			} else {
				payload.members.push({
					member: toReference(i.member),
					newFlight: null,
				});
			}
		}

		this.setState({
			saved: false,
			saving: true,
		});

		await fetchApi.member.flight.assignBulk({}, payload);

		this.setState({
			saved: true,
			saving: false,
		});
	};
}
