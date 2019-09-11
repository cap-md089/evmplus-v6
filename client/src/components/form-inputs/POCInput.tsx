import * as React from 'react';
import { PointOfContactType } from 'common-lib/index';
import { createCorrectMemberObject, CAPMemberClasses } from '../../lib/Members';
import Button from '../Button';
import DownloadDialogue from '../dialogues/DownloadDialogue';
import { Checkbox, FormBlock, Label, TextInput } from '../forms/SimpleForm';
import { NotOptionalInputProps } from './Input';
import SimpleRadioButton from './SimpleRadioButton';
import TextBox from './TextBox';
import { PointOfContact, DisplayInternalPointOfContact, ExternalPointOfContact, MemberObject, CAPMemberObject, Member } from 'common-lib';

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
			<FormBlock
				name={`pocInput-${this.props.index}`}
				onUpdate={this.onUpdate}
				onInitialize={this.props.onInitialize}
			>
				<Label>POC Type</Label>
				<POCType
					name="type"
					labels={['Internal', 'External']}
					value={
						typeof value.type === 'string'
							? (PointOfContactType.INTERNAL as PointOfContactType)
							: value.type
					}
					index={this.props.index}
					key="type"
				/>

				{this.getMemberSelector()}

				{this.getIDViewer()}

				<Label>Name</Label>
				<TextInput
					key="name"
					name="name"
					value={value.name}
					disabled={isInternalPOC(value)}
				/>

				<Label>POC Email</Label>
				<TextInput key="email" name="email" value={value.email} />

				<Label>POC Phone</Label>
				<TextInput name="phone" value={value.phone} />

				<Label>Receive event updates</Label>
				<Checkbox name="receiveEventUpdates" value={!!value.receiveEventUpdates} />

				<Label>Receive roster</Label>
				<Checkbox name="receiveRoster" value={!!value.receiveRoster} />

				<Label>Receive signup updates</Label>
				<Checkbox name="receiveSignUpUpdates" value={!!value.receiveSignUpUpdates} />

				<Label>Receive updates</Label>
				<Checkbox name="receiveUpdates" value={!!value.receiveUpdates} />
			</FormBlock>
		);
	}

	private onUpdate(e: {
		name: string;
		value: DisplayInternalPointOfContact | ExternalPointOfContact;
	}) {
		if (this.props.onUpdate) {
			if (
				e.value.type === PointOfContactType.INTERNAL &&
				this.props.value!.type === PointOfContactType.EXTERNAL
			) {
				e.value.name = '';
				e.value.email = '';
				e.value.phone = '';
				e.value.memberReference = {
					type: 'Null'
				};
			}
			if (
				e.value.type === PointOfContactType.EXTERNAL &&
				this.props.value!.type === PointOfContactType.INTERNAL
			) {
				// @ts-ignore
				delete e.value.memberReference
			}

			// @ts-ignore
			delete e.value.undefined;
			this.props.onUpdate(e);
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

			this.onUpdate({ name: this.props.name, value });
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
				<TextInput disabled={true} name="id" value={id} />
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
