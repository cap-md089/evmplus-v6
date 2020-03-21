import { EitherObj } from '../lib/Either';
import { Maybe, MaybeObj } from '../lib/Maybe';
import {
	AccountObject,
	AttendanceRecord,
	CAPMemberObject,
	CAPWATCHImportErrors,
	CAPWATCHImportUpdate,
	DebriefItem,
	Errors,
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
	TaskObject,
	EmailSentType
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
		error: Maybe<Error>;
		message: string;
	}

	export namespace errors {
		export type ClientError = EitherObj<HTTPError, void>;

		export type GetErrors = EitherObj<HTTPError, Errors[]>;

		export type MarkErrorAsDone = EitherObj<HTTPError, void>;
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

			export type AddChild = EitherObj<api.HTTPError, void>;

			export type RemoveChild = EitherObj<api.HTTPError, void>;
		}

		// tslint:disable-next-line: no-shadowed-variable
		export namespace files {
			export type CreateFolder = EitherObj<api.HTTPError, FullFileObject>;

			export type GetFile<T extends FileObject> = EitherObj<api.HTTPError, T>;

			export type UploadFile = EitherObj<api.HTTPError, FullFileObject>;

			export type PhotoLibrary = FullFileObject[];

			export type SetInfo = EitherObj<api.HTTPError, void>;

			export type Delete = EitherObj<api.HTTPError, void>;
		}
	}

	export namespace member {
		export namespace account {
			export namespace cap {
				export type Finish = EitherObj<HTTPError, { sessionID: string }>;

				export type Request = EitherObj<HTTPError, EmailSentType>;

				export type UsernameRequest = EitherObj<HTTPError, void>;

				export type PasswordResetRequest = EitherObj<HTTPError, void>;

				export type FinishPasswordReset = EitherObj<HTTPError, { sessionID: string }>;
			}
		}

		export namespace attendance {
			export interface EventAttendanceRecordEventInformation {
				id: number;
				startDateTime: number;
				endDateTime: number;
				location: string;
				name: string;
				attendanceComments: string;
			}

			export interface EventAttendanceRecord {
				member: {
					reference: MemberReference;
					name: string;
				};
				event: MaybeObj<EventAttendanceRecordEventInformation>;
			}

			export type Get = EitherObj<HTTPError, EventAttendanceRecord[]>;
		}

		export namespace capwatch {
			export interface CAPWATCHFileDownloadedResult {
				type: CAPWATCHImportUpdate.CAPWATCHFileDownloaded;
				id: number;
				currentStep: number;
			}

			export interface CAPWATCHFileImportedResult {
				type: CAPWATCHImportUpdate.FileImported;
				orgID: number;
				error: CAPWATCHImportErrors;
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

			export type RequestImport = EitherObj<api.HTTPError, CAPWATCHFileImportedResult[]>;
		}

		export namespace flights {
			export type Assign = EitherObj<api.HTTPError, void>;

			export type AssignBulk = EitherObj<api.HTTPError, void>;

			export type FlightBasic = MemberReference[];

			export type FlightMembers = CAPMemberObject[];
		}

		export namespace permissions {
			export type Set = EitherObj<api.HTTPError, void>;
		}

		export namespace temporarydutypositions {
			export type Get = EitherObj<api.HTTPError, ShortDutyPosition[]>;

			export type Set = EitherObj<api.HTTPError, void>;
		}

		export type Absent = EitherObj<api.HTTPError, void>;

		export type PasswordReset = EitherObj<api.HTTPError, void>;

		export type Members = Member[];

		export type Su = EitherObj<api.HTTPError, void>;
	}

	export namespace notifications {
		export namespace admin {
			// tslint:disable-next-line: no-shadowed-variable
			export type Get = EitherObj<HTTPError, NotificationObject>;

			// tslint:disable-next-line: no-shadowed-variable
			export type List = EitherObj<HTTPError, NotificationObject[]>;

			// tslint:disable-next-line: no-shadowed-variable
			export type ToggleRead = EitherObj<HTTPError, void>;

			// tslint:disable-next-line: no-shadowed-variable
			export type Delete = EitherObj<HTTPError, void>;
		}

		export namespace global {
			export type Create = EitherObj<HTTPError, NotificationObject>;

			// tslint:disable-next-line: no-shadowed-variable
			export type Get = EitherObj<HTTPError, MaybeObj<NotificationObject>>;

			export type MarkRead = EitherObj<HTTPError, void>;
		}

		// tslint:disable-next-line: no-shadowed-variable
		export namespace member {
			// tslint:disable-next-line: no-shadowed-variable
			export type Get = EitherObj<HTTPError, NotificationObject>;

			// tslint:disable-next-line: no-shadowed-variable
			export type List = EitherObj<HTTPError, NotificationObject[]>;

			// tslint:disable-next-line: no-shadowed-variable
			export type ToggleRead = EitherObj<HTTPError, void>;

			// tslint:disable-next-line: no-shadowed-variable
			export type Delete = EitherObj<HTTPError, void>;
		}

		export type Get = EitherObj<HTTPError, NotificationObject>;

		export type List = NotificationObject[];

		export type ToggleRead = EitherObj<HTTPError, void>;

		export type Delete = EitherObj<HTTPError, void>;
	}

	export namespace registry {
		export type Get = EitherObj<HTTPError, RegistryValues>;

		export type Set = EitherObj<HTTPError, void>;
	}

	export namespace tasks {
		export type Create = EitherObj<HTTPError, TaskObject>;

		// export type Edit = EitherObj<ErrorMessage, TaskObject>;

		export type Get = EitherObj<HTTPError, TaskObject>;

		export type List = TaskObject[];

		export type Edit = EitherObj<HTTPError, void>;

		export type Delete = EitherObj<HTTPError, void>;
	}

	export namespace team {
		export namespace members {
			// tslint:disable-next-line: no-shadowed-variable
			export type List = Member[];

			export type Modify = EitherObj<HTTPError, void>;

			export type Add = EitherObj<HTTPError, void>;
		}

		export type Create = EitherObj<HTTPError, FullTeamObject>;

		export type Get = EitherObj<HTTPError, FullTeamObject>;

		export type List = FullTeamObject[];

		export type Delete = EitherObj<HTTPError, void>;

		export type Set = EitherObj<HTTPError, void>;

		export type Remove = EitherObj<HTTPError, void>;
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
