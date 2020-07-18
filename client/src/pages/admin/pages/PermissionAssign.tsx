import {
	api,
	areMembersTheSame,
	AsyncEither,
	Either,
	getFullMemberName,
	getMemberName,
	hasPermission,
	Maybe,
	Member,
	MemberPermissions,
	MemberReference,
	parseStringMemberReference,
	pipe,
	stringifyMemberReference,
	stripProp,
	toReference
} from 'common-lib';
import * as React from 'react';
import Button from '../../../components/Button';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import SimpleForm, {
	Divider,
	Label,
	PermissionsEdit,
	TextBox,
	Title
} from '../../../components/forms/SimpleForm';
import Loader from '../../../components/Loader';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';

interface PermissionAssignUIState {
	submitSuccess: boolean;
}

interface PermissionAssignLoadingState {
	state: 'LOADING';
}

interface PermissionAssignLoadedState {
	state: 'LOADED';

	membersWithPermissions: Array<api.member.permissions.PermissionInformation & { name: string }>;
	availableMembers: Member[];
}

interface PermissionAssignErrorState {
	state: 'ERROR';

	message: string;
}

type PermissionAssignState = PermissionAssignUIState &
	(PermissionAssignLoadingState | PermissionAssignLoadedState | PermissionAssignErrorState);

interface PermissionInformation {
	[key: string]: MemberPermissions;
}

export default class PermissionAssign extends Page<PageProps, PermissionAssignState> {
	public state: PermissionAssignState = {
		state: 'LOADING',
		submitSuccess: false
	};

