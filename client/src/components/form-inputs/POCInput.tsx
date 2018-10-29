import * as React from 'react';
import { PointOfContactType } from '../../enums';
import Button from '../Button';
import DownloadDialogue from '../DownloadDialogue';
import { Checkbox, FormBlock, Label, TextInput } from '../Form';
import { InputProps } from './Input';
import SimpleRadioButton from './SimpleRadioButton';
import TextBox from './TextBox';

const isInternalPOC = (
	poc: PointOfContact
): poc is DisplayInternalPointOfContact =>
	poc.type === PointOfContactType.INTERNAL;

const getBestEmail = (member: MemberObject) =>
	member.contact.EMAIL.PRIMARY ||
	member.contact.CADETPARENTEMAIL.PRIMARY ||
	member.contact.EMAIL.SECONDARY ||
	member.contact.CADETPARENTEMAIL.SECONDARY ||
	member.contact.EMAIL.EMERGENCY ||
	member.contact.CADETPARENTEMAIL.EMERGENCY;

const getBestPhone = (member: MemberObject) =>
	member.contact.CELLPHONE.PRIMARY ||
	member.contact.CADETPARENTPHONE.PRIMARY ||
	member.contact.CELLPHONE.SECONDARY ||
	member.contact.CADETPARENTPHONE.SECONDARY ||
	member.contact.CELLPHONE.EMERGENCY ||
	member.contact.CADETPARENTPHONE.EMERGENCY;

const getName = (member: MemberObject) =>
	[
		member.nameFirst,
		(member.nameMiddle || '')[0],
		member.nameLast,
		member.nameSuffix
	]
		.filter(x => x !== '' && typeof x === 'string')
		.join(' ');

const getReference = (member: MemberObject): MemberReference =>
	member.type === 'CAPProspectiveMember'
		? {
				type: 'CAPProspectiveMember',
				id: member.id as string
		  }
		: {
				type: 'CAPNHQMember',
				id: member.id as number
		  };

export default class POCInput extends React.Component<
	InputProps<DisplayInternalPointOfContact | ExternalPointOfContact>,
	{
		memberSelectOpen: boolean;
		filterValues: any[];
		selectedValue: undefined | MemberObject;
	}
> {
	public state = {
		memberSelectOpen: false,
		filterValues: [],
		selectedValue: undefined
	};

	public constructor(
		props: InputProps<
			DisplayInternalPointOfContact | ExternalPointOfContact
		>
	) {
		super(props);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: props.name,
				value: this.props.value || {
					type: PointOfContactType.INTERNAL,
					email: '',
					name: '',
					id: {
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
		if (!this.props.value || !this.props.member) {
			throw new Error('Invalid properties');
		}

		const POCType = SimpleRadioButton as new () => SimpleRadioButton<
			PointOfContactType
		>;

		const MemberDialogue = DownloadDialogue as new () => DownloadDialogue<
			MemberObject
		>;

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

				{isInternalPOC(value) ? (
					<TextBox name="ignore" value={null}>
						<Button onClick={this.onMemberSelectClick}>
							Select a member
						</Button>
						<MemberDialogue
							open={this.state.memberSelectOpen}
							multiple={false}
							overflow={400}
							url="/api/member"
							title="Select Point of Contact"
							showIDField={true}
							displayValue={this.displayMemberValue}
							member={this.props.member}
							errorMessage="Could not get members"
							filters={[
								{
									check: (memberToCheck, input) => {
										if (
											input === '' ||
											typeof input !== 'string'
										) {
											return true;
										}

										const memberName = [
											memberToCheck.nameFirst,
											(memberToCheck.nameMiddle || '')[0],
											memberToCheck.nameLast,
											memberToCheck.nameSuffix
										]
											.filter(
												x => x !== undefined && x !== ''
											)
											.join(' ');

										try {
											return !!memberName.match(
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
							filterValues={this.state.filterValues}
							onFilterValuesChange={this.updateFilterValues}
							onValueClick={this.setSelectedValue}
							onValueSelect={this.selectMember}
							selectedValue={this.state.selectedValue}
						/>
					</TextBox>
				) : null}

				{isInternalPOC(value) ? <Label>ID</Label> : null}

				{isInternalPOC(value) ? (
					<TextInput
						name="id"
						value={(
							(value.id as
								| NHQMemberReference
								| ProspectiveMemberReference).id || ''
						).toString()}
						disabled={true}
						key="id"
					/>
				) : null}

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
				<Checkbox
					name="receiveEventUpdates"
					value={!!value.receiveEventUpdates}
				/>

				<Label>Receive roster</Label>
				<Checkbox name="receiveRoster" value={!!value.receiveRoster} />

				<Label>Receive signup updates</Label>
				<Checkbox
					name="receiveSignUpUpdates"
					value={!!value.receiveSignUpUpdates}
				/>

				<Label>Receive updates</Label>
				<Checkbox
					name="receiveUpdates"
					value={!!value.receiveUpdates}
				/>
			</FormBlock>
		);
	}

	private onUpdate(e: { name: string; value: any }) {
		if (this.props.onUpdate) {
			if (
				e.value.type === PointOfContactType.INTERNAL &&
				this.props.value!.type === PointOfContactType.EXTERNAL
			) {
				(e.value.name = ''), (e.value.email = '');
				e.value.phone = '';
			}
			this.props.onUpdate(e);
		}
	}

	private onMemberSelectClick() {
		this.setState({
			memberSelectOpen: true
		});
	}

	private displayMemberValue(member: MemberObject) {
		const parts = [
			member.nameFirst,
			(member.nameMiddle || '')[0],
			member.nameLast,
			member.nameSuffix
		].filter(x => x !== '' && x !== undefined);

		let rank = '';

		if (member.type === 'CAPNHQMember' || member.type === 'CAPProspectiveMember') {
			rank = (member as CAPMemberObject).memberRank + ' ';
		}

		return `${rank }${parts.join(' ')}`;
	}

	private updateFilterValues(filterValues: any[]) {
		this.setState({ filterValues });
	}

	private selectMember(member: MemberObject) {
		if (member !== null) {
			const value: DisplayInternalPointOfContact = {
				...(this.props.value as DisplayInternalPointOfContact)!,
				email: getBestEmail(member),
				name: getName(member),
				id: getReference(member),
				phone: getBestPhone(member)
			};

			this.onUpdate({ name: this.props.name, value });
		}

		this.setState({
			memberSelectOpen: false
		});
	}

	private setSelectedValue(selectedValue: MemberObject) {
		this.setState({
			selectedValue
		});
	}
}
