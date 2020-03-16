import { MemberPermissions } from 'common-lib';
import * as React from 'react';
import Button from '../../../components/Button';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import SimpleForm, {
	PermissionsEdit,
	TextBox,
	Title,
	Divider,
	Label
} from '../../../components/forms/SimpleForm';
import Loader from '../../../components/Loader';
import MemberBase from '../../../lib/Members';
import Page, { PageProps } from '../../Page';

interface PermissionAssignState {
	members: MemberBase[] | null;
	availableMembers: MemberBase[] | null;
	submitSuccess: boolean;
}

interface PermissionInformation {
	[key: string]: MemberPermissions;
}

export default class PermissionAssign extends Page<PageProps, PermissionAssignState> {
	public state: PermissionAssignState = {
		members: null,
		availableMembers: null,
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

		const availableMembers = await this.props.account.getMembers(this.props.member);

		const membersWithPermissions = [];

		for (const j in availableMembers) {
			if (availableMembers.hasOwnProperty(j)) {
				const hasPermissions =
					Object.values(availableMembers[j].permissions).reduce(
						(prev, curr) => prev + curr,
						0
					) !== 0;
				if (hasPermissions) {
					const member = availableMembers.splice(parseInt(j, 10), 1)[0];
					membersWithPermissions.push(member);
				}
			}
		}

		this.setState({
			members: membersWithPermissions,
			availableMembers
		});

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
			...membersWithPermissions.map(member => ({
				target: Title.GenerateID(member.getFullName()),
				text: member.getFullName(),
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

		if (!this.props.member.hasPermission('PermissionManagement')) {
			return <h3>You don't have permission to do that</h3>;
		}

		if (!this.state.members) {
			return <Loader />;
		}
		if (!this.state.availableMembers) {
			return <Loader />;
		}

		const values: PermissionInformation = {};

		for (const member of this.state.members) {
			values[`permissions-${member.getFullName()}`] = member.permissions;
		}

		const children = this.state.members.flatMap((value, index) => [
			<Title key={index * 3}>{value.getFullName()}</Title>,
			<PermissionsEdit
				name={`permissions-${value.getFullName()}`}
				key={index * 3 + 1}
				index={index}
			/>,
			<TextBox key={index * 3 + 2}>
				<Button onClick={this.getRemover(index)} buttonType={'none'}>
					Remove {value.getFullName()}
				</Button>
			</TextBox>
		]);

		return (
			<SimpleForm<PermissionInformation>
				onChange={this.handleChange}
				values={values}
				onSubmit={this.handleSubmit}
				successMessage={this.state.submitSuccess && 'Saved!'}
				submitInfo={{
					text: 'Save changes'
				}}
				children={[
					...children,
					<Divider key={children.length} />,
					<Label key={children.length + 1} />,
					<TextBox key={children.length + 2}>
						<MemberSelectorButton
							memberList={Promise.resolve(this.state.availableMembers)}
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
		for (const member of this.state.members!) {
			for (const i in values) {
				if (i === `permissions-${member.getFullName()}`) {
					member.permissions = values[i];
				}
			}
		}

		this.setState({
			submitSuccess: false
		});

		this.forceUpdate();
	}

	private async addMember(member: MemberBase | null) {
		if (!member) {
			return;
		}

		let members = this.state.availableMembers;

		members = members!.filter(mem => !member.is(mem));

		this.setState(prev => ({
			submitSuccess: false,
			availableMembers: members,
			members: [...prev.members!, member]
		}));
	}

	private async handleSubmit() {
		if (!this.props.member) {
			return;
		}

		await this.props.account.setMemberPermissions(this.props.member, this.state.members!);

		this.setState({
			submitSuccess: true
		});
	}

	private getRemover(index: number) {
		return () => {
			const availableMembers = this.state.availableMembers!.slice(0);
			const members = this.state.members!.slice(0);

			availableMembers.push(members.splice(index, 1)[0]);

			this.setState({
				availableMembers,
				members
			});
		};
	}
}
