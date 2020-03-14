import { MemberPermissions, Permissions } from 'common-lib';
import * as React from 'react';
import { deepCompare } from '../../pages/Page';
import { Checkbox, FormBlock, Label } from '../forms/SimpleForm';
import { BooleanForField } from './FormBlock';
import { InputProps } from './Input';
import Select from './Select';

export interface PermissionsEditProps extends InputProps<MemberPermissions> {}

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

export const Member: Readonly<MemberPermissions> = {
	AdministerPT: 0,
	AssignTasks: 0,
	FileManagement: 0,
	FlightAssign: 0,
	MusterSheet: 0,
	PTSheet: 0,
	PromotionManagement: 0,

	AssignTemporaryDutyPositions: 0,
	EventContactSheet: 0,
	EventLinkList: 0,
	ORMOPORD: 0,
	ProspectiveMemberManagement: 0,
	CreateNotifications: 0,
	ManageEvent: 0,
	ManageTeam: 0,
	ScanAdd: 0,

	DownloadCAPWATCH: 0,
	PermissionManagement: 0,
	RegistryEdit: 0
};

export const Staff: Readonly<MemberPermissions> = {
	AdministerPT: 1,
	AssignTasks: 1,
	FileManagement: 1,
	FlightAssign: 1,
	MusterSheet: 1,
	PTSheet: 1,
	PromotionManagement: 1,

	AssignTemporaryDutyPositions: 0,
	EventContactSheet: 0,
	EventLinkList: 0,
	ORMOPORD: 0,
	ProspectiveMemberManagement: 0,
	CreateNotifications: 0,
	ManageEvent: 1,
	ManageTeam: 0,
	ScanAdd: 0,

	DownloadCAPWATCH: 0,
	PermissionManagement: 0,
	RegistryEdit: 0
};

export const Manager: Readonly<MemberPermissions> = {
	AdministerPT: 1,
	AssignTasks: 1,
	FileManagement: 1,
	FlightAssign: 1,
	MusterSheet: 1,
	PTSheet: 1,
	PromotionManagement: 1,

	AssignTemporaryDutyPositions: 1,
	EventContactSheet: 1,
	EventLinkList: 1,
	ORMOPORD: 1,
	ProspectiveMemberManagement: 1,
	CreateNotifications: 1,
	ManageEvent: 2,
	ManageTeam: 1,
	ScanAdd: 1,

	DownloadCAPWATCH: 0,
	PermissionManagement: 0,
	RegistryEdit: 0
};

export const Admin: Readonly<MemberPermissions> = {
	AdministerPT: 1,
	AssignTasks: 1,
	FileManagement: 1,
	FlightAssign: 1,
	MusterSheet: 1,
	PTSheet: 1,
	PromotionManagement: 1,

	AssignTemporaryDutyPositions: 1,
	EventContactSheet: 1,
	EventLinkList: 1,
	ORMOPORD: 1,
	ProspectiveMemberManagement: 1,
	CreateNotifications: 1,
	ManageEvent: 2,
	ManageTeam: 1,
	ScanAdd: 1,

	DownloadCAPWATCH: 1,
	PermissionManagement: 1,
	RegistryEdit: 1
};

const stripPermissionLevel = (values: PermissionFormValues): MemberPermissions => ({
	AdministerPT: values.AdministerPT,
	AssignTasks: values.AssignTasks,
	AssignTemporaryDutyPositions: values.AssignTemporaryDutyPositions,
	CreateNotifications: values.CreateNotifications,
	DownloadCAPWATCH: values.DownloadCAPWATCH,
	EventContactSheet: values.EventContactSheet,
	EventLinkList: values.EventLinkList,
	FileManagement: values.FileManagement,
	FlightAssign: values.FlightAssign,
	ManageEvent: values.ManageEvent,
	ManageTeam: values.ManageTeam,
	MusterSheet: values.MusterSheet,
	ORMOPORD: values.ORMOPORD,
	PTSheet: values.PTSheet,
	PermissionManagement: values.PermissionManagement,
	PromotionManagement: values.PromotionManagement,
	ProspectiveMemberManagement: values.ProspectiveMemberManagement,
	RegistryEdit: values.RegistryEdit,
	ScanAdd: values.ScanAdd
});

const permissionLevelFromPermissions = (permissions: MemberPermissions): PermissionLevel =>
	deepCompare(permissions, Member)
		? PermissionLevel.MEMBER
		: deepCompare(permissions, Staff)
		? PermissionLevel.CADETSTAFF
		: deepCompare(permissions, Manager)
		? PermissionLevel.MANAGER
		: deepCompare(permissions, Admin)
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
			const value = this.props.value || {
				AdministerPT: 0,
				AssignTasks: 0,
				FileManagement: 0,
				FlightAssign: 0,
				MusterSheet: 0,
				PTSheet: 0,
				PromotionManagement: 0,

				AssignTemporaryDutyPositions: 0,
				EventContactSheet: 0,
				EventLinkList: 0,
				ORMOPORD: 0,
				ProspectiveMemberManagement: 0,
				CreateNotifications: 0,
				ManageEvent: 0,
				ManageTeam: 0,
				ScanAdd: 0,

				DownloadCAPWATCH: 0,
				PermissionManagement: 0,
				RegistryEdit: 0
			};

			this.props.onInitialize({
				name: this.props.name,
				value
			});
		}

		this.handleChange = this.handleChange.bind(this);
	}

	public render() {
		const value = this.props.value || {
			AdministerPT: 0,
			AssignTasks: 0,
			FileManagement: 0,
			FlightAssign: 0,
			MusterSheet: 0,
			PTSheet: 0,
			PromotionManagement: 0,

			AssignTemporaryDutyPositions: 0,
			EventContactSheet: 0,
			EventLinkList: 0,
			ORMOPORD: 0,
			ProspectiveMemberManagement: 0,
			CreateNotifications: 0,
			ManageEvent: 0,
			ManageTeam: 0,
			ScanAdd: 0,

			DownloadCAPWATCH: 0,
			PermissionManagement: 0,
			RegistryEdit: 0
		};

		const permissionlevel = permissionLevelFromPermissions(value);

		const { showAdvanced } = this.state;

		return showAdvanced ? (
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
				<Checkbox name="showAdvanced" />

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

				<Label key="32">Download CAPWATCH files</Label>
				<Select<Permissions.DownloadCAPWATCH>
					key="33"
					name="DownloadCAPWATCH"
					labels={['No', 'Yes']}
				/>

				<Label key="34">Permission management</Label>
				<Select<Permissions.PermissionManagement>
					key="35"
					name="PermissionManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="36">Configure website</Label>
				<Select<Permissions.RegistryEdit>
					key="37"
					name="RegistryEdit"
					labels={['No', 'Yes']}
				/>
			</FormBlock>
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
				<Checkbox name="showAdvanced" />
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
					newValues = Admin;
					break;
				case PermissionLevel.CADETSTAFF:
					newValues = Staff;
					break;
				case PermissionLevel.MANAGER:
					newValues = Manager;
					break;
				case PermissionLevel.MEMBER:
					newValues = Member;
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

		if (this.props.onChange) {
			this.props.onChange(newValues);
		}

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: newValues
			});
		}
	}
}
