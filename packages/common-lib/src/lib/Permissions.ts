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
	AccountType,
	CAPEventMemberPermissions,
	CAPGroupMemberPermissions,
	CAPRegionMemberPermissions,
	CAPSquadronMemberPermissions,
	CAPWingMemberPermissions,
	MemberPermissions,
	Permissions,
} from '../typings/types';

const CAPEventDefault: Readonly<CAPEventMemberPermissions> = {
	type: AccountType.CAPEVENT,

	// Staff privileges
	FlightAssign: Permissions.FlightAssign.NO,
	MusterSheet: Permissions.MusterSheet.NO,
	AssignTasks: Permissions.AssignTasks.NO,
	AdministerPT: Permissions.AdministerPT.NO,
	MemberSearch: Permissions.MemberSearch.NO,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.NONE,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
};

const CAPEventStaff: Readonly<CAPEventMemberPermissions> = {
	type: AccountType.CAPEVENT,

	// Staff privileges
	FlightAssign: Permissions.FlightAssign.YES,
	MusterSheet: Permissions.MusterSheet.YES,
	AssignTasks: Permissions.AssignTasks.YES,
	AdministerPT: Permissions.AdministerPT.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.ADDDRAFTEVENTS,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
};

const CAPEventManager: Readonly<CAPEventMemberPermissions> = {
	type: AccountType.CAPEVENT,

	// Staff privileges
	FlightAssign: Permissions.FlightAssign.YES,
	MusterSheet: Permissions.MusterSheet.YES,
	AssignTasks: Permissions.AssignTasks.YES,
	AdministerPT: Permissions.AdministerPT.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	ScanAdd: Permissions.ScanAdd.YES,
	AttendanceView: Permissions.AttendanceView.OTHER,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
};

const CAPEventAdmin: Readonly<CAPEventMemberPermissions> = {
	type: AccountType.CAPEVENT,

	// Staff privileges
	FlightAssign: Permissions.FlightAssign.YES,
	MusterSheet: Permissions.MusterSheet.YES,
	AssignTasks: Permissions.AssignTasks.YES,
	AdministerPT: Permissions.AdministerPT.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	ScanAdd: Permissions.ScanAdd.YES,
	AttendanceView: Permissions.AttendanceView.OTHER,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.FULL,
	CreateNotifications: Permissions.Notify.GLOBAL,
	RegistryEdit: Permissions.RegistryEdit.YES,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.YES,
};

const CAPSquadronDefault: Readonly<CAPSquadronMemberPermissions> = {
	type: AccountType.CAPSQUADRON,

	// Staff privileges
	FlightAssign: Permissions.FlightAssign.NO,
	MusterSheet: Permissions.MusterSheet.NO,
	PTSheet: Permissions.PTSheet.NO,
	PromotionManagement: Permissions.PromotionManagement.NONE,
	AssignTasks: Permissions.AssignTasks.NO,
	AdministerPT: Permissions.AdministerPT.NO,
	MemberSearch: Permissions.MemberSearch.NO,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.NONE,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,
	ProspectiveMemberManagement: Permissions.ProspectiveMemberManagement.NONE,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
};

const CAPSquadronStaff: Readonly<CAPSquadronMemberPermissions> = {
	type: AccountType.CAPSQUADRON,

	// Staff privileges
	FlightAssign: Permissions.FlightAssign.YES,
	MusterSheet: Permissions.MusterSheet.YES,
	PTSheet: Permissions.PTSheet.YES,
	PromotionManagement: Permissions.PromotionManagement.FULL,
	AssignTasks: Permissions.AssignTasks.YES,
	AdministerPT: Permissions.AdministerPT.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.ADDDRAFTEVENTS,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,
	ProspectiveMemberManagement: Permissions.ProspectiveMemberManagement.NONE,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
};

const CAPSquadronManager: Readonly<CAPSquadronMemberPermissions> = {
	type: AccountType.CAPSQUADRON,

	// Staff privileges
	FlightAssign: Permissions.FlightAssign.YES,
	MusterSheet: Permissions.MusterSheet.YES,
	PTSheet: Permissions.PTSheet.YES,
	PromotionManagement: Permissions.PromotionManagement.FULL,
	AssignTasks: Permissions.AssignTasks.YES,
	AdministerPT: Permissions.AdministerPT.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.OTHER,
	ProspectiveMemberManagement: Permissions.ProspectiveMemberManagement.FULL,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
};

