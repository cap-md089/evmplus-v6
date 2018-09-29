import * as React from 'react';
import { PointOfContactType } from 'src/enums';
import { Checkbox, FormBlock, Label, TextInput } from '../Form';
import { InputProps } from './Input';
import SimpleRadioButton from './SimpleRadioButton';
import TextBox from './TextBox';

const isInternalPOC = (poc: PointOfContact): poc is InternalPointOfContact =>
	poc.type === PointOfContactType.INTERNAL;

export default class POCInput extends React.Component<
	InputProps<InternalPointOfContact | ExternalPointOfContact>,
	{
		memberSelectOpen: boolean;
		memberName: string;
	}
> {
	public state = {
		memberSelectOpen: false,
		memberName: ''
	};

	public constructor(
		props: InputProps<InternalPointOfContact | ExternalPointOfContact>
	) {
		super(props);

		this.onUpdate = this.onUpdate.bind(this);
		this.onInitialize = this.onInitialize.bind(this);
	}

	public render() {
		const POCType = SimpleRadioButton as new () => SimpleRadioButton<
			PointOfContactType
		>;

		if (!this.props.value) {
			throw new Error('Invalid properties');
		}

		return (
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
						typeof this.props.value.type === 'string'
							? (PointOfContactType.INTERNAL as PointOfContactType)
							: this.props.value.type
					}
					index={this.props.index}
				/>

				<TextBox name="ignore" value={null}>
					Select a member
				</TextBox>

				<Label>{isInternalPOC(this.props.value) ? 'ID' : 'Name'}</Label>

				{isInternalPOC(this.props.value) ? (
					<TextInput
						name="id"
						value={this.props.value.id.toString()}
						onChange={val => !!val.match(/^\d{1,6}$/)}
					/>
				) : (
					<TextInput name="name" value={this.props.value.name} />
				)}

				<Label>POC Email</Label>
				<TextInput name="email" value={this.props.value.email} />

				<Label>POC Phone</Label>
				<TextInput name="phone" value={this.props.value.phone} />

				<Label>Receive event updates</Label>
				<Checkbox
					name="receiveEventUpdates"
					value={!!this.props.value.receiveEventUpdates}
				/>

				<Label>Receive roster</Label>
				<Checkbox
					name="receiveRoster"
					value={!!this.props.value.receiveRoster}
				/>

				<Label>Receive signup updates</Label>
				<Checkbox
					name="receiveSignUpUpdates"
					value={!!this.props.value.receiveSignUpUpdates}
				/>

				<Label>Receive updates</Label>
				<Checkbox
					name="receiveUpdates"
					value={!!this.props.value.receiveUpdates}
				/>
			</FormBlock>
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
}
