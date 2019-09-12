"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventStatus;
(function (EventStatus) {
    EventStatus[EventStatus["DRAFT"] = 0] = "DRAFT";
    EventStatus[EventStatus["TENTATIVE"] = 1] = "TENTATIVE";
    EventStatus[EventStatus["CONFIRMED"] = 2] = "CONFIRMED";
    EventStatus[EventStatus["COMPLETE"] = 3] = "COMPLETE";
    EventStatus[EventStatus["CANCELLED"] = 4] = "CANCELLED";
    EventStatus[EventStatus["INFORMATIONONLY"] = 5] = "INFORMATIONONLY";
})(EventStatus = exports.EventStatus || (exports.EventStatus = {}));
var EchelonEventNumber;
(function (EchelonEventNumber) {
    EchelonEventNumber[EchelonEventNumber["NOT_REQUIRED"] = 0] = "NOT_REQUIRED";
    EchelonEventNumber[EchelonEventNumber["TO_BE_APPLIED_FOR"] = 1] = "TO_BE_APPLIED_FOR";
    EchelonEventNumber[EchelonEventNumber["APPLIED_FOR"] = 2] = "APPLIED_FOR";
    EchelonEventNumber[EchelonEventNumber["DENIED"] = 3] = "DENIED";
    EchelonEventNumber[EchelonEventNumber["APPROVED"] = 4] = "APPROVED";
})(EchelonEventNumber = exports.EchelonEventNumber || (exports.EchelonEventNumber = {}));
var MemberCreateError;
(function (MemberCreateError) {
    MemberCreateError[MemberCreateError["NONE"] = -1] = "NONE";
    MemberCreateError[MemberCreateError["INCORRRECT_CREDENTIALS"] = 0] = "INCORRRECT_CREDENTIALS";
    MemberCreateError[MemberCreateError["SERVER_ERROR"] = 1] = "SERVER_ERROR";
    MemberCreateError[MemberCreateError["PASSWORD_EXPIRED"] = 2] = "PASSWORD_EXPIRED";
    MemberCreateError[MemberCreateError["INVALID_SESSION_ID"] = 3] = "INVALID_SESSION_ID";
    MemberCreateError[MemberCreateError["UNKOWN_SERVER_ERROR"] = 4] = "UNKOWN_SERVER_ERROR";
})(MemberCreateError = exports.MemberCreateError || (exports.MemberCreateError = {}));
var PointOfContactType;
(function (PointOfContactType) {
    PointOfContactType[PointOfContactType["INTERNAL"] = 0] = "INTERNAL";
    PointOfContactType[PointOfContactType["EXTERNAL"] = 1] = "EXTERNAL";
})(PointOfContactType = exports.PointOfContactType || (exports.PointOfContactType = {}));
var TeamPublicity;
(function (TeamPublicity) {
    TeamPublicity[TeamPublicity["PRIVATE"] = 0] = "PRIVATE";
    TeamPublicity[TeamPublicity["PROTECTED"] = 1] = "PROTECTED";
    TeamPublicity[TeamPublicity["PUBLIC"] = 2] = "PUBLIC";
})(TeamPublicity = exports.TeamPublicity || (exports.TeamPublicity = {}));
var MemberCAPWATCHErrors;
(function (MemberCAPWATCHErrors) {
    MemberCAPWATCHErrors[MemberCAPWATCHErrors["INVALID_PERMISSIONS"] = 0] = "INVALID_PERMISSIONS";
    MemberCAPWATCHErrors[MemberCAPWATCHErrors["NO_NHQ_ACTION"] = 1] = "NO_NHQ_ACTION";
})(MemberCAPWATCHErrors = exports.MemberCAPWATCHErrors || (exports.MemberCAPWATCHErrors = {}));
var CAPWATCHImportErrors;
(function (CAPWATCHImportErrors) {
    CAPWATCHImportErrors[CAPWATCHImportErrors["NONE"] = 0] = "NONE";
    CAPWATCHImportErrors[CAPWATCHImportErrors["BADDATA"] = 1] = "BADDATA";
    CAPWATCHImportErrors[CAPWATCHImportErrors["INSERT"] = 2] = "INSERT";
    CAPWATCHImportErrors[CAPWATCHImportErrors["CLEAR"] = 3] = "CLEAR";
})(CAPWATCHImportErrors = exports.CAPWATCHImportErrors || (exports.CAPWATCHImportErrors = {}));
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus[AttendanceStatus["COMMITTEDATTENDED"] = 0] = "COMMITTEDATTENDED";
    AttendanceStatus[AttendanceStatus["NOSHOW"] = 1] = "NOSHOW";
    AttendanceStatus[AttendanceStatus["RESCINDEDCOMMITMENTTOATTEND"] = 2] = "RESCINDEDCOMMITMENTTOATTEND";
})(AttendanceStatus = exports.AttendanceStatus || (exports.AttendanceStatus = {}));
var FileUserAccessControlPermissions;
(function (FileUserAccessControlPermissions) {
    FileUserAccessControlPermissions[FileUserAccessControlPermissions["READ"] = 1] = "READ";
    FileUserAccessControlPermissions[FileUserAccessControlPermissions["WRITE"] = 2] = "WRITE";
    FileUserAccessControlPermissions[FileUserAccessControlPermissions["COMMENT"] = 4] = "COMMENT";
    FileUserAccessControlPermissions[FileUserAccessControlPermissions["MODIFY"] = 8] = "MODIFY";
    FileUserAccessControlPermissions[FileUserAccessControlPermissions["DELETE"] = 16] = "DELETE";
    FileUserAccessControlPermissions[FileUserAccessControlPermissions["ASSIGNPERMISSIONS"] = 32] = "ASSIGNPERMISSIONS";
    FileUserAccessControlPermissions[FileUserAccessControlPermissions["FULLCONTROL"] = 255] = "FULLCONTROL";
})(FileUserAccessControlPermissions = exports.FileUserAccessControlPermissions || (exports.FileUserAccessControlPermissions = {}));
var FileUserAccessControlType;
(function (FileUserAccessControlType) {
    FileUserAccessControlType[FileUserAccessControlType["USER"] = 0] = "USER";
    FileUserAccessControlType[FileUserAccessControlType["TEAM"] = 1] = "TEAM";
    FileUserAccessControlType[FileUserAccessControlType["ACCOUNTMEMBER"] = 2] = "ACCOUNTMEMBER";
    FileUserAccessControlType[FileUserAccessControlType["SIGNEDIN"] = 3] = "SIGNEDIN";
    FileUserAccessControlType[FileUserAccessControlType["OTHER"] = 4] = "OTHER";
})(FileUserAccessControlType = exports.FileUserAccessControlType || (exports.FileUserAccessControlType = {}));
var HTTPError;
(function (HTTPError) {
    HTTPError[HTTPError["NONE"] = 0] = "NONE";
    HTTPError[HTTPError["ERR404"] = 1] = "ERR404";
    HTTPError[HTTPError["ERR403"] = 2] = "ERR403";
    HTTPError[HTTPError["ERR500"] = 3] = "ERR500";
    HTTPError[HTTPError["UNKNOWN"] = 4] = "UNKNOWN";
})(HTTPError = exports.HTTPError || (exports.HTTPError = {}));
var NotificationTargetType;
(function (NotificationTargetType) {
    NotificationTargetType[NotificationTargetType["MEMBER"] = 1] = "MEMBER";
    NotificationTargetType[NotificationTargetType["ADMINS"] = 2] = "ADMINS";
    NotificationTargetType[NotificationTargetType["EVERYONE"] = 3] = "EVERYONE";
})(NotificationTargetType = exports.NotificationTargetType || (exports.NotificationTargetType = {}));
var NotificationCauseType;
(function (NotificationCauseType) {
    NotificationCauseType[NotificationCauseType["MEMBER"] = 1] = "MEMBER";
    NotificationCauseType[NotificationCauseType["SYSTEM"] = 2] = "SYSTEM";
})(NotificationCauseType = exports.NotificationCauseType || (exports.NotificationCauseType = {}));
var NotificationDataType;
(function (NotificationDataType) {
    NotificationDataType[NotificationDataType["PROSPECTIVEMEMBER"] = 0] = "PROSPECTIVEMEMBER";
    NotificationDataType[NotificationDataType["PERSONNELFILES"] = 1] = "PERSONNELFILES";
    NotificationDataType[NotificationDataType["EVENT"] = 2] = "EVENT";
    NotificationDataType[NotificationDataType["PERMISSIONCHANGE"] = 3] = "PERMISSIONCHANGE";
})(NotificationDataType = exports.NotificationDataType || (exports.NotificationDataType = {}));
var CustomAttendanceFieldEntryType;
(function (CustomAttendanceFieldEntryType) {
    CustomAttendanceFieldEntryType[CustomAttendanceFieldEntryType["TEXT"] = 0] = "TEXT";
    CustomAttendanceFieldEntryType[CustomAttendanceFieldEntryType["NUMBER"] = 1] = "NUMBER";
    CustomAttendanceFieldEntryType[CustomAttendanceFieldEntryType["DATE"] = 2] = "DATE";
    CustomAttendanceFieldEntryType[CustomAttendanceFieldEntryType["CHECKBOX"] = 3] = "CHECKBOX";
    CustomAttendanceFieldEntryType[CustomAttendanceFieldEntryType["FILE"] = 4] = "FILE";
})(CustomAttendanceFieldEntryType = exports.CustomAttendanceFieldEntryType || (exports.CustomAttendanceFieldEntryType = {}));
var CAPWATCHImportUpdate;
(function (CAPWATCHImportUpdate) {
    CAPWATCHImportUpdate[CAPWATCHImportUpdate["CAPWATCHFileDownloaded"] = 0] = "CAPWATCHFileDownloaded";
    CAPWATCHImportUpdate[CAPWATCHImportUpdate["FileImported"] = 1] = "FileImported";
    CAPWATCHImportUpdate[CAPWATCHImportUpdate["CAPWATCHFileDone"] = 2] = "CAPWATCHFileDone";
    CAPWATCHImportUpdate[CAPWATCHImportUpdate["ProgressInitialization"] = 3] = "ProgressInitialization";
})(CAPWATCHImportUpdate = exports.CAPWATCHImportUpdate || (exports.CAPWATCHImportUpdate = {}));
var PasswordResult;
(function (PasswordResult) {
    PasswordResult[PasswordResult["VALID"] = 0] = "VALID";
    PasswordResult[PasswordResult["VALID_EXPIRED"] = 1] = "VALID_EXPIRED";
    PasswordResult[PasswordResult["INVALID"] = 2] = "INVALID";
})(PasswordResult = exports.PasswordResult || (exports.PasswordResult = {}));
var PasswordSetResult;
(function (PasswordSetResult) {
    PasswordSetResult[PasswordSetResult["OK"] = 0] = "OK";
    PasswordSetResult[PasswordSetResult["IN_HISTORY"] = 1] = "IN_HISTORY";
    PasswordSetResult[PasswordSetResult["COMPLEXITY"] = 2] = "COMPLEXITY";
    PasswordSetResult[PasswordSetResult["MIN_AGE"] = 3] = "MIN_AGE";
})(PasswordSetResult = exports.PasswordSetResult || (exports.PasswordSetResult = {}));
