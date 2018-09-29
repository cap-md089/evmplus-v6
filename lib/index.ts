export enum EventStatus {
	DRAFT,
	TENTATIVE,
	CONFIRMED,
	COMPLETE,
	CANCELLED,
	INFORMATIONONLY
}

export enum MemberCreateError {
	NONE = -1,
	INCORRRECT_CREDENTIALS = 0,
	SERVER_ERROR = 1,
	PASSWORD_EXPIRED = 2,
	INVALID_SESSION_ID = 3,
	UNKOWN_SERVER_ERROR = 4
}

export enum PointOfContactType {
	INTERNAL,
	EXTERNAL
}

export enum TeamPublicity {
	PRIVATE, // Nothing visible, not shown on Browse unless signed in and member of team
	PUBLIC // Full visibility
}

export enum MemberCAPWATCHErrors {
	INVALID_PERMISSIONS,
	NO_NHQ_ACTION
}

export enum CAPWATCHImportErrors {
	NONE,
	BADDATA,
	INSERT,
	CLEAR
}

export enum AttendanceStatus {
	COMMITTEDATTENDED,
	NOSHOW,
	RESCINDEDCOMMITMENTTOATTEND
}