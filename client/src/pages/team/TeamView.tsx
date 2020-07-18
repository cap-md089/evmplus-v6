import {
	api,
	APIEndpointReturnValue,
	areMembersTheSame,
	canSeeMembership,
	Either,
	FullTeamMember,
	FullTeamObject,
	getFullMemberName,
	getMemberEmail,
	hasPermission,
	isTeamLeader,
	Maybe as M,
	MaybeObj,
	Member,
	MemberReference,
	Permissions,
	pipe,
	get
} from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { DialogueButtons } from '../../components/dialogues/Dialogue';
import DialogueButton from '../../components/dialogues/DialogueButton';
import Loader from '../../components/Loader';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

interface TeamViewStateLoading {
	type: 'LOADING';
}

interface TeamViewHasTeamState {
	type: 'HASTEAM';

	team: FullTeamObject;
}

interface TeamHasMembersState {
	type: 'HASMEMBERS';

	team: FullTeamObject;

	members: Member[];
}

interface TeamErrorState {
	type: 'ERROR';

	message: string;
}

type TeamViewState =
	| TeamViewStateLoading
	| TeamViewHasTeamState
	| TeamHasMembersState
	| TeamErrorState;

const findMemberInTeam = (members: FullTeamMember[]) => (memberToCheck: MemberReference) =>
	M.fromArray(members.filter(member => areMembersTheSame(memberToCheck)(member.reference)));

export default class TeamView extends Page<PageProps<{ id: string }>, TeamViewState> {
	public state: TeamViewState = {
		type: 'LOADING'
	};

	public constructor(props: PageProps<{ id: string }>) {
		super(props);

		this.deleteTeam = this.deleteTeam.bind(this);
	}

