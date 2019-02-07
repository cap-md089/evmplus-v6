import * as React from 'react';
import { CAPMemberClasses } from 'src/lib/Members';
import Button from '../Button';
import DownloadDialogue from './DownloadDialogue';
import Loader from '../Loader';
import { FormBlock, Label, TextBox, TextInput } from '../forms/SimpleForm';
import { InputProps } from '../form-inputs/Input';

interface MemberInputProps extends InputProps<MemberReference> {
	memberList: Promise<CAPMemberClasses[]>;
}

interface MemberInputState {
	members: CAPMemberClasses[] | null;
	open: boolean;
	selectedValue: CAPMemberClasses | null;
	filterValues: any[];
}

export default class MemberSelector extends React.Component<
	MemberInputProps,
	MemberInputState
> {
	public state: MemberInputState = {
		members: null,
		open: false,
		selectedValue: null,
		filterValues: []
	};

	constructor(props: MemberInputProps) {
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

		const memberRef: MemberReference = this.props.value || {
			type: 'Null'
		};

		const targetMember = this.state.members.filter(member =>
			member.matchesReference(memberRef)
		)[0];

		return (
			<FormBlock name={this.props.name}>
				<Label />

				<TextBox>
					<Button onClick={this.openDialogue}>Select a member</Button>
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
									if (
										input === '' ||
										typeof input !== 'string'
									) {
										return true;
									}

									try {
										return !!member
											.getFullName()
											.match(new RegExp(input, 'gi'));
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
				</TextBox>

				<Label>Member ID</Label>
				<TextInput
					disabled={true}
					name="id"
					value={targetMember ? targetMember.id.toString() : ''}
				/>

				<Label>Member name</Label>
				<TextInput
					disabled={true}
					name="name"
					value={targetMember ? targetMember.getFullName() : ''}
				/>
			</FormBlock>
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

	private setSelectedMember(selectedValue: CAPMemberClasses) {
		this.setState({
			selectedValue
		});
	}

	private selectMember(selectedValue: CAPMemberClasses | null) {
		this.setState({
			selectedValue,
			open: false
		});

		const value: MemberReference = selectedValue
			? selectedValue.getReference()
			: { type: 'Null' };

		if (this.props.onChange) {
			this.props.onChange(value);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value
			});
		}
	}
}
