import { MemberPermissions } from 'common-lib';
import {
	AdministerPT,
	AssignTasks,
	AssignTemporaryDutyPosition,
	DownloadCAPWATCH,
	EventContactSheet,
	EventLinkList,
	FileManagement,
	FlightAssign,
	ManageEvent,
	ManageTeam,
	MusterSheet,
	Notify,
	ORMOPORD,
	PermissionManagement,
	PromotionManagement,
	ProspectiveMemberManagement,
	PTSheet,
	RegistryEdit
} from 'common-lib/permissions';
import * as React from 'react';
import { deepCompare } from '../../pages/Page';
import { FormBlock, Label, Checkbox } from '../forms/Form';
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
	RegistryEdit: values.RegistryEdit
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
				<Select<AdministerPT> key="1" name="AdministerPT" labels={['No', 'Yes']} />

				<Label key="2">Assign tasks</Label>
				<Select<AssignTasks> key="3" name="AssignTasks" labels={['No', 'Yes']} />

				<Label key="4">File management</Label>
				<Select<FileManagement> key="5" name="FileManagement" labels={['No', 'Yes']} />

				<Label key="6">Flight Assign</Label>
				<Select<FlightAssign> key="7" name="FlightAssign" labels={['No', 'Yes']} />

				<Label key="8">Muster sheet</Label>
				<Select<MusterSheet> key="9" name="MusterSheet" labels={['No', 'Yes']} />

				<Label key="10">PT Sheet Management</Label>
				<Select<PTSheet> key="11" name="PTSheet" labels={['No', 'Yes']} />

				<Label key="12">Promotion Management</Label>
				<Select<PromotionManagement>
					key="13"
					name="PromotionManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="14">Assign temporary duty positions</Label>
				<Select<AssignTemporaryDutyPosition>
					key="15"
					name="AssignTemporaryDutyPositions"
					labels={['No', 'Yes']}
				/>

				<Label key="16">Event contact sheet</Label>
				<Select<EventContactSheet>
					key="17"
					name="EventContactSheet"
					labels={['No', 'Yes']}
				/>

				<Label key="18">Event link list</Label>
				<Select<EventLinkList> key="19" name="EventLinkList" labels={['No', 'Yes']} />

				<Label key="20">ORM OPORD</Label>
				<Select<ORMOPORD> key="21" name="ORMOPORD" labels={['No', 'Yes']} />

				<Label key="22">Prospective Member Management</Label>
				<Select<ProspectiveMemberManagement>
					key="23"
					name="ProspectiveMemberManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="24">Create notifications</Label>
				<Select<Notify> key="25" name="CreateNotifications" labels={['None', 'Global']} />

				<Label key="26">Manage events</Label>
				<Select<ManageEvent>
					key="27"
					name="ManageEvent"
					labels={['No', 'Add draft events', 'Full']}
				/>

				<Label key="28">Manage teams</Label>
				<Select<ManageTeam> key="29" name="ManageTeam" labels={['No', 'Yes']} />

				<Label key="30">Download CAPWATCH files</Label>
				<Select<DownloadCAPWATCH> key="31" name="DownloadCAPWATCH" labels={['No', 'Yes']} />

				<Label key="32">Permission management</Label>
				<Select<PermissionManagement>
					key="33"
					name="PermissionManagement"
					labels={['No', 'Yes']}
				/>

				<Label key="34">Configure website</Label>
				<Select<RegistryEdit> key="35" name="RegistryEdit" labels={['No', 'Yes']} />
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
