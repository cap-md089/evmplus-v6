import * as React from 'react';
import { PointOfContactType } from '../../enums';
import { Checkbox, FormBlock, Label, TextInput } from '../Form';
import { InputProps } from './Input';
import SimpleRadioButton from './SimpleRadioButton';
import TextBox from './TextBox';
import DisabledMappedText from './DisabledMappedText';
import Button from '../Button';
import DownloadDialogue from '../DownloadDialogue';
import { MemberContext } from '../../App';

const isInternalPOC = (
	poc: PointOfContact
): poc is DisplayInternalPointOfContact =>
	poc.type === PointOfContactType.INTERNAL;

export default class POCInput extends React.Component<
	InputProps<DisplayInternalPointOfContact | ExternalPointOfContact>,
	{
		memberSelectOpen: boolean;
	}
> {
	public state = {
		memberSelectOpen: false
	};

	public constructor(
		props: InputProps<
			DisplayInternalPointOfContact | ExternalPointOfContact
		>
	) {
		super(props);

		this.onUpdate = this.onUpdate.bind(this);
		this.onInitialize = this.onInitialize.bind(this);
		this.onMemberSelectClick = this.onMemberSelectClick.bind(this);
	}

	public render() {
		const POCType = SimpleRadioButton as new () => SimpleRadioButton<
			PointOfContactType
		>;

		const IDDisplay = DisabledMappedText as new () => DisabledMappedText<
			MemberReference
		>;

		const MemberDialogue = DownloadDialogue as new () => DownloadDialogue<
			MemberObject
		>;

		if (!this.props.value) {
			throw new Error('Invalid properties');
		}

		const value = this.props.value;

		return (
			<MemberContext.Consumer>
				{member => (
					<FormBlock
						name="pocInput"
						onUpdate={this.onUpdate}
						onInitialize={this.onInitialize}
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
						/>

						{isInternalPOC(value) ? (
							<TextBox name="ignore" value={null}>
								<Button onClick={this.onMemberSelectClick}>
									Select a member
									<MemberDialogue
										open={this.state.memberSelectOpen}
										multiple={false}
										name="memberSelect"
										showIDField={true}
										displayValue={this.displayMemberValue}
										member={member}
									/>
								</Button>
							</TextBox>
						) : null}

						<Label>
							{isInternalPOC(value) ? 'ID' : 'Name'}
						</Label>

						{isInternalPOC(value) ? (
							<IDDisplay name="id" value={value.id} />
						) : (
							<TextInput
								name="name"
								value={value.name}
							/>
						)}

						{isInternalPOC(value) ? (
							<Label>Name</Label>
						) : null}
						{isInternalPOC(value) ? (
							<TextInput
								name="name"
								value={value.name}
								disabled={true}
							/>
						) : null}

						<Label>POC Email</Label>
						<TextInput
							name="email"
							value={value.email}
						/>

						<Label>POC Phone</Label>
						<TextInput
							name="phone"
							value={value.phone}
						/>

						<Label>Receive event updates</Label>
						<Checkbox
							name="receiveEventUpdates"
							value={!!value.receiveEventUpdates}
						/>

						<Label>Receive roster</Label>
						<Checkbox
							name="receiveRoster"
							value={!!value.receiveRoster}
						/>

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
				)}
			</MemberContext.Consumer>
		);
	}

	private onUpdate(e: { name: string; value: any }) {
		if (this.props.onUpdate) {
			this.props.onUpdate(e);
		}
	}

	private onInitialize(e: { name: string; value: any }) {
		if (this.props.onInitialize) {
			this.props.onInitialize(e);
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

		return `${member.memberRank} ${parts.join(' ')}`;
	}
}
