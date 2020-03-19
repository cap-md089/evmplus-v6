import { MemberPermissions, Permissions } from 'common-lib';
import Validator from '../Validator';

export default new Validator<MemberPermissions>({
	AdministerPT: {
		validator: Validator.Enum(Permissions.AdministerPT)
	},
	AssignTemporaryDutyPositions: {
		validator: Validator.Enum(Permissions.AssignTemporaryDutyPosition)
	},
	AssignTasks: {
		validator: Validator.Enum(Permissions.AssignTasks)
	},
	CreateNotifications: {
		validator: Validator.Enum(Permissions.Notify)
	},
	DownloadCAPWATCH: {
		validator: Validator.Enum(Permissions.DownloadCAPWATCH)
	},
	EventContactSheet: {
		validator: Validator.Enum(Permissions.EventContactSheet)
	},
	EventLinkList: {
		validator: Validator.Enum(Permissions.EventLinkList)
	},
	FileManagement: {
		validator: Validator.Enum(Permissions.FileManagement)
	},
	FlightAssign: {
		validator: Validator.Enum(Permissions.FlightAssign)
	},
	MusterSheet: {
		validator: Validator.Enum(Permissions.MusterSheet)
	},
	ORMOPORD: {
		validator: Validator.Enum(Permissions.ORMOPORD)
	},
	PTSheet: {
		validator: Validator.Enum(Permissions.PTSheet)
	},
	PermissionManagement: {
		validator: Validator.Enum(Permissions.PermissionManagement)
	},
	PromotionManagement: {
		validator: Validator.Enum(Permissions.PromotionManagement)
	},
	ProspectiveMemberManagement: {
		validator: Validator.Enum(Permissions.ProspectiveMemberManagement)
	},
	RegistryEdit: {
		validator: Validator.Enum(Permissions.RegistryEdit)
	},
	ManageEvent: {
		validator: Validator.Enum(Permissions.ManageEvent)
	},
	ManageTeam: {
		validator: Validator.Enum(Permissions.ManageTeam)
	},
	ScanAdd: {
		validator: Validator.Enum(Permissions.ScanAdd)
	},
	AttendanceView: {
		validator: Validator.Enum(Permissions.AttendanceView)
	}
});
