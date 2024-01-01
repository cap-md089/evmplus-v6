/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AccountObject,
	AccountType,
	getDefaultAdminPermissions,
	getDefaultManagerPermissions,
	getDefaultMemberPermissions,
	getDefaultStaffPermissions,
	MemberPermissions,
	Permissions,
	stripProp,
	CAPRegionMemberPermissions,
	CAPWingMemberPermissions,
	CAPGroupMemberPermissions,
	CAPEventMemberPermissions,
	CAPSquadronMemberPermissions,
} from 'common-lib';
import * as React from 'react';
import { deepCompare } from '../../pages/Page';
import { Checkbox, FormBlock, Label } from '../forms/SimpleForm';
import EnumSelect from './EnumSelect';
import { BooleanForField } from './FormBlock';
import { InputProps } from './Input';
import Select from './Select';

export interface PermissionsEditProps extends Omit<InputProps<MemberPermissions>, 'account'> {
	account: AccountObject;
}

enum PermissionLevel {
	CUSTOM,
	MEMBER,
	CADETSTAFF,
	MANAGER,
	ADMIN,
}

type PermissionFormValues = MemberPermissions & {
	permissionlevel: PermissionLevel;
	showAdvanced: boolean;
};

const stripPermissionLevel = (values: PermissionFormValues): MemberPermissions =>
	stripProp('permissionlevel')(stripProp('showAdvanced')(values)) as MemberPermissions;

const permissionLevelFromPermissions = (accountType: AccountType) => (
	permissions: MemberPermissions,
): PermissionLevel =>
	deepCompare(permissions, getDefaultMemberPermissions(accountType))
		? PermissionLevel.MEMBER
		: deepCompare(permissions, getDefaultStaffPermissions(accountType))
		? PermissionLevel.CADETSTAFF
		: deepCompare(permissions, getDefaultManagerPermissions(accountType))
		? PermissionLevel.MANAGER
		: deepCompare(permissions, getDefaultAdminPermissions(accountType))
		? PermissionLevel.ADMIN
		: PermissionLevel.CUSTOM;

interface PermissionsEditState {
	showAdvanced: boolean;
}

export default class PermissionsEdit extends React.Component<
	PermissionsEditProps,
	PermissionsEditState
