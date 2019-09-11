import { MemberPermissions } from 'common-lib';
import Validator from '../Validator';

export default new Validator<MemberPermissions>({
	AddEvent: {
		validator: Validator.OneOfStrict(0, 1, 2)
	},
	AddTeam: {
		validator: Validator.OneOfStrict(0, 1)
	},
	AdministerPT: {
		validator: Validator.OneOfStrict(0, 1)
	},
	AssignPosition: {
		validator: Validator.OneOfStrict(0, 1)
	},
	AssignTasks: {
		validator: Validator.OneOfStrict(0, 1)
	},
	CopyEvent: {
		validator: Validator.OneOfStrict(0, 1)
	},
	CreateNotifications: {
		validator: Validator.OneOfStrict(0, 1)
	},
	DeleteEvent: {
		validator: Validator.OneOfStrict(0, 1)
	},
	DownloadCAPWATCH: {
		validator: Validator.OneOfStrict(0, 1)
	},
	DownloadStaffGuide: {
		validator: Validator.OneOfStrict(0, 1)
	},
	EditEvent: {
		validator: Validator.OneOfStrict(0, 1)
	},
	EditTeam: {
		validator: Validator.OneOfStrict(0, 1)
	},
	EventContactSheet: {
		validator: Validator.OneOfStrict(0, 1)
	},
	EventLinkList: {
		validator: Validator.OneOfStrict(0, 1)
	},
	EventStatusPage: {
		validator: Validator.OneOfStrict(0, 1)
	},
	FileManagement: {
		validator: Validator.OneOfStrict(0, 1)
	},
	FlightAssign: {
		validator: Validator.OneOfStrict(0, 1)
	},
	ManageBlog: {
		validator: Validator.OneOfStrict(0, 1)
	},
	MusterSheet: {
		validator: Validator.OneOfStrict(0, 1)
	},
	ORMOPORD: {
		validator: Validator.OneOfStrict(0, 1)
	},
	PTSheet: {
		validator: Validator.OneOfStrict(0, 1)
	},
	PermissionManagement: {
		validator: Validator.OneOfStrict(0, 1)
	},
	PromotionManagement: {
		validator: Validator.OneOfStrict(0, 1)
	},
	ProspectiveMemberManagment: {
		validator: Validator.OneOfStrict(0, 1)
	},
	RegistryEdit: {
		validator: Validator.OneOfStrict(0, 1)
	},
	SignUpEdit: {
		validator: Validator.OneOfStrict(0, 1)
	}
});
