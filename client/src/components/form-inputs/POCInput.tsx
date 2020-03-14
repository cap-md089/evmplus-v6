import {
	CAPMemberObject,
	DisplayInternalPointOfContact,
	ExternalPointOfContact,
	Member,
	MemberObject,
	PointOfContact,
	PointOfContactType
} from 'common-lib';
import * as React from 'react';
import { CAPMemberClasses, createCorrectMemberObject } from '../../lib/Members';
import Button from '../Button';
import DownloadDialogue from '../dialogues/DownloadDialogue';
import {
	Checkbox,
	FormBlock,
	Label,
	TextInput,
	DisabledMappedText,
	DisabledText
} from '../forms/SimpleForm';
import { NotOptionalInputProps } from './Input';
import SimpleRadioButton from './SimpleRadioButton';
import TextBox from './TextBox';

const isInternalPOC = (poc: PointOfContact): poc is DisplayInternalPointOfContact =>
	poc.type === PointOfContactType.INTERNAL;

export interface POCInputProps
	extends NotOptionalInputProps<DisplayInternalPointOfContact | ExternalPointOfContact> {
	memberList: Promise<CAPMemberClasses[]>;
}

export default class POCInput extends React.Component<
	POCInputProps,
	{
		memberSelectOpen: boolean;
		filterValues: any[];
		selectedValue: null | MemberObject;
	}
> {
	public state = {
		memberSelectOpen: false,
		filterValues: [],
		selectedValue: null
	};

	public constructor(props: POCInputProps) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: this.props.value || {
					type: PointOfContactType.INTERNAL,
					email: '',
					name: '',
					memberReference: {
						type: 'Null'
					},
					phone: '',
					receiveEventUpdates: false,
					receiveRoster: false,
					receiveSignUpUpdates: false,
					receiveUpdates: false
				}
			});
		}

		this.onUpdate = this.onUpdate.bind(this);
		this.onMemberSelectClick = this.onMemberSelectClick.bind(this);
		this.updateFilterValues = this.updateFilterValues.bind(this);
		this.selectMember = this.selectMember.bind(this);
		this.setSelectedValue = this.setSelectedValue.bind(this);
	}

	public render() {
		if (!this.props.value) {
			throw new Error('Value required');
		}

		if (!this.props.member) {
			throw new Error('Member required');
		}

		if (!this.props.account) {
			throw new Error('Account required');
		}

		const POCType = SimpleRadioButton as new () => SimpleRadioButton<PointOfContactType>;

		const value = this.props.value;

		return (
			<FormBlock<DisplayInternalPointOfContact | ExternalPointOfContact>
				name={`pocInput-${this.props.index}`}
				onFormChange={this.onUpdate}
				onInitialize={this.props.onInitialize}
				value={value}
			>
				<Label>POC Type</Label>
				<POCType
					name="type"
					labels={['Internal', 'External']}
					index={this.props.index}
					key="type"
				/>

				{this.getMemberSelector()}

				{this.getIDViewer()}

				<Label>Name</Label>
				<TextInput key="name" name="name" disabled={isInternalPOC(value)} />

				<Label>POC Email</Label>
				<TextInput key="email" name="email" />

				<Label>POC Phone</Label>
				<TextInput name="phone" />

				<Label>Receive event updates</Label>
				<Checkbox name="receiveEventUpdates" index={this.props.index} />

				<Label>Receive roster</Label>
				<Checkbox name="receiveRoster" index={this.props.index} />

				<Label>Receive signup updates</Label>
				<Checkbox name="receiveSignUpUpdates" index={this.props.index} />

				<Label>Receive updates</Label>
				<Checkbox name="receiveUpdates" index={this.props.index} />
			</FormBlock>
		);
	}

	private onUpdate(
		poc: DisplayInternalPointOfContact | ExternalPointOfContact,
		error: any,
		changed: any,
		hasError: any,
		name: keyof (DisplayInternalPointOfContact | ExternalPointOfContact)
	) {
		if (name === 'type') {
			if (poc.type === PointOfContactType.INTERNAL) {
				poc = {
					type: PointOfContactType.INTERNAL,
					email: '',
					memberReference: {
						type: 'Null'
					},
					name: '',
					phone: '',
					receiveEventUpdates: false,
					receiveRoster: false,
					receiveSignUpUpdates: false,
					receiveUpdates: false
				};
			} else {
				poc = {
					type: PointOfContactType.EXTERNAL,
					email: '',
					name: '',
					phone: '',
					receiveEventUpdates: false,
					receiveRoster: false,
					receiveSignUpUpdates: false,
					receiveUpdates: false
				};
			}
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: `pocInput-${this.props.index}`,
				value: poc
			});
		}
	}

	private onMemberSelectClick() {
		this.setState({
			memberSelectOpen: true
		});
	}

	private displayMemberValue(member: CAPMemberClasses) {
		let rank = '';

		if (member.type === 'CAPNHQMember' || member.type === 'CAPProspectiveMember') {
			rank = (member as CAPMemberObject).memberRank + ' ';
		}

		return `${rank}${member.getName()}`;
	}

	private updateFilterValues(filterValues: any[]) {
		this.setState({ filterValues });
	}

	private selectMember(member: Member | null) {
		if (member !== null) {
			const mem = createCorrectMemberObject(member, this.props.account!, '');

			if (mem === null) {
				throw new Error('Invalid member object');
			}

			const value: DisplayInternalPointOfContact = {
				...(this.props.value as DisplayInternalPointOfContact)!,
				email: mem.getBestEmail() || '',
				name: mem.getName(),
				memberReference: mem.getReference(),
				phone: mem.getBestPhone() || ''
			};

			this.onUpdate(value, null, null, null, 'email');
		}

		this.setState({
			memberSelectOpen: false
		});
	}

	private setSelectedValue(selectedValue: MemberObject | null) {
		this.setState({
			selectedValue
		});
	}

	private getIDViewer() {
		const value = this.props.value!;

		let id = '';

		if (value.type !== PointOfContactType.INTERNAL) {
			return null;
		}

		if (value.memberReference.type !== 'Null') {
			id = value.memberReference.id.toString();
		}

		return isInternalPOC(value) ? (
			<FormBlock name="memberReference" value={value.memberReference}>
				<Label>ID</Label>
				<DisabledText name="id" />
			</FormBlock>
		) : null;
	}

	private getMemberSelector() {
		const value = this.props.value!;

		const MemberDialogue = DownloadDialogue as new () => DownloadDialogue<CAPMemberClasses>;

		return isInternalPOC(value) ? (
			<TextBox>
				<Button onClick={this.onMemberSelectClick}>Select a member</Button>
				<MemberDialogue
					open={this.state.memberSelectOpen}
					multiple={false}
					overflow={400}
					title="Select Point of Contact"
					showIDField={true}
					displayValue={this.displayMemberValue}
					valuePromise={this.props.memberList}
					filters={[
						{
							check: (memberToCheck, input) => {
								if (input === '' || typeof input !== 'string') {
									return true;
								}

								try {
									return !!memberToCheck
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
					filterValues={this.state.filterValues}
					onFilterValuesChange={this.updateFilterValues}
					onValueClick={this.setSelectedValue}
					onValueSelect={this.selectMember}
					selectedValue={this.state.selectedValue}
				/>
			</TextBox>
		) : null;
	}
}
