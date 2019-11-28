import React from 'react';
import Page, { PageProps } from '../../Page';
import MemberBase from '../../../lib/Members';
import LoaderShort from '../../../components/LoaderShort';
import MemberSelectorButton from '../../../components/dialogues/MemberSelectorAsButton';
import { DialogueButtons } from '../../../components/dialogues/Dialogue';
import APIInterface from '../../../lib/APIInterface';

interface SuState {
	members: MemberBase[] | null;
}

export const canUseSu = (props: PageProps) => !!props.member && props.member.isRioux;

export default class SuWidget extends Page<PageProps, SuState> {
	public state: SuState = {
		members: null
	};

	public constructor(props: PageProps) {
		super(props);

		this.suMember = this.suMember.bind(this);
	}

	public async componentDidMount() {
		const members = await this.props.account.getMembers(this.props.member);

		this.setState({ members });
	}

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">Su</div>
				<div className="widget-body">
					{this.state.members === null ? (
						<LoaderShort />
					) : (
						<div>
							There are {this.state.members.length} members in your unit
							<br />
							<br />
							<MemberSelectorButton
								useShortLoader={true}
								memberList={Promise.resolve(this.state.members)}
								title="Select member"
								displayButtons={DialogueButtons.OK_CANCEL}
								labels={['Select', 'Cancel']}
								onMemberSelect={this.suMember}
								buttonType="none"
							>
								Select a member
							</MemberSelectorButton>
						</div>
					)}
				</div>
			</div>
		);
	}

	private async suMember(member: MemberBase | null) {
		if (!member || !this.props.member) {
			return;
		}

		const token = await APIInterface.getToken(this.props.account.id, this.props.member);

		await this.props.account.fetch(
			'/api/member/su',
			{
				body: JSON.stringify({
					...member.getReference(),
					token
				})
			},
			this.props.member
		);
	}
}