> {
	public state: PermissionsEditState = {
		showAdvanced: false,
	};

	public constructor(props: PermissionsEditProps) {
		super(props);

		if (this.props.onInitialize) {
			const value = this.props.value || getDefaultMemberPermissions(this.props.account.type);

			this.props.onInitialize({
				name: this.props.name,
				value,
			});
		}
	}

	public render(): JSX.Element {
		const value = this.props.value || getDefaultMemberPermissions(this.props.account.type);

		const permissionlevel = permissionLevelFromPermissions(this.props.account.type)(value);

		const { showAdvanced } = this.state;

		return showAdvanced ? (
			this.renderAdvancedInput(value, permissionlevel)
		) : (
			<FormBlock<PermissionFormValues>
				name="memberPermissionEditor"
				value={{
					...value,
					permissionlevel,
					showAdvanced,
				}}
				onFormChange={this.handleChange}
			>
				<Label>Permission level</Label>
				<Select<PermissionLevel>
					name="permissionlevel"
					labels={['Custom', 'Member', 'Cadet Staff', 'Manager', 'Admin']}
				/>

				<Label>Show full settings</Label>
				<Checkbox name="showAdvanced" index={this.props.index} />
			</FormBlock>
		);
	}

	private handleChange = (
		values: PermissionFormValues,
		err: BooleanForField<PermissionFormValues>,
		chang: BooleanForField<PermissionFormValues>,
		err2: boolean,
		changedField: keyof PermissionFormValues,
	): void => {
		let newValues: MemberPermissions;
		if (changedField === 'permissionlevel') {
			switch (values[changedField]) {
				case PermissionLevel.ADMIN:
					newValues = getDefaultAdminPermissions(this.props.account.type);
					break;
				case PermissionLevel.CADETSTAFF:
					newValues = getDefaultStaffPermissions(this.props.account.type);
					break;
				case PermissionLevel.MANAGER:
					newValues = getDefaultManagerPermissions(this.props.account.type);
					break;
				case PermissionLevel.MEMBER:
					newValues = getDefaultAdminPermissions(this.props.account.type);
					break;
				default:
					newValues = stripPermissionLevel(values);
					break;
			}
		} else {
			newValues = stripPermissionLevel(values);
		}

		if (changedField === 'showAdvanced') {
			this.setState({
				showAdvanced: values.showAdvanced,
			});
		}

		this.props.onChange?.(newValues);

		this.props.onUpdate?.({
			name: this.props.name,
			value: newValues,
		});
	};

	private renderAdvancedInput = (value: MemberPermissions, level: PermissionLevel): JSX.Element =>
		value.type === AccountType.CAPEVENT
			? this.renderAdvancedEventInput(value, level)
			: value.type === AccountType.CAPSQUADRON
			? this.renderAdvancedSquadronInput(value, level)
			: value.type === AccountType.CAPGROUP
			? this.renderAdvancedGroupInput(value, level)
			: value.type === AccountType.CAPWING
			? this.renderAdvancedWingInput(value, level)
			: this.renderAdvancedRegionInput(value, level);

	private renderAdvancedSquadronInput = (
		value: CAPSquadronMemberPermissions,
		permissionlevel: PermissionLevel,
	): JSX.Element => (
		<FormBlock<PermissionFormValues>
			name="memberPermissionEditor"
			value={{
				...value,
				permissionlevel,
				showAdvanced: true,
			}}
			onFormChange={this.handleChange}
		>
			<Label>Permission level</Label>
			<Select<PermissionLevel>
				name="permissionlevel"
				labels={['Custom', 'Member', 'Cadet Staff', 'Manager', 'Admin']}
			/>

			<Label>Show full settings</Label>
			<Checkbox name="showAdvanced" index={this.props.index} />

			<Label key="0">Administer PT</Label>
			<EnumSelect<Permissions.AdministerPT>
				key="1"
				name="AdministerPT"
				labels={['No', 'Yes']}
				values={[Permissions.AdministerPT.NO, Permissions.AdministerPT.YES]}
				defaultValue={Permissions.AdministerPT.NO}
			/>

			<Label key="2">Assign tasks</Label>
			<EnumSelect<Permissions.AssignTasks>
				key="3"
				name="AssignTasks"
				labels={['No', 'Yes']}
				values={[Permissions.AssignTasks.NO, Permissions.AssignTasks.YES]}
				defaultValue={Permissions.AssignTasks.NO}
			/>

			<Label key="4">File management</Label>
			<EnumSelect<Permissions.FileManagement>
				key="5"
				name="FileManagement"
				labels={['Default', 'Full']}
				values={[Permissions.FileManagement.NONE, Permissions.FileManagement.FULL]}
				defaultValue={Permissions.FileManagement.NONE}
			/>

			<Label key="6">Flight Assign</Label>
			<EnumSelect<Permissions.FlightAssign>
				key="7"
				name="FlightAssign"
				labels={['No', 'Yes']}
				values={[Permissions.FlightAssign.NO, Permissions.FlightAssign.YES]}
				defaultValue={Permissions.FlightAssign.NO}
			/>

			<Label key="8">Muster sheet</Label>
			<EnumSelect<Permissions.MusterSheet>
				key="9"
				name="MusterSheet"
				labels={['No', 'Yes']}
				values={[Permissions.MusterSheet.NO, Permissions.MusterSheet.YES]}
				defaultValue={Permissions.MusterSheet.NO}
			/>

			<Label key="10">PT Sheet Management</Label>
			<EnumSelect<Permissions.PTSheet>
				key="11"
				name="PTSheet"
				labels={['No', 'Yes']}
				values={[Permissions.PTSheet.NO, Permissions.PTSheet.YES]}
				defaultValue={Permissions.PTSheet.NO}
			/>

			<Label key="12">Promotion Management</Label>
			<EnumSelect<Permissions.PromotionManagement>
				key="13"
				name="PromotionManagement"
				labels={['No', 'Yes']}
				values={[
					Permissions.PromotionManagement.NONE,
					Permissions.PromotionManagement.FULL,
				]}
				defaultValue={Permissions.PromotionManagement.NONE}
			/>

			<Label key="14">Assign temporary duty positions</Label>
			<EnumSelect<Permissions.AssignTemporaryDutyPosition>
				key="15"
				name="AssignTemporaryDutyPositions"
				labels={['No', 'Yes']}
				values={[
					Permissions.AssignTemporaryDutyPosition.NO,
					Permissions.AssignTemporaryDutyPosition.YES,
				]}
				defaultValue={Permissions.AssignTemporaryDutyPosition.NO}
			/>

			<Label key="16">Event contact sheet</Label>
			<EnumSelect<Permissions.EventContactSheet>
				key="17"
				name="EventContactSheet"
				labels={['No', 'Yes']}
				values={[Permissions.EventContactSheet.NO, Permissions.EventContactSheet.YES]}
				defaultValue={Permissions.EventContactSheet.NO}
			/>

			<Label key="18">Event link list</Label>
			<EnumSelect<Permissions.EventLinkList>
				key="19"
				name="EventLinkList"
				labels={['No', 'Yes']}
				values={[Permissions.EventLinkList.NO, Permissions.EventLinkList.YES]}
				defaultValue={Permissions.EventLinkList.NO}
			/>

			<Label key="20">ORM OPORD</Label>
			<EnumSelect<Permissions.ORMOPORD>
				key="21"
				name="ORMOPORD"
				labels={['No', 'Yes']}
				values={[Permissions.ORMOPORD.NO, Permissions.ORMOPORD.YES]}
				defaultValue={Permissions.ORMOPORD.NO}
			/>

			<Label key="22">Prospective Member Management</Label>
			<EnumSelect<Permissions.ProspectiveMemberManagement>
				key="23"
				name="ProspectiveMemberManagement"
				labels={['No', 'Yes']}
				values={[
					Permissions.ProspectiveMemberManagement.NONE,
					Permissions.ProspectiveMemberManagement.FULL,
				]}
				defaultValue={Permissions.ProspectiveMemberManagement.NONE}
			/>

			<Label key="24">Create notifications</Label>
			<EnumSelect<Permissions.Notify>
				key="25"
				name="CreateNotifications"
				labels={['None', 'Global']}
				values={[Permissions.Notify.NO, Permissions.Notify.GLOBAL]}
				defaultValue={Permissions.Notify.NO}
			/>

			<Label key="26">Manage events</Label>
			<EnumSelect<Permissions.ManageEvent>
				key="27"
				name="ManageEvent"
				labels={['No', 'Add draft events', 'Full']}
				values={[
					Permissions.ManageEvent.NONE,
					Permissions.ManageEvent.ADDDRAFTEVENTS,
					Permissions.ManageEvent.FULL,
				]}
				defaultValue={Permissions.ManageEvent.NONE}
			/>

			<Label key="28">Manage teams</Label>
			<EnumSelect<Permissions.ManageTeam>
				key="29"
				name="ManageTeam"
				labels={['No', 'Yes']}
				values={[Permissions.ManageTeam.NONE, Permissions.ManageTeam.FULL]}
				defaultValue={Permissions.ManageTeam.NONE}
			/>

			<Label key="30">Set up Event Attendance Scanners</Label>
			<EnumSelect<Permissions.ScanAdd>
				key="31"
				name="ScanAdd"
				labels={['No', 'Yes']}
				values={[Permissions.ScanAdd.NO, Permissions.ScanAdd.YES]}
				defaultValue={Permissions.ScanAdd.NO}
			/>

			<Label key="32">View attendance</Label>
			<EnumSelect<Permissions.AttendanceView>
				key="33"
				name="AttendanceView"
				labels={['Personal', 'Others']}
				values={[Permissions.AttendanceView.PERSONAL, Permissions.AttendanceView.OTHER]}
				defaultValue={Permissions.AttendanceView.PERSONAL}
			/>

			<Label key="35">Permission management</Label>
			<EnumSelect<Permissions.PermissionManagement>
				key="36"
				name="PermissionManagement"
				labels={['No', 'Yes']}
				values={[
					Permissions.PermissionManagement.NONE,
					Permissions.PermissionManagement.FULL,
				]}
				defaultValue={Permissions.PermissionManagement.NONE}
			/>

			<Label key="37">View admin notifications</Label>
			<EnumSelect<Permissions.ViewAccountNotifications>
				key="38"
				name="ViewAccountNotifications"
				labels={['No', 'Yes']}
				values={[
					Permissions.ViewAccountNotifications.NO,
					Permissions.ViewAccountNotifications.YES,
				]}
				defaultValue={Permissions.ViewAccountNotifications.NO}
			/>

			<Label key="39">Configure website</Label>
			<EnumSelect<Permissions.RegistryEdit>
				key="40"
				name="RegistryEdit"
				labels={['No', 'Yes']}
				values={[Permissions.RegistryEdit.NO, Permissions.RegistryEdit.YES]}
				defaultValue={Permissions.RegistryEdit.NO}
			/>
		</FormBlock>
	);

	private renderAdvancedEventInput = (
		value: CAPEventMemberPermissions,
		permissionlevel: PermissionLevel,
	): JSX.Element => (
		<FormBlock<PermissionFormValues>
			name="memberPermissionEditor"
			value={{
				...value,
				permissionlevel,
				showAdvanced: true,
			}}
			onFormChange={this.handleChange}
		>
			<Label>Permission level</Label>
			<Select<PermissionLevel>
				name="permissionlevel"
				labels={['Custom', 'Member', 'Cadet Staff', 'Manager', 'Admin']}
			/>

			<Label>Show full settings</Label>
			<Checkbox name="showAdvanced" index={this.props.index} />

			<Label key="0">Administer PT</Label>
			<EnumSelect<Permissions.AdministerPT>
				key="1"
				name="AdministerPT"
				labels={['No', 'Yes']}
				values={[Permissions.AdministerPT.NO, Permissions.AdministerPT.YES]}
				defaultValue={Permissions.AdministerPT.NO}
			/>

			<Label key="2">Assign tasks</Label>
			<EnumSelect<Permissions.AssignTasks>
				key="3"
				name="AssignTasks"
				labels={['No', 'Yes']}
				values={[Permissions.AssignTasks.NO, Permissions.AssignTasks.YES]}
				defaultValue={Permissions.AssignTasks.NO}
			/>

			<Label key="4">File management</Label>
			<EnumSelect<Permissions.FileManagement>
				key="5"
				name="FileManagement"
				labels={['Default', 'Full']}
				values={[Permissions.FileManagement.NONE, Permissions.FileManagement.FULL]}
				defaultValue={Permissions.FileManagement.NONE}
			/>

			<Label key="6">Flight Assign</Label>
			<EnumSelect<Permissions.FlightAssign>
				key="7"
				name="FlightAssign"
				labels={['No', 'Yes']}
				values={[Permissions.FlightAssign.NO, Permissions.FlightAssign.YES]}
				defaultValue={Permissions.FlightAssign.NO}
			/>

			<Label key="8">Muster sheet</Label>
			<EnumSelect<Permissions.MusterSheet>
				key="9"
				name="MusterSheet"
				labels={['No', 'Yes']}
				values={[Permissions.MusterSheet.NO, Permissions.MusterSheet.YES]}
				defaultValue={Permissions.MusterSheet.NO}
			/>

			<Label key="14">Assign temporary duty positions</Label>
			<EnumSelect<Permissions.AssignTemporaryDutyPosition>
				key="15"
				name="AssignTemporaryDutyPositions"
				labels={['No', 'Yes']}
				values={[
					Permissions.AssignTemporaryDutyPosition.NO,
					Permissions.AssignTemporaryDutyPosition.YES,
				]}
				defaultValue={Permissions.AssignTemporaryDutyPosition.NO}
			/>

			<Label key="16">Event contact sheet</Label>
			<EnumSelect<Permissions.EventContactSheet>
				key="17"
				name="EventContactSheet"
				labels={['No', 'Yes']}
				values={[Permissions.EventContactSheet.NO, Permissions.EventContactSheet.YES]}
				defaultValue={Permissions.EventContactSheet.NO}
			/>

			<Label key="18">Event link list</Label>
			<EnumSelect<Permissions.EventLinkList>
				key="19"
				name="EventLinkList"
				labels={['No', 'Yes']}
				values={[Permissions.EventLinkList.NO, Permissions.EventLinkList.YES]}
				defaultValue={Permissions.EventLinkList.NO}
			/>

			<Label key="20">ORM OPORD</Label>
			<EnumSelect<Permissions.ORMOPORD>
				key="21"
				name="ORMOPORD"
				labels={['No', 'Yes']}
				values={[Permissions.ORMOPORD.NO, Permissions.ORMOPORD.YES]}
				defaultValue={Permissions.ORMOPORD.NO}
			/>

			<Label key="24">Create notifications</Label>
			<EnumSelect<Permissions.Notify>
				key="25"
				name="CreateNotifications"
				labels={['None', 'Global']}
				values={[Permissions.Notify.NO, Permissions.Notify.GLOBAL]}
				defaultValue={Permissions.Notify.NO}
			/>

			<Label key="26">Manage events</Label>
			<EnumSelect<Permissions.ManageEvent>
				key="27"
				name="ManageEvent"
				labels={['No', 'Add draft events', 'Full']}
				values={[
					Permissions.ManageEvent.NONE,
					Permissions.ManageEvent.ADDDRAFTEVENTS,
					Permissions.ManageEvent.FULL,
				]}
				defaultValue={Permissions.ManageEvent.NONE}
			/>

			<Label key="28">Manage teams</Label>
			<EnumSelect<Permissions.ManageTeam>
				key="29"
				name="ManageTeam"
				labels={['No', 'Yes']}
				values={[Permissions.ManageTeam.NONE, Permissions.ManageTeam.FULL]}
				defaultValue={Permissions.ManageTeam.NONE}
			/>

			<Label key="30">Set up Event Attendance Scanners</Label>
			<EnumSelect<Permissions.ScanAdd>
				key="31"
				name="ScanAdd"
				labels={['No', 'Yes']}
				values={[Permissions.ScanAdd.NO, Permissions.ScanAdd.YES]}
				defaultValue={Permissions.ScanAdd.NO}
			/>

			<Label key="32">View attendance</Label>
			<EnumSelect<Permissions.AttendanceView>
				key="33"
				name="AttendanceView"
				labels={['Personal', 'Others']}
				values={[Permissions.AttendanceView.PERSONAL, Permissions.AttendanceView.OTHER]}
				defaultValue={Permissions.AttendanceView.PERSONAL}
			/>

			<Label key="35">Permission management</Label>
			<EnumSelect<Permissions.PermissionManagement>
				key="36"
				name="PermissionManagement"
				labels={['No', 'Yes']}
				values={[
					Permissions.PermissionManagement.NONE,
					Permissions.PermissionManagement.FULL,
				]}
				defaultValue={Permissions.PermissionManagement.NONE}
			/>

			<Label key="37">View admin notifications</Label>
			<EnumSelect<Permissions.ViewAccountNotifications>
				key="38"
				name="ViewAccountNotifications"
				labels={['No', 'Yes']}
				values={[
					Permissions.ViewAccountNotifications.NO,
					Permissions.ViewAccountNotifications.YES,
				]}
				defaultValue={Permissions.ViewAccountNotifications.NO}
			/>

			<Label key="39">Configure website</Label>
			<EnumSelect<Permissions.RegistryEdit>
				key="40"
				name="RegistryEdit"
				labels={['No', 'Yes']}
				values={[Permissions.RegistryEdit.NO, Permissions.RegistryEdit.YES]}
				defaultValue={Permissions.RegistryEdit.NO}
			/>
		</FormBlock>
	);

	private renderAdvancedGroupInput = (
		value: CAPGroupMemberPermissions,
		permissionlevel: PermissionLevel,
	): JSX.Element => (
		<FormBlock<PermissionFormValues>
			name="memberPermissionEditor"
			value={{
				...value,
				permissionlevel,
				showAdvanced: true,
			}}
			onFormChange={this.handleChange}
		>
			<Label>Permission level</Label>
			<Select<PermissionLevel>
				name="permissionlevel"
				labels={['Custom', 'Member', 'Cadet Staff', 'Manager', 'Admin']}
			/>

			<Label>Show full settings</Label>
			<Checkbox name="showAdvanced" index={this.props.index} />

			<Label key="2">Assign tasks</Label>
			<EnumSelect<Permissions.AssignTasks>
				key="3"
				name="AssignTasks"
				labels={['No', 'Yes']}
				values={[Permissions.AssignTasks.NO, Permissions.AssignTasks.YES]}
				defaultValue={Permissions.AssignTasks.NO}
			/>

			<Label key="4">File management</Label>
			<EnumSelect<Permissions.FileManagement>
				key="5"
				name="FileManagement"
				labels={['Default', 'Full']}
				values={[Permissions.FileManagement.NONE, Permissions.FileManagement.FULL]}
				defaultValue={Permissions.FileManagement.NONE}
			/>

			<Label key="14">Assign temporary duty positions</Label>
			<EnumSelect<Permissions.AssignTemporaryDutyPosition>
				key="15"
				name="AssignTemporaryDutyPositions"
				labels={['No', 'Yes']}
				values={[
					Permissions.AssignTemporaryDutyPosition.NO,
					Permissions.AssignTemporaryDutyPosition.YES,
				]}
				defaultValue={Permissions.AssignTemporaryDutyPosition.NO}
			/>

			<Label key="16">Event contact sheet</Label>
			<EnumSelect<Permissions.EventContactSheet>
				key="17"
				name="EventContactSheet"
				labels={['No', 'Yes']}
				values={[Permissions.EventContactSheet.NO, Permissions.EventContactSheet.YES]}
				defaultValue={Permissions.EventContactSheet.NO}
			/>

			<Label key="18">Event link list</Label>
			<EnumSelect<Permissions.EventLinkList>
				key="19"
				name="EventLinkList"
				labels={['No', 'Yes']}
				values={[Permissions.EventLinkList.NO, Permissions.EventLinkList.YES]}
				defaultValue={Permissions.EventLinkList.NO}
			/>

			<Label key="20">ORM OPORD</Label>
			<EnumSelect<Permissions.ORMOPORD>
				key="21"
				name="ORMOPORD"
				labels={['No', 'Yes']}
				values={[Permissions.ORMOPORD.NO, Permissions.ORMOPORD.YES]}
				defaultValue={Permissions.ORMOPORD.NO}
			/>

			<Label key="24">Create notifications</Label>
			<EnumSelect<Permissions.Notify>
				key="25"
				name="CreateNotifications"
				labels={['None', 'Global']}
				values={[Permissions.Notify.NO, Permissions.Notify.GLOBAL]}
				defaultValue={Permissions.Notify.NO}
			/>

			<Label key="26">Manage events</Label>
			<EnumSelect<Permissions.ManageEvent>
				key="27"
				name="ManageEvent"
				labels={['No', 'Add draft events', 'Full']}
				values={[
					Permissions.ManageEvent.NONE,
					Permissions.ManageEvent.ADDDRAFTEVENTS,
					Permissions.ManageEvent.FULL,
				]}
				defaultValue={Permissions.ManageEvent.NONE}
			/>

			<Label key="28">Manage teams</Label>
			<EnumSelect<Permissions.ManageTeam>
				key="29"
				name="ManageTeam"
				labels={['No', 'Yes']}
				values={[Permissions.ManageTeam.NONE, Permissions.ManageTeam.FULL]}
				defaultValue={Permissions.ManageTeam.NONE}
			/>

			<Label key="30">Set up Event Attendance Scanners</Label>
			<EnumSelect<Permissions.ScanAdd>
				key="31"
				name="ScanAdd"
				labels={['No', 'Yes']}
				values={[Permissions.ScanAdd.NO, Permissions.ScanAdd.YES]}
				defaultValue={Permissions.ScanAdd.NO}
			/>

			<Label key="32">View attendance</Label>
			<EnumSelect<Permissions.AttendanceView>
				key="33"
				name="AttendanceView"
				labels={['Personal', 'Others']}
				values={[Permissions.AttendanceView.PERSONAL, Permissions.AttendanceView.OTHER]}
				defaultValue={Permissions.AttendanceView.PERSONAL}
			/>

			<Label key="35">Permission management</Label>
			<EnumSelect<Permissions.PermissionManagement>
				key="36"
				name="PermissionManagement"
				labels={['No', 'Yes']}
				values={[
					Permissions.PermissionManagement.NONE,
					Permissions.PermissionManagement.FULL,
				]}
				defaultValue={Permissions.PermissionManagement.NONE}
			/>

			<Label key="37">View admin notifications</Label>
			<EnumSelect<Permissions.ViewAccountNotifications>
				key="38"
				name="ViewAccountNotifications"
				labels={['No', 'Yes']}
				values={[
					Permissions.ViewAccountNotifications.NO,
					Permissions.ViewAccountNotifications.YES,
				]}
				defaultValue={Permissions.ViewAccountNotifications.NO}
			/>

			<Label key="39">Configure website</Label>
			<EnumSelect<Permissions.RegistryEdit>
				key="40"
				name="RegistryEdit"
				labels={['No', 'Yes']}
				values={[Permissions.RegistryEdit.NO, Permissions.RegistryEdit.YES]}
				defaultValue={Permissions.RegistryEdit.NO}
			/>
		</FormBlock>
	);

	private renderAdvancedWingInput = (
		value: CAPWingMemberPermissions,
		permissionlevel: PermissionLevel,
	): JSX.Element => (
		<FormBlock<PermissionFormValues>
			name="memberPermissionEditor"
			value={{
				...value,
				permissionlevel,
				showAdvanced: true,
			}}
			onFormChange={this.handleChange}
		>
			<Label>Permission level</Label>
			<Select<PermissionLevel>
				name="permissionlevel"
				labels={['Custom', 'Member', 'Cadet Staff', 'Manager', 'Admin']}
			/>

			<Label>Show full settings</Label>
			<Checkbox name="showAdvanced" index={this.props.index} />

			<Label key="2">Assign tasks</Label>
			<EnumSelect<Permissions.AssignTasks>
				key="3"
				name="AssignTasks"
				labels={['No', 'Yes']}
				values={[Permissions.AssignTasks.NO, Permissions.AssignTasks.YES]}
				defaultValue={Permissions.AssignTasks.NO}
			/>

			<Label key="4">File management</Label>
			<EnumSelect<Permissions.FileManagement>
				key="5"
				name="FileManagement"
				labels={['Default', 'Full']}
				values={[Permissions.FileManagement.NONE, Permissions.FileManagement.FULL]}
				defaultValue={Permissions.FileManagement.NONE}
			/>

			<Label key="14">Assign temporary duty positions</Label>
			<EnumSelect<Permissions.AssignTemporaryDutyPosition>
				key="15"
				name="AssignTemporaryDutyPositions"
				labels={['No', 'Yes']}
				values={[
					Permissions.AssignTemporaryDutyPosition.NO,
					Permissions.AssignTemporaryDutyPosition.YES,
				]}
				defaultValue={Permissions.AssignTemporaryDutyPosition.NO}
			/>

			<Label key="16">Event contact sheet</Label>
			<EnumSelect<Permissions.EventContactSheet>
				key="17"
				name="EventContactSheet"
				labels={['No', 'Yes']}
				values={[Permissions.EventContactSheet.NO, Permissions.EventContactSheet.YES]}
				defaultValue={Permissions.EventContactSheet.NO}
			/>

			<Label key="18">Event link list</Label>
			<EnumSelect<Permissions.EventLinkList>
				key="19"
				name="EventLinkList"
				labels={['No', 'Yes']}
				values={[Permissions.EventLinkList.NO, Permissions.EventLinkList.YES]}
				defaultValue={Permissions.EventLinkList.NO}
			/>

			<Label key="20">ORM OPORD</Label>
			<EnumSelect<Permissions.ORMOPORD>
				key="21"
				name="ORMOPORD"
				labels={['No', 'Yes']}
				values={[Permissions.ORMOPORD.NO, Permissions.ORMOPORD.YES]}
				defaultValue={Permissions.ORMOPORD.NO}
			/>

			<Label key="24">Create notifications</Label>
			<EnumSelect<Permissions.Notify>
				key="25"
				name="CreateNotifications"
				labels={['None', 'Global']}
				values={[Permissions.Notify.NO, Permissions.Notify.GLOBAL]}
				defaultValue={Permissions.Notify.NO}
			/>

			<Label key="26">Manage events</Label>
			<EnumSelect<Permissions.ManageEvent>
				key="27"
				name="ManageEvent"
				labels={['No', 'Add draft events', 'Full']}
				values={[
					Permissions.ManageEvent.NONE,
					Permissions.ManageEvent.ADDDRAFTEVENTS,
					Permissions.ManageEvent.FULL,
				]}
				defaultValue={Permissions.ManageEvent.NONE}
			/>

			<Label key="28">Manage teams</Label>
			<EnumSelect<Permissions.ManageTeam>
				key="29"
				name="ManageTeam"
				labels={['No', 'Yes']}
				values={[Permissions.ManageTeam.NONE, Permissions.ManageTeam.FULL]}
				defaultValue={Permissions.ManageTeam.NONE}
			/>

			<Label key="30">Set up Event Attendance Scanners</Label>
			<EnumSelect<Permissions.ScanAdd>
				key="31"
				name="ScanAdd"
				labels={['No', 'Yes']}
				values={[Permissions.ScanAdd.NO, Permissions.ScanAdd.YES]}
				defaultValue={Permissions.ScanAdd.NO}
			/>

			<Label key="32">View attendance</Label>
			<EnumSelect<Permissions.AttendanceView>
				key="33"
				name="AttendanceView"
				labels={['Personal', 'Others']}
				values={[Permissions.AttendanceView.PERSONAL, Permissions.AttendanceView.OTHER]}
				defaultValue={Permissions.AttendanceView.PERSONAL}
			/>

			<Label key="35">Permission management</Label>
			<EnumSelect<Permissions.PermissionManagement>
				key="36"
				name="PermissionManagement"
				labels={['No', 'Yes']}
				values={[
					Permissions.PermissionManagement.NONE,
					Permissions.PermissionManagement.FULL,
				]}
				defaultValue={Permissions.PermissionManagement.NONE}
			/>

			<Label key="37">View admin notifications</Label>
			<EnumSelect<Permissions.ViewAccountNotifications>
				key="38"
				name="ViewAccountNotifications"
				labels={['No', 'Yes']}
				values={[
					Permissions.ViewAccountNotifications.NO,
					Permissions.ViewAccountNotifications.YES,
				]}
				defaultValue={Permissions.ViewAccountNotifications.NO}
			/>

			<Label key="39">Configure website</Label>
			<EnumSelect<Permissions.RegistryEdit>
				key="40"
				name="RegistryEdit"
				labels={['No', 'Yes']}
				values={[Permissions.RegistryEdit.NO, Permissions.RegistryEdit.YES]}
				defaultValue={Permissions.RegistryEdit.NO}
			/>

			<Label key="41">Create Event Account</Label>
			<EnumSelect<Permissions.CreateEventAccount>
				key="42"
				name="CreateEventAccount"
				labels={['No', 'Yes']}
				values={[Permissions.CreateEventAccount.NO, Permissions.CreateEventAccount.YES]}
				defaultValue={Permissions.CreateEventAccount.NO}
			/>
		</FormBlock>
	);

	private renderAdvancedRegionInput = (
		value: CAPRegionMemberPermissions,
		permissionlevel: PermissionLevel,
	): JSX.Element => (
		<FormBlock<PermissionFormValues>
			name="memberPermissionEditor"
			value={{
				...value,
				permissionlevel,
				showAdvanced: true,
			}}
			onFormChange={this.handleChange}
		>
			<Label>Permission level</Label>
			<Select<PermissionLevel>
				name="permissionlevel"
				labels={['Custom', 'Member', 'Cadet Staff', 'Manager', 'Admin']}
			/>

			<Label>Show full settings</Label>
			<Checkbox name="showAdvanced" index={this.props.index} />

			<Label key="2">Assign tasks</Label>
			<EnumSelect<Permissions.AssignTasks>
				key="3"
				name="AssignTasks"
				labels={['No', 'Yes']}
				values={[Permissions.AssignTasks.NO, Permissions.AssignTasks.YES]}
				defaultValue={Permissions.AssignTasks.NO}
			/>

			<Label key="4">File management</Label>
			<EnumSelect<Permissions.FileManagement>
				key="5"
				name="FileManagement"
				labels={['Default', 'Full']}
				values={[Permissions.FileManagement.NONE, Permissions.FileManagement.FULL]}
				defaultValue={Permissions.FileManagement.NONE}
			/>

			<Label key="14">Assign temporary duty positions</Label>
			<EnumSelect<Permissions.AssignTemporaryDutyPosition>
				key="15"
				name="AssignTemporaryDutyPositions"
				labels={['No', 'Yes']}
				values={[
					Permissions.AssignTemporaryDutyPosition.NO,
					Permissions.AssignTemporaryDutyPosition.YES,
				]}
				defaultValue={Permissions.AssignTemporaryDutyPosition.NO}
			/>

			<Label key="16">Event contact sheet</Label>
			<EnumSelect<Permissions.EventContactSheet>
				key="17"
				name="EventContactSheet"
				labels={['No', 'Yes']}
				values={[Permissions.EventContactSheet.NO, Permissions.EventContactSheet.YES]}
				defaultValue={Permissions.EventContactSheet.NO}
			/>

			<Label key="18">Event link list</Label>
			<EnumSelect<Permissions.EventLinkList>
				key="19"
				name="EventLinkList"
				labels={['No', 'Yes']}
				values={[Permissions.EventLinkList.NO, Permissions.EventLinkList.YES]}
				defaultValue={Permissions.EventLinkList.NO}
			/>

			<Label key="20">ORM OPORD</Label>
			<EnumSelect<Permissions.ORMOPORD>
				key="21"
				name="ORMOPORD"
				labels={['No', 'Yes']}
				values={[Permissions.ORMOPORD.NO, Permissions.ORMOPORD.YES]}
				defaultValue={Permissions.ORMOPORD.NO}
			/>

			<Label key="24">Create notifications</Label>
			<EnumSelect<Permissions.Notify>
				key="25"
				name="CreateNotifications"
				labels={['None', 'Global']}
				values={[Permissions.Notify.NO, Permissions.Notify.GLOBAL]}
				defaultValue={Permissions.Notify.NO}
			/>

			<Label key="26">Manage events</Label>
			<EnumSelect<Permissions.ManageEvent>
				key="27"
				name="ManageEvent"
				labels={['No', 'Add draft events', 'Full']}
				values={[
					Permissions.ManageEvent.NONE,
					Permissions.ManageEvent.ADDDRAFTEVENTS,
					Permissions.ManageEvent.FULL,
				]}
				defaultValue={Permissions.ManageEvent.NONE}
			/>

			<Label key="28">Manage teams</Label>
			<EnumSelect<Permissions.ManageTeam>
				key="29"
				name="ManageTeam"
				labels={['No', 'Yes']}
				values={[Permissions.ManageTeam.NONE, Permissions.ManageTeam.FULL]}
				defaultValue={Permissions.ManageTeam.NONE}
			/>

			<Label key="30">Set up Event Attendance Scanners</Label>
			<EnumSelect<Permissions.ScanAdd>
				key="31"
				name="ScanAdd"
				labels={['No', 'Yes']}
				values={[Permissions.ScanAdd.NO, Permissions.ScanAdd.YES]}
				defaultValue={Permissions.ScanAdd.NO}
			/>

			<Label key="32">View attendance</Label>
			<EnumSelect<Permissions.AttendanceView>
				key="33"
				name="AttendanceView"
				labels={['Personal', 'Others']}
				values={[Permissions.AttendanceView.PERSONAL, Permissions.AttendanceView.OTHER]}
				defaultValue={Permissions.AttendanceView.PERSONAL}
			/>

			<Label key="35">Permission management</Label>
			<EnumSelect<Permissions.PermissionManagement>
				key="36"
				name="PermissionManagement"
				labels={['No', 'Yes']}
				values={[
					Permissions.PermissionManagement.NONE,
					Permissions.PermissionManagement.FULL,
				]}
				defaultValue={Permissions.PermissionManagement.NONE}
			/>

			<Label key="37">View admin notifications</Label>
			<EnumSelect<Permissions.ViewAccountNotifications>
				key="38"
				name="ViewAccountNotifications"
				labels={['No', 'Yes']}
				values={[
					Permissions.ViewAccountNotifications.NO,
					Permissions.ViewAccountNotifications.YES,
				]}
				defaultValue={Permissions.ViewAccountNotifications.NO}
			/>

			<Label key="39">Configure website</Label>
			<EnumSelect<Permissions.RegistryEdit>
				key="40"
				name="RegistryEdit"
				labels={['No', 'Yes']}
				values={[Permissions.RegistryEdit.NO, Permissions.RegistryEdit.YES]}
				defaultValue={Permissions.RegistryEdit.NO}
			/>

			<Label key="41">Create Event Account</Label>
			<EnumSelect<Permissions.CreateEventAccount>
				key="42"
				name="CreateEventAccount"
				labels={['No', 'Yes']}
				values={[Permissions.CreateEventAccount.NO, Permissions.CreateEventAccount.YES]}
				defaultValue={Permissions.CreateEventAccount.NO}
			/>
		</FormBlock>
	);
}
