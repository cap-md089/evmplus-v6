import { EitherObj } from '../lib/Either';
import { MaybeObj } from '../lib/Maybe';
import {
	AccountObject,
	AttendanceRecord,
	CAPMemberObject,
	CAPWATCHImportUpdate,
	ClientErrorObject,
	DebriefItem,
	EventObject,
	FileObject,
	FullFileObject,
	FullTeamObject,
	Member,
	MemberReference,
	NotificationObject,
	RegistryValues,
	ShortDutyPosition,
	SigninReturn,
	TaskObject
} from './types';

// tslint:disable:no-namespace

export namespace api {
	export type ErrorMessage = string;

	export namespace errors {
		export type ClientError = ClientErrorObject;
	}

	export namespace events {
		export namespace attendance {
			export type Add = MaybeObj<ErrorMessage>;

			export type AddBulk = EitherObj<ErrorMessage, AttendanceRecord[]>;

			export type Delete = EitherObj<ErrorMessage, AttendanceRecord[]>;

			export type GetAttendance = EitherObj<ErrorMessage, AttendanceRecord[]>;

			export type ModifyAttendance = MaybeObj<ErrorMessage>;
		}

		export namespace debrief {
			export type Add = EitherObj<ErrorMessage, DebriefItem[]>;

			export type Delete = EitherObj<ErrorMessage, DebriefItem[]>;
		}

		// tslint:disable-next-line: no-shadowed-variable
		export namespace events {
			export type Add = EitherObj<ErrorMessage, EventObject>;

			export type Copy = EitherObj<ErrorMessage, EventObject>;

			export type Get = EitherObj<ErrorMessage, EventObject>;

			export type Link = EitherObj<ErrorMessage, EventObject>;

			export type ListUpcoming = EitherObj<ErrorMessage, EventObject[]>;

			// Contains error information
			export type Delete = MaybeObj<ErrorMessage>;
		}
	}

	export namespace files {
		export namespace children {
			export type GetFiles<T extends FileObject> = EitherObj<ErrorMessage, T[]>;

			export type AddChild = MaybeObj<ErrorMessage>;

			export type RemoveChild = MaybeObj<ErrorMessage>;
		}

		// tslint:disable-next-line: no-shadowed-variable
		export namespace files {
			export type CreateFolder = EitherObj<ErrorMessage, FullFileObject>;

			export type GetFile<T extends FileObject> = EitherObj<ErrorMessage, T>;

			export type UploadFile = EitherObj<ErrorMessage, FullFileObject>;

			export type PhotoLibrary = EitherObj<ErrorMessage, FullFileObject[]>;
		}
	}

	export namespace member {
		export namespace account {
			export namespace nhq {
				export type Finish = EitherObj<ErrorMessage, { sessionID: string }>;
			}
		}

		export namespace attendance {
			export interface EventAttendanceRecord {
				name: string;
				id: number;
				endDateTime: number;
				location: string;
				startDateTime: number;
				planToUseCAPTransportation: boolean;
				comments: string;
			}

			export type Basic = EitherObj<ErrorMessage, EventAttendanceRecord[]>;

			export type ForOther = EitherObj<ErrorMessage, EventAttendanceRecord[]>;
		}

		export namespace capwatch {
			export interface CAPWATCHFileDownloadedResult {
				type: CAPWATCHImportUpdate.CAPWATCHFileDownloaded;
				id: number;
				currentStep: number;
			}

			export interface CAPWATCHFileImportedResult {
				type: CAPWATCHImportUpdate.FileImported;
				id: number;
				error: boolean;
				currentStep: number;
				file: string;
			}

			export interface CAPWATCHFileDoneResult {
				type: CAPWATCHImportUpdate.CAPWATCHFileDone;
				id: number;
				currentStep: number;
			}

			export interface CAPWATCHProgressInitialization {
				type: CAPWATCHImportUpdate.ProgressInitialization;
				totalSteps: number;
			}
		}

		export namespace flights {
			export type FlightBasic = MemberReference[];

			export type FlightMembers = CAPMemberObject[];
		}

		export namespace permissions {}

		export namespace temporarydutypositions {
			export type Get = EitherObj<ErrorMessage, ShortDutyPosition[]>;
		}

		export type Members = Member;
	}

	export namespace notifications {
		export namespace admin {
			// tslint:disable-next-line: no-shadowed-variable
			export type Get = NotificationObject;

			// tslint:disable-next-line: no-shadowed-variable
			export type List = NotificationObject[];
		}

		export namespace global {
			// tslint:disable-next-line: no-shadowed-variable
			export type Get = NotificationObject;
		}

		// tslint:disable-next-line: no-shadowed-variable
		export namespace member {
			// tslint:disable-next-line: no-shadowed-variable
			export type Get = NotificationObject;

			// tslint:disable-next-line: no-shadowed-variable
			export type List = NotificationObject[];
		}

		export type Get = NotificationObject;

		export type List = NotificationObject[];
	}

	export namespace registry {
		export type Get = EitherObj<ErrorMessage, RegistryValues>;
	}

	export namespace tasks {
		export type Create = EitherObj<ErrorMessage, TaskObject>;

		// export type Edit = EitherObj<ErrorMessage, TaskObject>;

		export type Get = EitherObj<ErrorMessage, TaskObject>;

		export type List = TaskObject[];
	}

	export namespace team {
		export namespace members {
			// tslint:disable-next-line: no-shadowed-variable
			export type List = Member[];
		}

		export type Create = FullTeamObject;

		export type Get = FullTeamObject;

		export type List = FullTeamObject[];
	}

	export type AccountCheckReturn = AccountObject;

	export type Check = SigninReturn;

	export type Echo<T> = T;

	export interface FormToken {
		token: string;
	}

	export type Signin = SigninReturn;

	export type SlideshowImageIDs = FileObject[];
}
