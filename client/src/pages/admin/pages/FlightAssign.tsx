import * as React from 'react';
import Page, { PageProps } from '../../Page';
import Loader from '../../../components/Loader';
import { CAPMemberClasses } from '../../../lib/Members';
import FlightRow from '../../../components/flightassign/FlightRow';
import Button from '../../../components/Button';
import { MemberReference } from 'common-lib';

interface FlightAssignStateLoaded {
	members: CAPMemberClasses[];
	loaded: true;
	open: boolean;
	highlighted: string | null;
	saved: boolean;
}

interface FlightAssignStateUnloaded {
	members: null;
	loaded: false;
	open: boolean;
	highlighted: string | null;
	saved: false;
}

type FlightAssignState = FlightAssignStateLoaded | FlightAssignStateUnloaded;

const saveButtonMargin = {
	margin: 15,
	marginRight: 35,
};

const saveMessage = {
	marginLeft: 10
}

export default class FlightAssign extends Page<PageProps, FlightAssignState> {
	public state: FlightAssignState = {
		members: null,
		loaded: false,
		open: true,
		highlighted: null,
		saved: false
	};

	public constructor(props: PageProps) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onSaveClick = this.onSaveClick.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member || !this.props.member.hasPermission('FlightAssign')) {
			return;
		}

		this.updateTitle('Administration', 'Flight Assignment')
		this.props.updateSideNav([
			...this.props.registry.RankAndFile.Flights.map((flight, i) => ({
				text: flight,
				target: flight.toLowerCase() + '-' + i,
				type: 'Reference' as 'Reference'
			})),
			{
				target: 'unassigned-' + this.props.registry.RankAndFile.Flights.length,
				text: 'Unassigned',
				type: 'Reference'
			},
			{
				target: 'save',
				text: 'Save',
				type: 'Reference'
			}
		]);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/admin',
				text: 'Administration'
			},
			{
				target: '/admin/flightassign',
				text: 'Flight Assignment'
			}
		]);

		const members = await this.props.account.getMembers(this.props.member);

		this.setState({
			members,
			loaded: true,
		});
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (this.state.loaded === false) {
			return <Loader />;
		}

		const unusedMembers = this.state.members.slice();
		const flights: Array<[string, CAPMemberClasses[]]> = [];

		for (const flight of this.props.registry.RankAndFile.Flights) {
			flights.push([flight, []]);
			for (const i in unusedMembers) {
				if (unusedMembers[i].flight === flight && !unusedMembers[i].seniorMember) {
					const oldMember = unusedMembers.splice(parseInt(i, 10), 1)[0];
					flights[flights.length - 1][1].push(oldMember);
				}
			}
		}

		flights.push(['Unassigned', unusedMembers.filter(mem => !mem.seniorMember)]);

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
					<Button buttonType="primaryButton" onClick={this.onSaveClick}>
						Save
					</Button>
					{this.state.saved ? <span style={saveMessage}>Saved!</span> : null}
				</div>
			</div>
		);
	}

	private onDragStart(flight: string) {
		this.setState({
			open: false,
			highlighted: flight
		});
	}

	private onDrop(flight: string) {
		return ((memRef: MemberReference) => {
			for (const member of this.state.members!) {
				if (member.matchesReference(memRef)) {
					member.flight = flight;
				}
			}
			this.setState({
				highlighted: null,
				open: true,
				saved: false
			});
		}).bind(this);
	}

	private async onSaveClick() {
		const payload: {
			members: Array<{
				member: MemberReference;
				newFlight: string | null;
			}>;
		} = {
			members: []
		};

		for (const i of this.state.members!) {
			if (i.flight && this.props.registry.RankAndFile.Flights.indexOf(i.flight) > -1) {
				payload.members.push({
					member: i.getReference(),
					newFlight: i.flight
				});
			} else {
				payload.members.push({
					member: i.getReference(),
					newFlight: null
				});
			}
		}

		await this.props.member!.updateFlights(payload.members);

		this.setState({
			saved: true
		});
	}
}
