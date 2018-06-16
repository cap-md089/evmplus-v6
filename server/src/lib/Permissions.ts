import { MemberPermissions, MemberAccessLevel } from '../types';

export const Member: MemberPermissions = {
	FlightAssign: 0,
	MusterSheet: 0,
	PTSheet: 0,
	PromotionManagement: 0,
	AssignTasks: 0,
	AdministerPT: 0,
	DownloadStaffGuide: 0,
	AddEvent: 0,
	EditEvent: 0,
	EventContactSheet: 0,
	SignUpEdit: 0,
	CopyEvent: 0,
	ORMOPORD: 0,
	DeleteEvent: 0,
	AssignPosition: 0,
	EventStatusPage: 0,
	ProspectiveMemberManagment: 0,
	EventLinkList: 0,
	AddTeam: 0,
	EditTeam: 0,
	FileManagement: 0,
	PermissionManagement: 0,
	DownloadCAPWATCH: 0,
	RegistryEdit: 0
};

export const CadetStaff: MemberPermissions = {
	FlightAssign: 1,
	MusterSheet: 1,
	PTSheet: 1,
	PromotionManagement: 1,
	AssignTasks: 1,
	AdministerPT: 2,
	DownloadStaffGuide: 1,
	AddEvent: 1,
	EditEvent: 0,
	EventContactSheet: 0,
	SignUpEdit: 0,
	CopyEvent: 0,
	ORMOPORD: 0,
	DeleteEvent: 0,
	AssignPosition: 0,
	EventStatusPage: 0,
	ProspectiveMemberManagment: 0,
	EventLinkList: 0,
	AddTeam: 0,
	EditTeam: 0,
	FileManagement: 0,
	PermissionManagement: 0,
	DownloadCAPWATCH: 0,
	RegistryEdit: 0
};

export const Manager: MemberPermissions = {
	FlightAssign: 1,
	MusterSheet: 1,
	PTSheet: 1,
	PromotionManagement: 1,
	AssignTasks: 1,
	AdministerPT: 2,
	DownloadStaffGuide: 1,
	AddEvent: 2,
	EditEvent: 1,
	EventContactSheet: 1,
	SignUpEdit: 1,
	CopyEvent: 1,
	ORMOPORD: 1,
	DeleteEvent: 1,
	AssignPosition: 1,
	EventStatusPage: 1,
	ProspectiveMemberManagment: 1,
	EventLinkList: 1,
	AddTeam: 1,
	EditTeam: 1,
	FileManagement: 1,
	PermissionManagement: 0,
	DownloadCAPWATCH: 0,
	RegistryEdit: 0
};

export const Admin: MemberPermissions = {
	FlightAssign: 1,
	MusterSheet: 1,
	PTSheet: 1,
	PromotionManagement: 1,
	AssignTasks: 1,
	AdministerPT: 2,
	DownloadStaffGuide: 1,
	AddEvent: 2,
	EditEvent: 1,
	EventContactSheet: 1,
	SignUpEdit: 1,
	CopyEvent: 1,
	ORMOPORD: 1,
	DeleteEvent: 1,
	AssignPosition: 1,
	EventStatusPage: 1,
	ProspectiveMemberManagment: 1,
	EventLinkList: 1,
	AddTeam: 1,
	EditTeam: 1,
	FileManagement: 1,
	PermissionManagement: 1,
	DownloadCAPWATCH: 1,
	RegistryEdit: 1
};

export const getPermissions = (lvl: MemberAccessLevel) =>
	lvl === 'Member' ? Member : 
	lvl === 'CadetStaff' ? CadetStaff :
	lvl === 'Manager' ? Manager :
	lvl === 'Admin' ? Admin :
		null;