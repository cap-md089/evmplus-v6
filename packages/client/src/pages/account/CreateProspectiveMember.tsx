/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	CAPMemberContact,
	CAPMemberContactInstance,
	CAPProspectiveMemberPasswordCreation,
	CAPProspectiveMemberPasswordCreationType,
	getMemberEmail,
	Maybe,
	MaybeObj,
	NewCAPProspectiveMember,
} from 'common-lib';
import React, { FunctionComponent } from 'react';
import EnumRadioButton from '../../components/form-inputs/EnumRadioButton';
import { InputProps } from '../../components/form-inputs/Input';
import PasswordForm from '../../components/form-inputs/PasswordForm';
import Select from '../../components/form-inputs/Select';
import SimpleForm, {
	FormBlock,
	Label,
	SimpleRadioButton,
	TextBox,
	TextInput,
	Title,
} from '../../components/forms/SimpleForm';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';

enum SeniorMember {
	CADET,
	SENIORMEMBER,
}

interface CreateAccountForm {
	contact: CAPMemberContact;

	nameLast: string;

	nameFirst: string;

	nameSuffix: string;

	nameMiddle: string;

	flight: number;

	password: CAPProspectiveMemberPasswordCreation;

	seniorMember: SeniorMember;
}

interface CreateAccountState {
	form: CreateAccountForm;
	submitting: boolean;
	error: MaybeObj<string>;
}

export const PasswordType: FunctionComponent<InputProps<CAPProspectiveMemberPasswordCreation>> = ({
	name,
	value,
	onInitialize,
	onUpdate,
	onChange,
	hasError,
	errorMessage,
}) => {
	const renderEmailLink = () => [];

	const renderRandomPassword = () => [
		<Label key="1">Username</Label>,
		<TextInput key="2" name="username" />,
	];

	const renderUsernamePassword = () => [
		<Label key="1">Username</Label>,
		<TextInput key="2" name="username" />,

		<PasswordForm key="3" name="password" fullWidth={true} />,
	];

	value = value ?? { type: CAPProspectiveMemberPasswordCreationType.EMAILLINK };

	return (
		<FormBlock<CAPProspectiveMemberPasswordCreation>
			name={name}
			value={value}
			onFormChange={onChange}
			onUpdate={onUpdate}
			onInitialize={onInitialize}
		>
			{hasError && !!errorMessage && (
				<TextBox>
					<span style={{ color: 'red' }}>{errorMessage}</span>
				</TextBox>
			)}
			<Label>How should the member have their password set?</Label>
			<EnumRadioButton<CAPProspectiveMemberPasswordCreationType>
				name="type"
				labels={[
					'Set one now',
					'Email a link to finish account creation',
					'Email a random password',
				]}
				values={[
					CAPProspectiveMemberPasswordCreationType.WITHPASSWORD,
					CAPProspectiveMemberPasswordCreationType.EMAILLINK,
					CAPProspectiveMemberPasswordCreationType.RANDOMPASSWORD,
				]}
				defaultValue={CAPProspectiveMemberPasswordCreationType.EMAILLINK}
			/>

			{value.type === CAPProspectiveMemberPasswordCreationType.EMAILLINK
				? renderEmailLink()
				: value.type === CAPProspectiveMemberPasswordCreationType.RANDOMPASSWORD
				? renderRandomPassword()
				: value.type === CAPProspectiveMemberPasswordCreationType.WITHPASSWORD
				? renderUsernamePassword()
				: null}
		</FormBlock>
	);
};

export const ContactInstanceInput: FunctionComponent<
	InputProps<CAPMemberContactInstance> & {
		label: string;
	}
> = ({ name, label, value, onChange, onInitialize, onUpdate }) => (
	<FormBlock<CAPMemberContactInstance>
		name={name}
		value={value}
		onFormChange={onChange}
		onInitialize={onInitialize}
		onUpdate={onUpdate}
	>
		<Title>{label}</Title>

		<Label>Primary</Label>
		<TextInput name="PRIMARY" />

		<Label>Secondary</Label>
		<TextInput name="SECONDARY" />

		<Label>Emergency</Label>
		<TextInput name="EMERGENCY" />
	</FormBlock>
);

export const ContactInput: FunctionComponent<InputProps<CAPMemberContact>> = ({
	name,
	value,
	onChange,
	onInitialize,
	onUpdate,
}) => (
	<FormBlock<CAPMemberContact>
		name={name}
		onFormChange={onChange}
		onInitialize={onInitialize}
		onUpdate={onUpdate}
		value={value}
	>
		<TextBox>
			All of the following are optional unless either the 'Random Password' or 'Email link'
			functions for transferring a password are selected; in that case, at least one of the
			email fields needs to have a value
		</TextBox>

		<ContactInstanceInput name="CADETPARENTEMAIL" label="Parent Email" fullWidth={true} />

		<ContactInstanceInput
			name="CADETPARENTPHONE"
			label="Parent Phone Number"
			fullWidth={true}
		/>

		<ContactInstanceInput name="CELLPHONE" label="Cell Phone Number" fullWidth={true} />

		<ContactInstanceInput name="EMAIL" label="Email" fullWidth={true} />

		<ContactInstanceInput name="HOMEPHONE" label="Home Phone Number" fullWidth={true} />

		<ContactInstanceInput name="WORKPHONE" label="Work Phone Number" fullWidth={true} />
	</FormBlock>
);

