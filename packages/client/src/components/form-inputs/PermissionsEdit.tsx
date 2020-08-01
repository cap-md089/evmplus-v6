/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
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
	CAPSquadronMemberPermissions
} from 'common-lib';
import * as React from 'react';
import { deepCompare } from '../../pages/Page';
import { Checkbox, FormBlock, Label } from '../forms/SimpleForm';
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
	ADMIN
}

type PermissionFormValues = MemberPermissions & {
	permissionlevel: PermissionLevel;
	showAdvanced: boolean;
};

const stripPermissionLevel = (values: PermissionFormValues): MemberPermissions =>
	stripProp('permissionlevel')(stripProp('showAdvanced')(values)) as MemberPermissions;

const permissionLevelFromPermissions = (accountType: AccountType) => (
	permissions: MemberPermissions
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
		showAdvanced: false
	};

	constructor(props: PermissionsEditProps) {
		super(props);

		if (this.props.onInitialize) {
			const value = this.props.value || getDefaultMemberPermissions(this.props.account.type);

			this.props.onInitialize({
				name: this.props.name,
				value
			});
		}

		this.handleChange = this.handleChange.bind(this);
	}

	public render() {
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
					showAdvanced
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

	private handleChange(
		values: PermissionFormValues,
		err: BooleanForField<PermissionFormValues>,
		chang: BooleanForField<PermissionFormValues>,
		err2: boolean,
		changedField: keyof PermissionFormValues
	) {
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
				showAdvanced: values.showAdvanced
			});
		}

		this.props.onChange?.(newValues);

		this.props.onUpdate?.({
			name: this.props.name,
			value: newValues
		});
	}

	private renderAdvancedInput(value: MemberPermissions, level: PermissionLevel) {
		return value.type === AccountType.CAPEVENT
			? this.renderAdvancedEventInput(value, level)
			: value.type === AccountType.CAPSQUADRON
			? this.renderAdvancedSquadronInput(value, level)
			: value.type === AccountType.CAPGROUP
			? this.renderAdvancedGroupInput(value, level)
			: value.type === AccountType.CAPWING
			? this.renderAdvancedWingInput(value, level)
			: this.renderAdvancedRegionInput(value, level);
	}

	private renderAdvancedSquadronInput(
		value: CAPSquadronMemberPermissions,
		permissionlevel: PermissionLevel
	) {
		return (
			<FormBlock<PermissionFormValues>
				name="memberPermissionEditor"
				value={{
					...value,
					permissionlevel,
					showAdvanced: true
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
				<Select<Permissions.AdministerPT>
					key="1"
					name="AdministerPT"
					labels={['No', 'Yes']}
				/>

				<Label key="2">Assign tasks</Label>
				<Select<Permissions.AssignTasks>
					key="3"
					name="AssignTasks"
					labels={['No', 'Yes']}
				/>

				<Label key="4">File management</Label>
				<Select<Permissions.FileManagement>
					key="5"
					name="FileManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="6">Flight Assign</Label>
				<Select<Permissions.FlightAssign>
					key="7"
					name="FlightAssign"
					labels={['No', 'Yes']}
				/>

				<Label key="8">Muster sheet</Label>
				<Select<Permissions.MusterSheet>
					key="9"
					name="MusterSheet"
					labels={['No', 'Yes']}
				/>

				<Label key="10">PT Sheet Management</Label>
				<Select<Permissions.PTSheet> key="11" name="PTSheet" labels={['No', 'Yes']} />

				<Label key="12">Promotion Management</Label>
				<Select<Permissions.PromotionManagement>
					key="13"
					name="PromotionManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="14">Assign temporary duty positions</Label>
				<Select<Permissions.AssignTemporaryDutyPosition>
					key="15"
					name="AssignTemporaryDutyPositions"
					labels={['No', 'Yes']}
				/>

				<Label key="16">Event contact sheet</Label>
				<Select<Permissions.EventContactSheet>
					key="17"
					name="EventContactSheet"
					labels={['No', 'Yes']}
				/>

				<Label key="18">Event link list</Label>
				<Select<Permissions.EventLinkList>
					key="19"
					name="EventLinkList"
					labels={['No', 'Yes']}
				/>

				<Label key="20">ORM OPORD</Label>
				<Select<Permissions.ORMOPORD> key="21" name="ORMOPORD" labels={['No', 'Yes']} />

				<Label key="22">Prospective Member Management</Label>
				<Select<Permissions.ProspectiveMemberManagement>
					key="23"
					name="ProspectiveMemberManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="24">Create notifications</Label>
				<Select<Permissions.Notify>
					key="25"
					name="CreateNotifications"
					labels={['None', 'Global']}
				/>

				<Label key="26">Manage events</Label>
				<Select<Permissions.ManageEvent>
					key="27"
					name="ManageEvent"
					labels={['No', 'Add draft events', 'Full']}
				/>

				<Label key="28">Manage teams</Label>
				<Select<Permissions.ManageTeam> key="29" name="ManageTeam" labels={['No', 'Yes']} />

				<Label key="30">Set up Event Attendance Scanners</Label>
				<Select<Permissions.ScanAdd> key="31" name="ScanAdd" labels={['No', 'Yes']} />

				<Label key="32">View attendance</Label>
				<Select<Permissions.AttendanceView>
					key="33"
					name="AttendanceView"
					labels={['Peronsal', 'Others']}
				/>

				<Label key="35">Permission management</Label>
				<Select<Permissions.PermissionManagement>
					key="36"
					name="PermissionManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="37">View admin notifications</Label>
				<Select<Permissions.ViewAccountNotifications>
					key="38"
					name="ViewAccountNotifications"
					labels={['No', 'Yes']}
				/>

				<Label key="39">Configure website</Label>
				<Select<Permissions.RegistryEdit>
					key="40"
					name="RegistryEdit"
					labels={['No', 'Yes']}
				/>
			</FormBlock>
		);
	}

	private renderAdvancedEventInput(
		value: CAPEventMemberPermissions,
		permissionlevel: PermissionLevel
	) {
		return (
			<FormBlock<PermissionFormValues>
				name="memberPermissionEditor"
				value={{
					...value,
					permissionlevel,
					showAdvanced: true
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
				<Select<Permissions.AdministerPT>
					key="1"
					name="AdministerPT"
					labels={['No', 'Yes']}
				/>

				<Label key="2">Assign tasks</Label>
				<Select<Permissions.AssignTasks>
					key="3"
					name="AssignTasks"
					labels={['No', 'Yes']}
				/>

				<Label key="4">File management</Label>
				<Select<Permissions.FileManagement>
					key="5"
					name="FileManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="6">Flight Assign</Label>
				<Select<Permissions.FlightAssign>
					key="7"
					name="FlightAssign"
					labels={['No', 'Yes']}
				/>

				<Label key="8">Muster sheet</Label>
				<Select<Permissions.MusterSheet>
					key="9"
					name="MusterSheet"
					labels={['No', 'Yes']}
				/>

				<Label key="14">Assign temporary duty positions</Label>
				<Select<Permissions.AssignTemporaryDutyPosition>
					key="15"
					name="AssignTemporaryDutyPositions"
					labels={['No', 'Yes']}
				/>

				<Label key="16">Event contact sheet</Label>
				<Select<Permissions.EventContactSheet>
					key="17"
					name="EventContactSheet"
					labels={['No', 'Yes']}
				/>

				<Label key="18">Event link list</Label>
				<Select<Permissions.EventLinkList>
					key="19"
					name="EventLinkList"
					labels={['No', 'Yes']}
				/>

				<Label key="20">ORM OPORD</Label>
				<Select<Permissions.ORMOPORD> key="21" name="ORMOPORD" labels={['No', 'Yes']} />

				<Label key="24">Create notifications</Label>
				<Select<Permissions.Notify>
					key="25"
					name="CreateNotifications"
					labels={['None', 'Global']}
				/>

				<Label key="26">Manage events</Label>
				<Select<Permissions.ManageEvent>
					key="27"
					name="ManageEvent"
					labels={['No', 'Add draft events', 'Full']}
				/>

				<Label key="28">Manage teams</Label>
				<Select<Permissions.ManageTeam> key="29" name="ManageTeam" labels={['No', 'Yes']} />

				<Label key="30">Set up Event Attendance Scanners</Label>
				<Select<Permissions.ScanAdd> key="31" name="ScanAdd" labels={['No', 'Yes']} />

				<Label key="32">View attendance</Label>
				<Select<Permissions.AttendanceView>
					key="33"
					name="AttendanceView"
					labels={['Peronsal', 'Others']}
				/>

				<Label key="35">Permission management</Label>
				<Select<Permissions.PermissionManagement>
					key="36"
					name="PermissionManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="37">View admin notifications</Label>
				<Select<Permissions.ViewAccountNotifications>
					key="38"
					name="ViewAccountNotifications"
					labels={['No', 'Yes']}
				/>

				<Label key="39">Configure website</Label>
				<Select<Permissions.RegistryEdit>
					key="40"
					name="RegistryEdit"
					labels={['No', 'Yes']}
				/>
			</FormBlock>
		);
	}

	private renderAdvancedGroupInput(
		value: CAPGroupMemberPermissions,
		permissionlevel: PermissionLevel
	) {
		return (
			<FormBlock<PermissionFormValues>
				name="memberPermissionEditor"
				value={{
					...value,
					permissionlevel,
					showAdvanced: true
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
				<Select<Permissions.AssignTasks>
					key="3"
					name="AssignTasks"
					labels={['No', 'Yes']}
				/>

				<Label key="4">File management</Label>
				<Select<Permissions.FileManagement>
					key="5"
					name="FileManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="14">Assign temporary duty positions</Label>
				<Select<Permissions.AssignTemporaryDutyPosition>
					key="15"
					name="AssignTemporaryDutyPositions"
					labels={['No', 'Yes']}
				/>

				<Label key="16">Event contact sheet</Label>
				<Select<Permissions.EventContactSheet>
					key="17"
					name="EventContactSheet"
					labels={['No', 'Yes']}
				/>

				<Label key="18">Event link list</Label>
				<Select<Permissions.EventLinkList>
					key="19"
					name="EventLinkList"
					labels={['No', 'Yes']}
				/>

				<Label key="20">ORM OPORD</Label>
				<Select<Permissions.ORMOPORD> key="21" name="ORMOPORD" labels={['No', 'Yes']} />

				<Label key="24">Create notifications</Label>
				<Select<Permissions.Notify>
					key="25"
					name="CreateNotifications"
					labels={['None', 'Global']}
				/>

				<Label key="26">Manage events</Label>
				<Select<Permissions.ManageEvent>
					key="27"
					name="ManageEvent"
					labels={['No', 'Add draft events', 'Full']}
				/>

				<Label key="28">Manage teams</Label>
				<Select<Permissions.ManageTeam> key="29" name="ManageTeam" labels={['No', 'Yes']} />

				<Label key="30">Set up Event Attendance Scanners</Label>
				<Select<Permissions.ScanAdd> key="31" name="ScanAdd" labels={['No', 'Yes']} />

				<Label key="32">View attendance</Label>
				<Select<Permissions.AttendanceView>
					key="33"
					name="AttendanceView"
					labels={['Peronsal', 'Others']}
				/>

				<Label key="35">Permission management</Label>
				<Select<Permissions.PermissionManagement>
					key="36"
					name="PermissionManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="37">View admin notifications</Label>
				<Select<Permissions.ViewAccountNotifications>
					key="38"
					name="ViewAccountNotifications"
					labels={['No', 'Yes']}
				/>

				<Label key="39">Configure website</Label>
				<Select<Permissions.RegistryEdit>
					key="40"
					name="RegistryEdit"
					labels={['No', 'Yes']}
				/>
			</FormBlock>
		);
	}

	private renderAdvancedWingInput(
		value: CAPWingMemberPermissions,
		permissionlevel: PermissionLevel
	) {
		return (
			<FormBlock<PermissionFormValues>
				name="memberPermissionEditor"
				value={{
					...value,
					permissionlevel,
					showAdvanced: true
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
				<Select<Permissions.AssignTasks>
					key="3"
					name="AssignTasks"
					labels={['No', 'Yes']}
				/>

				<Label key="4">File management</Label>
				<Select<Permissions.FileManagement>
					key="5"
					name="FileManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="14">Assign temporary duty positions</Label>
				<Select<Permissions.AssignTemporaryDutyPosition>
					key="15"
					name="AssignTemporaryDutyPositions"
					labels={['No', 'Yes']}
				/>

				<Label key="16">Event contact sheet</Label>
				<Select<Permissions.EventContactSheet>
					key="17"
					name="EventContactSheet"
					labels={['No', 'Yes']}
				/>

				<Label key="18">Event link list</Label>
				<Select<Permissions.EventLinkList>
					key="19"
					name="EventLinkList"
					labels={['No', 'Yes']}
				/>

				<Label key="20">ORM OPORD</Label>
				<Select<Permissions.ORMOPORD> key="21" name="ORMOPORD" labels={['No', 'Yes']} />

				<Label key="24">Create notifications</Label>
				<Select<Permissions.Notify>
					key="25"
					name="CreateNotifications"
					labels={['None', 'Global']}
				/>

				<Label key="26">Manage events</Label>
				<Select<Permissions.ManageEvent>
					key="27"
					name="ManageEvent"
					labels={['No', 'Add draft events', 'Full']}
				/>

				<Label key="28">Manage teams</Label>
				<Select<Permissions.ManageTeam> key="29" name="ManageTeam" labels={['No', 'Yes']} />

				<Label key="30">Set up Event Attendance Scanners</Label>
				<Select<Permissions.ScanAdd> key="31" name="ScanAdd" labels={['No', 'Yes']} />

				<Label key="32">View attendance</Label>
				<Select<Permissions.AttendanceView>
					key="33"
					name="AttendanceView"
					labels={['Peronsal', 'Others']}
				/>

				<Label key="35">Permission management</Label>
				<Select<Permissions.PermissionManagement>
					key="36"
					name="PermissionManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="37">View admin notifications</Label>
				<Select<Permissions.ViewAccountNotifications>
					key="38"
					name="ViewAccountNotifications"
					labels={['No', 'Yes']}
				/>

				<Label key="39">Configure website</Label>
				<Select<Permissions.RegistryEdit>
					key="40"
					name="RegistryEdit"
					labels={['No', 'Yes']}
				/>

				<Label key="41">Create Event Account</Label>
				<Select<Permissions.CreateEventAccount>
					key="42"
					name="CreateEventAccount"
					labels={['No', 'Yes']}
				/>
			</FormBlock>
		);
	}

	private renderAdvancedRegionInput(
		value: CAPRegionMemberPermissions,
		permissionlevel: PermissionLevel
	) {
		return (
			<FormBlock<PermissionFormValues>
				name="memberPermissionEditor"
				value={{
					...value,
					permissionlevel,
					showAdvanced: true
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
				<Select<Permissions.AssignTasks>
					key="3"
					name="AssignTasks"
					labels={['No', 'Yes']}
				/>

				<Label key="4">File management</Label>
				<Select<Permissions.FileManagement>
					key="5"
					name="FileManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="14">Assign temporary duty positions</Label>
				<Select<Permissions.AssignTemporaryDutyPosition>
					key="15"
					name="AssignTemporaryDutyPositions"
					labels={['No', 'Yes']}
				/>

				<Label key="16">Event contact sheet</Label>
				<Select<Permissions.EventContactSheet>
					key="17"
					name="EventContactSheet"
					labels={['No', 'Yes']}
				/>

				<Label key="18">Event link list</Label>
				<Select<Permissions.EventLinkList>
					key="19"
					name="EventLinkList"
					labels={['No', 'Yes']}
				/>

				<Label key="20">ORM OPORD</Label>
				<Select<Permissions.ORMOPORD> key="21" name="ORMOPORD" labels={['No', 'Yes']} />

				<Label key="24">Create notifications</Label>
				<Select<Permissions.Notify>
					key="25"
					name="CreateNotifications"
					labels={['None', 'Global']}
				/>

				<Label key="26">Manage events</Label>
				<Select<Permissions.ManageEvent>
					key="27"
					name="ManageEvent"
					labels={['No', 'Add draft events', 'Full']}
				/>

				<Label key="28">Manage teams</Label>
				<Select<Permissions.ManageTeam> key="29" name="ManageTeam" labels={['No', 'Yes']} />

				<Label key="30">Set up Event Attendance Scanners</Label>
				<Select<Permissions.ScanAdd> key="31" name="ScanAdd" labels={['No', 'Yes']} />

				<Label key="32">View attendance</Label>
				<Select<Permissions.AttendanceView>
					key="33"
					name="AttendanceView"
					labels={['Peronsal', 'Others']}
				/>

				<Label key="35">Permission management</Label>
				<Select<Permissions.PermissionManagement>
					key="36"
					name="PermissionManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="37">View admin notifications</Label>
				<Select<Permissions.ViewAccountNotifications>
					key="38"
					name="ViewAccountNotifications"
					labels={['No', 'Yes']}
				/>

				<Label key="39">Configure website</Label>
				<Select<Permissions.RegistryEdit>
					key="40"
					name="RegistryEdit"
					labels={['No', 'Yes']}
				/>

				<Label key="41">Create Event Account</Label>
				<Select<Permissions.CreateEventAccount>
					key="42"
					name="CreateEventAccount"
					labels={['No', 'Yes']}
				/>
			</FormBlock>
		);
	}
}
