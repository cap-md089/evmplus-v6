import * as React from 'react';
import Button from '../Button';
import { TextInput } from '../forms/SimpleForm';
import Loader from '../Loader';
import LoaderShort from '../LoaderShort';
import { DialogueButtonProps } from './DialogueButton';
import DownloadDialogue from './DownloadDialogue';
import { Member, getFullMemberName } from 'common-lib';

type MemberSelectorButtonProps = DialogueButtonProps & {
	memberList: Promise<Member[]> | Member[];
	onMemberSelect: (member: Member | null) => void;
	useShortLoader?: boolean;
	disabled?: boolean;
	buttonType?: '' | 'primaryButton' | 'secondaryButton' | 'none';
};

interface MemberSelectorButtonState {
	members: Member[] | null;
	open: boolean;
	selectedValue: Member | null;
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
			return this.props.useShortLoader ? <LoaderShort /> : <Loader />;
		}

		return (
			<>
				<Button
					buttonType={this.props.buttonType}
					onClick={this.openDialogue}
					disabled={this.props.disabled}
				>
					{this.props.children}
				</Button>
				<DownloadDialogue<Member>
					open={this.state.open}
					multiple={false}
					overflow={400}
					title="Select a member"
					showIDField={false}
					displayValue={getFullMemberName}
					onCancel={() => this.selectMember(null)}
					valuePromise={this.state.members}
					filters={[
						{
							check: (member, input) => {
								if (input === '' || typeof input !== 'string') {
									return true;
								}

								try {
									return !!getFullMemberName(member).match(
										new RegExp(input, 'gi')
									);
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

	private setSelectedMember(selectedValue: Member | null) {
		this.setState({
			selectedValue
		});
	}

	private selectMember(selectedValue: Member | null) {
		this.setState({
			selectedValue,
			open: false
		});

		this.props.onMemberSelect(selectedValue);
	}
}
