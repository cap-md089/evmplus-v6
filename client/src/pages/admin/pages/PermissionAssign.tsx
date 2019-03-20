import { MemberAccessLevel } from 'common-lib';
import * as React from 'react';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import Select from '../../../components/form-inputs/Select';
import SimpleForm, { Label, TextBox } from '../../../components/forms/SimpleForm';
import Loader from '../../../components/Loader';
import MemberBase, { CAPMemberClasses } from '../../../lib/Members';
import Page, { PageProps } from '../../Page';

interface PermissionAssignState {
	members: MemberBase[] | null;
	promiseOfMembers: Promise<CAPMemberClasses[]>;
}

type PermissionInformation = { [key: string]: number };

const level = (level: MemberAccessLevel): number =>
	['Member', 'Staff', 'Manager', 'Admin'].indexOf(level);

export default class PermissionAssign extends Page<PageProps, PermissionAssignState> {
	public state: PermissionAssignState = {
		members: null,
		promiseOfMembers: this.props.member
			? this.props.account.getMembers(this.props.member)
			: Promise.resolve([])
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

		const members = await this.props.account.getMembersWithPermissions(this.props.member);

		this.setState({
			members
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

		const values: PermissionInformation = {};

		for (const member of this.state.members) {
			values[`permissions-${member.getFullName()}`] = level(member.accessLevel);
		}

		const children = this.state.members.flatMap((value, index) => [
			<Label key={index * 2}>{value.getFullName()}</Label>,
			<Select
				name={`permissions-${value.getFullName()}`}
				key={index * 2 + 1}
				labels={['Member', 'Cadet Staff', 'Manager', 'Admin']}
			/>
		]);

		return (
			<SimpleForm<PermissionInformation>
				onChange={this.handleChange}
				values={values}
				onSubmit={this.handleSubmit}
				children={[
					...children,
					<TextBox>
						<MemberSelectorButton
							memberList={this.state.promiseOfMembers}
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
					member.accessLevel = ([
						'Member',
						'Staff',
						'Manager',
						'Admin'
					] as MemberAccessLevel[])[values[i]];
				}
			}
		}

		this.forceUpdate();
	}

	private async addMember(member: MemberBase | null) {
		if (!member) {
			return;
		}

		let members = await this.state.promiseOfMembers;

		members = members.filter(mem => !member.matchesReference(mem));

		this.setState(prev => ({
			promiseOfMembers: Promise.resolve(members),
			members: [...prev.members!, member]
		}));
	}

	private async handleSubmit() {
		if (!this.props.member) {
			return;
		}

		await this.props.account.setMemberPermissions(this.props.member, this.state.members!);
	}
}