	public async componentDidMount() {
		let team: APIEndpointReturnValue<api.team.GetTeam>;

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/team',
				text: 'Team list'
			}
		]);
		this.props.updateSideNav([]);

		try {
			team = await fetchApi.team.get(
				{ id: this.props.routeProps.match.params.id },
				{},
				this.props.member?.sessionID
			);
		} catch (e) {
			return this.setState({
				type: 'ERROR',
				message: 'A connection error occurred'
			});
		}

		if (Either.isLeft(team)) {
			return this.setState({
				type: 'ERROR',
				message: team.value.message
			});
		}

		this.setState({
			type: 'HASTEAM',
			team: team.value
		});

		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/team',
				text: 'Team list'
			},
			{
				target: `/team/${team.value.id}`,
				text: `View team "${team.value.name}"`
			}
		]);
		this.updateTitle(`View team "${team.value.name}"`);

		if (canSeeMembership(M.fromValue(this.props.member))(team.value)) {
			const members = await fetchApi.team.members.list(
				{ id: this.props.routeProps.match.params.id },
				{},
				this.props.member!.sessionID
			);

			if (members.direction === 'left') {
				this.setState({
					type: 'ERROR',
					message: members.value.message
				});
			} else {
				this.setState({
					type: 'HASMEMBERS',
					team: team.value,
					members: members.value
				});
			}
		}
	}

	public render() {
		if (this.state.type === 'ERROR') {
			return <div>{this.state.message}</div>;
		}

		if (this.state.type === 'LOADING') {
			return <Loader />;
		}

		const { team } = this.state;

		const renderMemberInfo = (
			className: string,
			memRef: MaybeObj<MemberReference>,
			memName: MaybeObj<string>
		) =>
			pipe(
				M.map<[MemberReference, string], [MaybeObj<Member>, string]>(([ref, name]) => [
					this.state.type === 'HASMEMBERS'
						? M.fromArray(this.state.members.filter(areMembersTheSame(ref)))
						: M.none(),
					name
				]),
				M.map<[MaybeObj<Member>, string], [MaybeObj<string>, string]>(
					([maybeMem, name]) => [
						M.flatMap<Member, string>(m => getMemberEmail(m.contact))(maybeMem),
						name
					]
				),
				M.map(([emailMaybe, name]) => (
					<>
						{name}{' '}
						{M.orSome<React.ReactChild | null>(null)(
							M.map(email => <i>({email})</i>)(emailMaybe)
						)}
					</>
				)),
				M.map(renderedName => (
					<p>
						{className}
						{renderedName}
					</p>
				)),
				M.orSome<React.ReactChild | null>(null)
			)(M.And([memRef, memName]));

		return (
			<div>
				{this.props.member &&
				hasPermission('ManageTeam')(Permissions.ManageTeam.FULL)(this.props.member) &&
				team.id !== 0 ? (
					<>
						<Link to={`/team/edit/${team.id}`}>Edit team</Link>
						{' | '}
						<DialogueButton
							buttonText="Delete team"
							buttonType="none"
							buttonClass="underline-button"
							displayButtons={DialogueButtons.OK_CANCEL}
							onOk={this.deleteTeam}
							title="Delete team"
							labels={['Yes', 'No']}
						>
							Really delete team?
						</DialogueButton>
					</>
				) : null}
				<h1>{team.name}</h1>
				<p>{team.description || <i>No team description</i>}</p>

				{renderMemberInfo('Senior member coach: ', team.seniorCoach, team.seniorCoachName)}
				{renderMemberInfo(
					'Senior member mentor: ',
					team.seniorMentor,
					team.seniorMentorName
				)}
				{renderMemberInfo('Cadet leader: ', team.cadetLeader, team.cadetLeaderName)}

				<h2>Team members</h2>
				{this.state.type === 'HASMEMBERS'
					? this.state.members.map((member, i) =>
							pipe(
								M.map<FullTeamMember, React.ReactChild>(teamMember => (
									<div key={i}>
										{getFullMemberName(member)}
										{M.orSome<React.ReactChild | null>(null)(
											M.map<string, React.ReactChild>(email => (
												<i> ({email})</i>
											))(getMemberEmail(member.contact))
										)}
										: {teamMember.job}
									</div>
								)),
								M.orSome<React.ReactChild | null>(null)
							)(
								findMemberInTeam((this.state as TeamHasMembersState).team.members)(
									member
								)
							)
					  )
					: team.members.map((member, i) => (
							<div key={i}>
								{member.name}: {member.job}
							</div>
					  ))}
				{this.state.type === 'HASMEMBERS' &&
				this.props.member &&
				isTeamLeader(this.props.member)(this.state.team) ? (
					<>
						<h2>Team member emails</h2>
						<div>{this.getEmails(this.state)}</div>
					</>
				) : null}
			</div>
		);
	}

	private async deleteTeam() {
		if (!this.props.member) {
			return;
		}

		if (this.state.type !== 'HASMEMBERS' && this.state.type !== 'HASTEAM') {
			return;
		}

		if (hasPermission('ManageTeam')()(this.props.member)) {
			return;
		}

		await fetchApi.team.delete(
			{ id: this.state.team.id.toString() },
			{},
			this.props.member.sessionID
		);

		this.props.routeProps.history.push('/team');
	}

	private getEmails(state: TeamHasMembersState) {
		if (!this.props.member || !isTeamLeader(this.props.member)(state.team)) {
			return '';
		}

		const emailList = [];

		const membersToCheck = [
			state.team.cadetLeader,
			state.team.seniorCoach,
			state.team.seniorMentor,
			...state.team.members.map(get('reference')).map(M.some)
		].filter(M.isSome);

		for (const member of membersToCheck) {
			const memberObj = state.members.filter(areMembersTheSame(member.value));

			if (memberObj.length === 1) {
				const cont = memberObj[0].contact;

				if (cont.EMAIL.PRIMARY && emailList.indexOf(cont.EMAIL.PRIMARY) === -1) {
					emailList.push(cont.EMAIL.PRIMARY);
				}
				if (cont.EMAIL.SECONDARY && emailList.indexOf(cont.EMAIL.SECONDARY) === -1) {
					emailList.push(memberObj[0].contact.EMAIL.SECONDARY);
				}
				if (cont.EMAIL.EMERGENCY && emailList.indexOf(cont.EMAIL.EMERGENCY) === -1) {
					emailList.push(memberObj[0].contact.EMAIL.EMERGENCY);
				}
				if (
					cont.CADETPARENTEMAIL.PRIMARY &&
					emailList.indexOf(cont.CADETPARENTEMAIL.PRIMARY) === -1
				) {
					emailList.push(memberObj[0].contact.CADETPARENTEMAIL.PRIMARY);
				}
				if (
					cont.CADETPARENTEMAIL.SECONDARY &&
					emailList.indexOf(cont.CADETPARENTEMAIL.SECONDARY) === -1
				) {
					emailList.push(memberObj[0].contact.CADETPARENTEMAIL.SECONDARY);
				}
				if (
					cont.CADETPARENTEMAIL.EMERGENCY &&
					emailList.indexOf(cont.CADETPARENTEMAIL.EMERGENCY) === -1
				) {
					emailList.push(memberObj[0].contact.CADETPARENTEMAIL.EMERGENCY);
				}
			}
		}

		const found: { [key: string]: true } = {};

		return emailList.filter(e => (!e || found[e] ? false : (found[e] = true))).join('; ');
	}
}
