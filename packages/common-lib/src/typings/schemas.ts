import { PAMTypes } from '..';
import {
	AccountObject,
	AllAudits,
	ChangeLogItem,
	DiscordAccount,
	Errors,
	NHQ,
	NotificationCause,
	NotificationTarget,
	PasswordResetTokenInformation,
	RawAttendanceDBRecord,
	RawCAPExternalMemberObject,
	RawEventObject,
	RawFileObject,
	RawNotificationObject,
	RawTeamObject,
	RegistryValues,
	SignInLogData,
	StoredAccountMembership,
	StoredMemberPermissions,
	StoredMFASecret,
	StoredProspectiveMemberObject,
	StoredSigninKey,
	StoredSigninNonce,
	TaskObject,
	UserAccountInformation,
	UserSession,
} from './types';

export interface TableNameMap {
	Accounts: AccountObject;
	Attendance: RawAttendanceDBRecord;
	Audits: AllAudits;
	ChangeLog: ChangeLogItem;
	DiscordAccounts: DiscordAccount;
	Errors: Errors;
	Events: RawEventObject;
	ExternalMembers: RawCAPExternalMemberObject;
	ExtraAccountMembership: StoredAccountMembership;
	Files: RawFileObject;
	MFASetup: StoredMFASecret;
	MFATokens: StoredMFASecret;
	NHQ_CadetAchv: NHQ.CadetAchv;
	NHQ_CadetAchvAprs: NHQ.CadetAchvAprs;
	NHQ_CadetActivities: NHQ.CadetActivities;
	NHQ_CadetDutyPosition: NHQ.CadetDutyPosition;
	NHQ_CadetHFZInformation: NHQ.CadetHFZInformation;
	NHQ_CdtAchvEnum: NHQ.CdtAchvEnum;
	NHQ_Commanders: NHQ.Commanders;
	NHQ_DutyPosition: NHQ.DutyPosition;
	NHQ_MbrAchievements: NHQ.MbrAchievements;
	NHQ_MbrContact: NHQ.MbrContact;
	NHQ_Member: NHQ.NHQMember;
	NHQ_OFlight: NHQ.OFlight;
	NHQ_OrgContact: NHQ.OrgContact;
	NHQ_Organization: NHQ.Organization;
	NHQ_SeniorAwards: NHQ.SeniorAwards;
	NHQ_SeniorLevel: NHQ.SeniorLevel;
	NHQ_PL_Groups: NHQ.PL.Groups;
	NHQ_PL_Lookup: NHQ.PL.Lookup;
	NHQ_PL_MemberPathCredit: NHQ.PL.MemberPathCredit;
	NHQ_PL_MemberTaskCredit: NHQ.PL.MemberTaskCredit;
	NHQ_PL_Paths: NHQ.PL.Paths;
	NHQ_PL_TaskGroupAssignments: NHQ.PL.TaskGroupAssignments;
	NHQ_PL_Tasks: NHQ.PL.Tasks;
	Notifications: RawNotificationObject<NotificationCause, NotificationTarget>;
	PasswordResetTokens: PasswordResetTokenInformation;
	ProspectiveMembers: StoredProspectiveMemberObject;
	Registry: RegistryValues;
	Sessions: UserSession;
	SignInLog: SignInLogData;
	SignatureNonces: StoredSigninNonce;
	SigninKeys: StoredSigninKey;
	Tasks: TaskObject;
	Teams: RawTeamObject;
	Tokens: PAMTypes.TokenObject;
	UserAccountInfo: UserAccountInformation;
	UserAccountTokens: PAMTypes.AccountCreationToken;
	UserPermissions: StoredMemberPermissions;
}

export type TableNames = keyof TableNameMap;

export type TableDataType<Name extends TableNames> = TableNameMap[Name];
