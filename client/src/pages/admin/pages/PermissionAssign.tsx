import * as React from 'react';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import Select from '../../../components/form-inputs/Select';
import SimpleForm, { Label, TextBox } from '../../../components/forms/SimpleForm';
import Loader from '../../../components/Loader';
import MemberBase from '../../../lib/Members';
import Page, { PageProps } from '../../Page';
import Button from '../../../components/Button';
import { MemberPermissions } from 'common-lib';

interface PermissionAssignState {
	members: MemberBase[] | null;
	availableMembers: MemberBase[] | null;
	submitSuccess: boolean;
}

interface PermissionInformation {
	[key: string]: MemberPermissions
};

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

		const [members, availableMembers] = await Promise.all([
			this.props.account.getMembersWithPermissions(this.props.member),
			this.props.account.getMembers(this.props.member)
		]);

		for (const i in members) {
			if (members.hasOwnProperty(i)) {
				for (const j in availableMembers) {
					if (members[i].is(availableMembers[j])) {
						availableMembers.splice(parseInt(j, 10), 1);
						break;
					}
				}
			}
		}

		this.setState({
			members,
			availableMembers
		});
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
			<Label key={index * 3}>{value.getFullName()}</Label>,
			<Select
				name={`permissions-${value.getFullName()}`}
				key={index * 3 + 1}
				labels={['Member', 'Cadet Staff', 'Manager', 'Admin']}
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
					<TextBox key={children.length}>
						<MemberSelectorButton
							memberList={Promise.resolve(this.state.availableMembers)}
							title="Select a member"
							displayButtons={DialogueButtons.OK_CANCEL}
							onMemberSelect={this.addMember}
						>
							Select a member
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
		return (() => {
			const availableMembers = this.state.availableMembers!.slice(0);
			const members = this.state.members!.slice(0);

			availableMembers.push(members.splice(index, 1)[0]);

			this.setState({
				availableMembers,
				members
			});
		});
	}
}
