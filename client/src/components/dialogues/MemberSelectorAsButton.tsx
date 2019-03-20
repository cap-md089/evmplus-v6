import { MemberReference } from 'common-lib';
import * as React from 'react';
import { CAPMemberClasses } from '../../lib/Members';
import Button from '../Button';
import { FormBlock, Label, TextBox, TextInput } from '../forms/SimpleForm';
import Loader from '../Loader';
import { DialogueButtonProps } from './DialogueButton';
import DownloadDialogue from './DownloadDialogue';

type MemberSelectorButtonProps = DialogueButtonProps & {
	memberList: Promise<CAPMemberClasses[]>;
	onMemberSelect: (member: CAPMemberClasses | null) => void;
};

interface MemberSelectorButtonState {
	members: CAPMemberClasses[] | null;
	open: boolean;
	selectedValue: CAPMemberClasses | null;
	filterValues: any[];
}

export default class MemberSelectorButton extends React.Component<
	MemberSelectorButtonProps,
	MemberSelectorButtonState
> {
	public state: MemberSelectorButtonState = {
		members: null,
		open: false,
		selectedValue: null,
		filterValues: []
	};

	constructor(props: MemberSelectorButtonProps) {
		super(props);

		this.openDialogue = this.openDialogue.bind(this);
		this.setSelectedMember = this.setSelectedMember.bind(this);
		this.selectMember = this.selectMember.bind(this);
	}

	public async componentDidMount() {
		const members = await this.props.memberList;

		this.setState({
			members
		});
	}

	public render() {
		if (!this.state.members) {
			return <Loader />;
		}

		return (
			<>
				<Button onClick={this.openDialogue}>{this.props.children}</Button>
				<DownloadDialogue<CAPMemberClasses>
					open={this.state.open}
					multiple={false}
					overflow={400}
					title="Select a member"
					showIDField={false}
					displayValue={this.displayMember}
					valuePromise={this.state.members}
					filters={[
						{
							check: (member, input) => {
								if (input === '' || typeof input !== 'string') {
									return true;
								}

								try {
									return !!member.getFullName().match(new RegExp(input, 'gi'));
								} catch (e) {
									return false;
								}
							},
							displayText: 'Member name',
							filterInput: TextInput
						}
					]}
					onValueClick={this.setSelectedMember}
					onValueSelect={this.selectMember}
					selectedValue={this.state.selectedValue}
				/>
			</>
		);
	}

	private openDialogue() {
		this.setState({
			open: true
		});
	}

	private displayMember(member: CAPMemberClasses) {
		return member.getFullName();
	}

	private setSelectedMember(selectedValue: CAPMemberClasses | null) {
		this.setState({
			selectedValue
		});
	}

	private selectMember(selectedValue: CAPMemberClasses | null) {
		this.setState({
			selectedValue,
			open: false
		});

		this.props.onMemberSelect(selectedValue);
	}
}
