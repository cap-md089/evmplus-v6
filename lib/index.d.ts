export declare enum EventStatus {
    DRAFT = 0,
    TENTATIVE = 1,
    CONFIRMED = 2,
    COMPLETE = 3,
    CANCELLED = 4,
    INFORMATIONONLY = 5
}
export declare enum EchelonEventNumber {
    NOT_REQUIRED = 0,
    TO_BE_APPLIED_FOR = 1,
    APPLIED_FOR = 2,
    DENIED = 3,
    APPROVED = 4
}
export declare enum MemberCreateError {
    NONE = -1,
    INCORRRECT_CREDENTIALS = 0,
    SERVER_ERROR = 1,
    PASSWORD_EXPIRED = 2,
    INVALID_SESSION_ID = 3,
    UNKOWN_SERVER_ERROR = 4
}
export declare enum PointOfContactType {
    INTERNAL = 0,
    EXTERNAL = 1
}
export declare enum TeamPublicity {
    PRIVATE = 0,
    PROTECTED = 1,
    PUBLIC = 2
}
export declare enum MemberCAPWATCHErrors {
    INVALID_PERMISSIONS = 0,
    NO_NHQ_ACTION = 1
}
export declare enum CAPWATCHImportErrors {
    NONE = 0,
    BADDATA = 1,
    INSERT = 2,
    CLEAR = 3
}
export declare enum AttendanceStatus {
    COMMITTEDATTENDED = 0,
    NOSHOW = 1,
    RESCINDEDCOMMITMENTTOATTEND = 2
}
export declare enum FileUserAccessControlPermissions {
    READ = 1,
    WRITE = 2,
    COMMENT = 4,
    MODIFY = 8,
    DELETE = 16,
    ASSIGNPERMISSIONS = 32,
    FULLCONTROL = 255
}
export declare enum FileUserAccessControlType {
    USER = 0,
    TEAM = 1,
    ACCOUNTMEMBER = 2,
    SIGNEDIN = 3,
    OTHER = 4
}
export declare enum HTTPError {
    NONE = 0,
    ERR404 = 1,
    ERR403 = 2,
    ERR500 = 3,
    UNKNOWN = 4
}