const CAPSquadronAdmin: Readonly<CAPSquadronMemberPermissions> = {
	type: AccountType.CAPSQUADRON,

	// Staff privileges
	FlightAssign: Permissions.FlightAssign.YES,
	MusterSheet: Permissions.MusterSheet.YES,
	PTSheet: Permissions.PTSheet.YES,
	PromotionManagement: Permissions.PromotionManagement.FULL,
	AssignTasks: Permissions.AssignTasks.YES,
	AdministerPT: Permissions.AdministerPT.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.OTHER,
	ProspectiveMemberManagement: Permissions.ProspectiveMemberManagement.FULL,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.FULL,
	CreateNotifications: Permissions.Notify.GLOBAL,
	RegistryEdit: Permissions.RegistryEdit.YES,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.YES,
};

const CAPGroupDefault: Readonly<CAPGroupMemberPermissions> = {
	type: AccountType.CAPGROUP,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.NO,
	MemberSearch: Permissions.MemberSearch.NO,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.NONE,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
};

const CAPGroupStaff: Readonly<CAPGroupMemberPermissions> = {
	type: AccountType.CAPGROUP,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.ADDDRAFTEVENTS,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
};

const CAPGroupManager: Readonly<CAPGroupMemberPermissions> = {
	type: AccountType.CAPGROUP,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,
	ScanAdd: Permissions.ScanAdd.YES,
	AttendanceView: Permissions.AttendanceView.OTHER,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
};

const CAPGroupAdmin: Readonly<CAPGroupMemberPermissions> = {
	type: AccountType.CAPGROUP,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,
	ScanAdd: Permissions.ScanAdd.YES,
	AttendanceView: Permissions.AttendanceView.OTHER,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.FULL,
	CreateNotifications: Permissions.Notify.GLOBAL,
	RegistryEdit: Permissions.RegistryEdit.YES,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.YES,
};

const CAPWingDefault: Readonly<CAPWingMemberPermissions> = {
	type: AccountType.CAPWING,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.NO,
	MemberSearch: Permissions.MemberSearch.NO,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.NONE,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
	CreateEventAccount: Permissions.CreateEventAccount.NO,
};

const CAPWingStaff: Readonly<CAPWingMemberPermissions> = {
	type: AccountType.CAPWING,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.ADDDRAFTEVENTS,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
	CreateEventAccount: Permissions.CreateEventAccount.NO,
};

const CAPWingManager: Readonly<CAPWingMemberPermissions> = {
	type: AccountType.CAPWING,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,
	ScanAdd: Permissions.ScanAdd.YES,
	AttendanceView: Permissions.AttendanceView.OTHER,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
	CreateEventAccount: Permissions.CreateEventAccount.NO,
};

const CAPWingAdmin: Readonly<CAPWingMemberPermissions> = {
	type: AccountType.CAPWING,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,
	ScanAdd: Permissions.ScanAdd.YES,
	AttendanceView: Permissions.AttendanceView.OTHER,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.FULL,
	CreateNotifications: Permissions.Notify.GLOBAL,
	RegistryEdit: Permissions.RegistryEdit.YES,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.YES,
	CreateEventAccount: Permissions.CreateEventAccount.YES,
};

const CAPRegionDefault: Readonly<CAPRegionMemberPermissions> = {
	type: AccountType.CAPREGION,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.NO,
	MemberSearch: Permissions.MemberSearch.NO,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.NONE,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
	CreateEventAccount: Permissions.CreateEventAccount.NO,
};