export default class CreateProspectiveMember extends Page<PageProps, CreateAccountState> {
	public state: CreateAccountState = {
		form: {
			contact: {
				ALPHAPAGER: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				ASSISTANT: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				CADETPARENTEMAIL: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				CADETPARENTPHONE: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				CELLPHONE: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				DIGITALPAGER: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				EMAIL: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				HOMEFAX: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				HOMEPHONE: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				INSTANTMESSENGER: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				ISDN: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				RADIO: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				TELEX: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				WORKFAX: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
				WORKPHONE: { EMERGENCY: '', PRIMARY: '', SECONDARY: '' },
			},
			flight: this.props.registry.RankAndFile.Flights.length,
			nameFirst: '',
			nameLast: '',
			nameMiddle: '',
			nameSuffix: '',
			password: {
				type: CAPProspectiveMemberPasswordCreationType.EMAILLINK,
			},
			seniorMember: SeniorMember.CADET,
		},
		error: Maybe.none(),
		submitting: false,
	};

	public constructor(props: PageProps) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);
		this.onFormSubmit = this.onFormSubmit.bind(this);
	}

	public componentDidMount() {
		this.props.updateSideNav([
			{
				target: 'general-information',
				text: 'General Information',
				type: 'Reference',
			},
			{
				target: 'parent-email',
				text: 'Contact Information',
				type: 'Reference',
			},
			{
				target: 'password-information',
				text: 'Password Information',
				type: 'Reference',
			},
		]);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/admin',
				text: 'Administration',
			},
			{
				target: '/admin/createprospectiveaccount',
				text: 'Create Prospective Member Account',
			},
		]);
		this.updateTitle('Create Prospective Member');
	}

	public render() {
		const { form, error } = this.state;

		return (
			<>
				{Maybe.orSome<null | React.ReactElement>(null)(
					Maybe.map<string, React.ReactElement>(err => <p key="1">{err}</p>)(error),
				)}
				<SimpleForm<CreateAccountForm>
					values={form}
					submitInfo={{
						text: this.state.submitting ? 'Creating account...' : 'Create account',
						disabled: this.state.submitting,
					}}
					validator={{
						password(password, others) {
							if (
								password.type ===
								CAPProspectiveMemberPasswordCreationType.WITHPASSWORD
							) {
								return true;
							}

							return getMemberEmail(others.contact).hasValue;
						},
						nameFirst: name => name.length > 0,
						nameLast: name => name.length > 0,
					}}
					disableOnInvalid={true}
					onSubmit={this.onFormSubmit}
					onChange={this.onFormChange}
				>
					<Title>General information</Title>

					<Label>First name</Label>
					<TextInput name="nameFirst" errorMessage="Name cannot be empty" />

					<Label>Middle name (optional)</Label>
					<TextInput name="nameMiddle" />

					<Label>Last name</Label>
					<TextInput name="nameLast" errorMessage="Name cannot be empty" />

					<Label>Name suffix (optional)</Label>
					<TextInput name="nameSuffix" />

					<Label>Flight</Label>
					<Select
						name="flight"
						labels={[...this.props.registry.RankAndFile.Flights, 'Unassigned']}
					/>

					<Label>Member type</Label>
					<SimpleRadioButton<SeniorMember>
						name="seniorMember"
						labels={['Cadet', 'Senior Member']}
					/>

					<ContactInput name="contact" fullWidth={true} />

					<Title>Password information</Title>

					<PasswordType
						name="password"
						fullWidth={true}
						errorMessage="An email is required for the selected function"
					/>
				</SimpleForm>
			</>
		);
	}

	private onFormChange(form: CreateAccountForm) {
		this.setState(prev => ({
			form,
			submitting: prev.submitting,
			error: Maybe.none(),
		}));
	}

	private async onFormSubmit(form: CreateAccountForm) {
		if (!this.props.member) {
			return;
		}

		try {
			const newMem: NewCAPProspectiveMember = {
				contact: form.contact,
				flight:
					form.flight === this.props.registry.RankAndFile.Flights.length
						? null
						: this.props.registry.RankAndFile.Flights[form.flight],
				nameFirst: form.nameFirst,
				nameLast: form.nameLast,
				nameMiddle: form.nameMiddle,
				nameSuffix: form.nameSuffix,
				seniorMember: !!form.seniorMember,
			};

			const password: CAPProspectiveMemberPasswordCreation = form.password;

			await fetchApi.member.account.capprospective
				.requestProspectiveAccount(
					{},
					{
						member: newMem,
						login: password,
					},
				)
				.fullJoin();

			this.props.routeProps.history.push('/admin/prospectivemembermanagement');
		} catch (e) {
			this.setState({
				error: Maybe.some('There was a problem communicating with the server'),
			});
		}
	}
}
