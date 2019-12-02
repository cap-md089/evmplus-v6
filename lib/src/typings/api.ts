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

export const noneHTTPError: api.HTTPError = {
	code: 200,
	message: 'Operation successful'
};

export namespace api {
	export interface HTTPError {
		code: number;
		message: any;
	}

	export interface ServerError {
		code: number;
		error: MaybeObj<Error>;
		message: string;
	}

	export namespace errors {
		export type ClientError = EitherObj<HTTPError, ClientErrorObject>;
	}

	export namespace events {
		export namespace attendance {
			export type Add = EitherObj<HTTPError, void>;

			export type AddBulk = EitherObj<HTTPError, AttendanceRecord[]>;

			export type Delete = EitherObj<HTTPError, AttendanceRecord[]>;

			export type GetAttendance = EitherObj<HTTPError, AttendanceRecord[]>;

			export type ModifyAttendance = EitherObj<HTTPError, void>;
		}

		export namespace debrief {
			export type Add = EitherObj<HTTPError, DebriefItem[]>;

			export type Delete = EitherObj<HTTPError, DebriefItem[]>;
		}

		// tslint:disable-next-line: no-shadowed-variable
		export namespace events {
			export interface EventViewerData {
				event: EventObject;
				attendees: {
					[key: string]: MaybeObj<Member>;
				};
				organizations: {
					[key: string]: AccountObject;
				};
			}

			export type Add = EitherObj<HTTPError, EventObject>;

			export type Copy = EitherObj<HTTPError, EventObject>;

			export type Get = EitherObj<HTTPError, EventObject>;

			export type GetEventViewerData = EitherObj<HTTPError, EventViewerData>;

			export type GetNextRecurring = EitherObj<HTTPError, MaybeObj<EventObject>>;

			export type Link = EitherObj<HTTPError, EventObject>;

			export type ListUpcoming = EventObject[];

			export type Set = EitherObj<HTTPError, void>;

			export type Delete = EitherObj<HTTPError, void>;
		}
	}

	export namespace files {
		export namespace children {
			export type GetFiles<T extends FileObject> = T[];

			export type AddChild = EitherObj<HTTPError, void>;

			export type RemoveChild = EitherObj<HTTPError, void>;
		}

		// tslint:disable-next-line: no-shadowed-variable
		export namespace files {
			export type CreateFolder = EitherObj<HTTPError, FullFileObject>;

			export type GetFile<T extends FileObject> = EitherObj<HTTPError, T>;

			export type UploadFile = EitherObj<HTTPError, FullFileObject>;

			export type PhotoLibrary = FullFileObject[];
		}
	}

	export namespace member {
		export namespace account {
			export namespace nhq {
				export type Finish = EitherObj<HTTPError, { sessionID: string }>;
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

			export type Basic = EventAttendanceRecord[];

			export type ForOther = EventAttendanceRecord[];
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
			export type Get = ShortDutyPosition[];
		}

		export type PasswordReset = EitherObj<api.HTTPError, void>;

		export type Members = Member[];
	}

	export namespace notifications {
		export namespace admin {
			// tslint:disable-next-line: no-shadowed-variable
			export type Get = EitherObj<HTTPError, NotificationObject>;

			// tslint:disable-next-line: no-shadowed-variable
			export type List = EitherObj<HTTPError, NotificationObject[]>;
		}

		export namespace global {
			// tslint:disable-next-line: no-shadowed-variable
			export type Get = EitherObj<HTTPError, MaybeObj<NotificationObject>>;
		}

		// tslint:disable-next-line: no-shadowed-variable
		export namespace member {
			// tslint:disable-next-line: no-shadowed-variable
			export type Get = EitherObj<HTTPError, NotificationObject>;

			// tslint:disable-next-line: no-shadowed-variable
			export type List = EitherObj<HTTPError, NotificationObject[]>;
		}

		export type Get = EitherObj<HTTPError, NotificationObject>;

		export type List = NotificationObject[];
	}

	export namespace registry {
		export type Get = EitherObj<HTTPError, RegistryValues>;
	}

	export namespace tasks {
		export type Create = EitherObj<HTTPError, TaskObject>;

		// export type Edit = EitherObj<ErrorMessage, TaskObject>;

		export type Get = EitherObj<HTTPError, TaskObject>;

		export type List = TaskObject[];
	}

	export namespace team {
		export namespace members {
			// tslint:disable-next-line: no-shadowed-variable
			export type List = Member[];
		}

		export type Create = EitherObj<HTTPError, FullTeamObject>;

		export type Get = EitherObj<HTTPError, FullTeamObject>;

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