	public constructor(props: PageProps) {
		super(props);

		this.addMember = this.addMember.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	public async componentDidMount() {
		if (!this.props.member) {
			return;
		}

		if (!hasPermission('PermissionManagement')()(this.props.member)) {
			return;
		}

		const membersEither = await AsyncEither.All([
			fetchApi.member.memberList({}, {}, this.props.member.sessionID),
			fetchApi.member.permissions.get({}, {}, this.props.member.sessionID)
		]);

		if (Either.isLeft(membersEither)) {
			this.setState(prev => ({
				...prev,
				state: 'ERROR',
				message: membersEither.value.message
			}));
			return;
		}

		const [availableMembers, permissions] = membersEither.value;

		const membersWithPermissions = permissions.map(perms => ({
			...perms,
			name: getName(perms.member)
		}));

		const getName = (member: MemberReference): string =>
			pipe(
				Maybe.map(getMemberName),
				Maybe.orSome(stringifyMemberReference(member))
			)(Maybe.fromArray(availableMembers.filter(areMembersTheSame(member))));

		this.setState(prev => ({
			...prev,

			state: 'LOADED',
			membersWithPermissions,
			availableMembers
		}));

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
				target: '/admin/permissions',
				text: 'Permission Management'
			}
		]);

		this.props.updateSideNav([
			...membersWithPermissions.map(({ name }) => ({
				target: Title.GenerateID(name),
				text: name,
				type: 'Reference' as const
			})),
			{
				target: 'bottom',
				text: 'Bottom',
				type: 'Reference'
			}
		]);
	}

	public render() {
		if (!this.props.member) {
			return <h3>Please sign in</h3>;
		}

		if (!hasPermission('PermissionManagement')()(this.props.member)) {
			return <h3>You don't have permission to do that</h3>;
		}

		const state = this.state;

		if (state.state === 'LOADING') {
			return <Loader />;
		}

		if (state.state === 'ERROR') {
			return <div>{state.message}</div>;
		}

		const values: PermissionInformation = {};

		for (const member of state.membersWithPermissions) {
			values[`permissions-${stringifyMemberReference(member.member)}`] = member.permissions;
		}

		const children = state.membersWithPermissions.flatMap((value, index) => [
			<Title key={`${stringifyMemberReference(value.member)}-1`}>{value.name}</Title>,
			<PermissionsEdit
				name={`permissions-${stringifyMemberReference(value.member)}`}
				key={`${stringifyMemberReference(value.member)}-2}`}
				index={index}
			/>,
			<TextBox key={`${stringifyMemberReference(value.member)}-3`}>
				<Button onClick={this.getRemover(value.member)} buttonType={'none'}>
					Remove {value.name}
				</Button>
			</TextBox>
		]);

		return (
			<SimpleForm<PermissionInformation>
				onChange={this.handleChange}
				values={values}
				onSubmit={this.handleSubmit}
				successMessage={state.submitSuccess && 'Saved!'}
				submitInfo={{
					text: 'Save changes'
				}}
				children={[
					...children,
					<Divider key={children.length} />,
					<Label key={children.length + 1} />,
					<TextBox key={children.length + 2}>
						<MemberSelectorButton
							memberList={state.availableMembers.filter(
								mem =>
									!state.membersWithPermissions.some(permMember =>
										areMembersTheSame(permMember.member)(mem)
									)
							)}
							title="Select a member"
							displayButtons={DialogueButtons.OK_CANCEL}
							onMemberSelect={this.addMember}
						>
							<span id="bottom">
								{children.length === 0
									? 'Select a member'
									: 'Select another member'}
							</span>
						</MemberSelectorButton>
					</TextBox>
				]}
			/>
		);
	}

	private handleChange(values: PermissionInformation) {
		if (this.state.state !== 'LOADED') {
			return;
		}

		const membersWithPermissions: Array<{
			name: string;
		} & api.member.permissions.PermissionInformation> = [];

		for (const memberIDString in values) {
			const memberIDEither = parseStringMemberReference(memberIDString);

			if (Either.isRight(memberIDEither)) {
				const memberID = memberIDEither.value;

				const memberMaybe = Maybe.fromArray(
					this.state.availableMembers.filter(areMembersTheSame(memberID))
				);

				if (Maybe.isSome(memberMaybe)) {
					membersWithPermissions.push({
						member: memberID,
						name: getFullMemberName(memberMaybe.value),
						permissions: values[memberIDString]
					});
				}
			}
		}

		this.setState(prev => ({
			...prev,

			state: 'LOADED',
			membersWithPermissions
		}));
	}

	private async addMember(member: Member | null) {
		if (!member) {
			return;
		}

		this.setState(prev =>
			prev.state === 'LOADED'
				? {
						...prev,
						submitSuccess: false,
						membersWithPermissions: [
							...prev.membersWithPermissions,
							{
								member: toReference(member),
								name: getFullMemberName(member),
								permissions: {
									AdministerPT: 0,
									AssignTasks: 0,
									AssignTemporaryDutyPositions: 0,
									AttendanceView: 0,
									CreateNotifications: 0,
									DownloadCAPWATCH: 0,
									EventContactSheet: 0,
									EventLinkList: 0,
									FileManagement: 0,
									FlightAssign: 0,
									ManageEvent: 0,
									ManageTeam: 0,
									MusterSheet: 0,
									ORMOPORD: 0,
									PTSheet: 0,
									PermissionManagement: 0,
									PromotionManagement: 0,
									ProspectiveMemberManagement: 0,
									RegistryEdit: 0,
									ScanAdd: 0,
									ViewAccountNotifications: 0
								}
							}
						]
				  }
				: prev
		);
	}

	private async handleSubmit() {
		if (!this.props.member) {
			return;
		}

		if (this.state.state !== 'LOADED') {
			return;
		}

		const result = await fetchApi.member.permissions.set(
			{},
			{ newRoles: this.state.membersWithPermissions.map(stripProp('name')) },
			this.props.member.sessionID
		);

		if (Either.isRight(result)) {
			this.setState({
				submitSuccess: true
			});
		} else {
		}
	}

	private getRemover(index: MemberReference) {
		return () => {
			this.setState(prev =>
				prev.state === 'LOADED'
					? {
							...prev,
							membersWithPermissions: prev.membersWithPermissions.filter(
								mem => !areMembersTheSame(index)(mem.member)
							)
					  }
					: prev
			);
		};
	}
}
