import * as React from 'react';
import { MemberClasses } from 'src/lib/Members';
import Button from '../Button';
import DownloadDialogue from '../DownloadDialogue';
import { FormBlock } from '../Form';
import Loader from '../Loader';
import { Label, TextBox, TextInput } from '../SimpleForm';
import { InputProps } from './Input';

interface MemberInputProps extends InputProps<MemberReference> {
	memberList: Promise<MemberClasses[]>;
}

interface MemberInputState {
	members: MemberClasses[] | null;
	open: boolean;
	selectedValue: MemberClasses | null;
	filterValues: any[];
}

export default class MemberSelector extends React.Component<
	MemberInputProps,
	MemberInputState
> {
	constructor(props: MemberInputProps) {
		super(props);
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
					<DownloadDialogue<MemberClasses>
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
					value={targetMember.getFullName()}
				/>
			</FormBlock>
		);
	}

	private openDialogue() {
		this.setState({
			open: true
		});
	}

	private displayMember(member: MemberClasses) {
		return member.getFullName();
	}

	private setSelectedMember(selectedValue: MemberClasses) {
		this.setState({
			selectedValue
		});
	}

	private selectMember(selectedValue: MemberClasses | null) {
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