const CAPRegionStaff: Readonly<CAPRegionMemberPermissions> = {
	type: AccountType.CAPREGION,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.ADDDRAFTEVENTS,
	EventContactSheet: Permissions.EventContactSheet.NO,
	ORMOPORD: Permissions.ORMOPORD.NO,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.NO,
	EventLinkList: Permissions.EventLinkList.NO,
	ManageTeam: Permissions.ManageTeam.NONE,
	FileManagement: Permissions.FileManagement.NONE,
	ScanAdd: Permissions.ScanAdd.NO,
	AttendanceView: Permissions.AttendanceView.PERSONAL,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
	CreateEventAccount: Permissions.CreateEventAccount.NO,
};

const CAPRegionManager: Readonly<CAPRegionMemberPermissions> = {
	type: AccountType.CAPREGION,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,
	ScanAdd: Permissions.ScanAdd.YES,
	AttendanceView: Permissions.AttendanceView.OTHER,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.NONE,
	CreateNotifications: Permissions.Notify.NO,
	RegistryEdit: Permissions.RegistryEdit.NO,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.NO,
	CreateEventAccount: Permissions.CreateEventAccount.NO,
};

const CAPRegionAdmin: Readonly<CAPRegionMemberPermissions> = {
	type: AccountType.CAPREGION,

	// Staff privileges
	AssignTasks: Permissions.AssignTasks.YES,
	MemberSearch: Permissions.MemberSearch.YES,

	// Manager privileges
	ManageEvent: Permissions.ManageEvent.FULL,
	EventContactSheet: Permissions.EventContactSheet.YES,
	ORMOPORD: Permissions.ORMOPORD.YES,
	AssignTemporaryDutyPositions: Permissions.AssignTemporaryDutyPosition.YES,
	EventLinkList: Permissions.EventLinkList.YES,
	ManageTeam: Permissions.ManageTeam.FULL,
	FileManagement: Permissions.FileManagement.FULL,
	ScanAdd: Permissions.ScanAdd.YES,
	AttendanceView: Permissions.AttendanceView.OTHER,

	// Admin privileges
	PermissionManagement: Permissions.PermissionManagement.FULL,
	CreateNotifications: Permissions.Notify.GLOBAL,
	RegistryEdit: Permissions.RegistryEdit.YES,
	ViewAccountNotifications: Permissions.ViewAccountNotifications.YES,
	CreateEventAccount: Permissions.CreateEventAccount.YES,
};

const DefaultPermissions = {
	[AccountType.CAPEVENT]: CAPEventDefault,
	[AccountType.CAPSQUADRON]: CAPSquadronDefault,
	[AccountType.CAPGROUP]: CAPGroupDefault,
	[AccountType.CAPWING]: CAPWingDefault,
	[AccountType.CAPREGION]: CAPRegionDefault,
};

const StaffPermissions = {
	[AccountType.CAPEVENT]: CAPEventStaff,
	[AccountType.CAPSQUADRON]: CAPSquadronStaff,
	[AccountType.CAPGROUP]: CAPGroupStaff,
	[AccountType.CAPWING]: CAPWingStaff,
	[AccountType.CAPREGION]: CAPRegionStaff,
};

const ManagerPermissions = {
	[AccountType.CAPEVENT]: CAPEventManager,
	[AccountType.CAPSQUADRON]: CAPSquadronManager,
	[AccountType.CAPGROUP]: CAPGroupManager,
	[AccountType.CAPWING]: CAPWingManager,
	[AccountType.CAPREGION]: CAPRegionManager,
};

const AdminPermissions = {
	[AccountType.CAPEVENT]: CAPEventAdmin,
	[AccountType.CAPSQUADRON]: CAPSquadronAdmin,
	[AccountType.CAPGROUP]: CAPGroupAdmin,
	[AccountType.CAPWING]: CAPWingAdmin,
	[AccountType.CAPREGION]: CAPRegionAdmin,
};

export const getDefaultMemberPermissions = (accountType: AccountType): MemberPermissions =>
	DefaultPermissions[accountType];

export const getDefaultStaffPermissions = (accountType: AccountType): MemberPermissions =>
	StaffPermissions[accountType];

export const getDefaultManagerPermissions = (accountType: AccountType): MemberPermissions =>
	ManagerPermissions[accountType];

export const getDefaultAdminPermissions = (accountType: AccountType): MemberPermissions =>
	AdminPermissions[accountType];
