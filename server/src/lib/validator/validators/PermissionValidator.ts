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
import Validator from '../Validator';

export default new Validator<MemberPermissions>({
	AdministerPT: {
		validator: Validator.Enum(AdministerPT)
	},
	AssignTemporaryDutyPositions: {
		validator: Validator.Enum(AssignTemporaryDutyPosition)
	},
	AssignTasks: {
		validator: Validator.Enum(AssignTasks)
	},
	CreateNotifications: {
		validator: Validator.Enum(Notify)
	},
	DownloadCAPWATCH: {
		validator: Validator.Enum(DownloadCAPWATCH)
	},
	EventContactSheet: {
		validator: Validator.Enum(EventContactSheet)
	},
	EventLinkList: {
		validator: Validator.Enum(EventLinkList)
	},
	FileManagement: {
		validator: Validator.Enum(FileManagement)
	},
	FlightAssign: {
		validator: Validator.Enum(FlightAssign)
	},
	MusterSheet: {
		validator: Validator.Enum(MusterSheet)
	},
	ORMOPORD: {
		validator: Validator.Enum(ORMOPORD)
	},
	PTSheet: {
		validator: Validator.Enum(PTSheet)
	},
	PermissionManagement: {
		validator: Validator.Enum(PermissionManagement)
	},
	PromotionManagement: {
		validator: Validator.Enum(PromotionManagement)
	},
	ProspectiveMemberManagment: {
		validator: Validator.Enum(ProspectiveMemberManagement)
	},
	RegistryEdit: {
		validator: Validator.Enum(RegistryEdit)
	},
	ManageEvent: {
		validator: Validator.Enum(ManageEvent)
	},
	ManageTeam: {
		validator: Validator.Enum(ManageTeam)
	}
});
