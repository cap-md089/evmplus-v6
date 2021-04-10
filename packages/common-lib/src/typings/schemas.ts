import { PAMTypes } from '..';
import {
	AccountObject,
	AllAudits,
	DiscordAccount,
	Errors,
	NHQ,
	NotificationCause,
	NotificationTarget,
	PasswordResetTokenInformation,
	RawAttendanceDBRecord,
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
	DiscordAccounts: DiscordAccount;
	Errors: Errors;
	Events: RawEventObject;
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
	NHQ_DutyPosition: NHQ.DutyPosition;
	NHQ_MbrAchievements: NHQ.MbrAchievements;
	NHQ_MbrContact: NHQ.MbrContact;
	NHQ_Member: NHQ.NHQMember;
	NHQ_OFlight: NHQ.OFlight;
	NHQ_Organization: NHQ.Organization;
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

export type TableDataType<Name extends string> = Name extends keyof TableNameMap
	? TableNameMap[Name]
	: any;
