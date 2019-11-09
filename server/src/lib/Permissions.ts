import { MemberPermissions } from 'common-lib';

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
