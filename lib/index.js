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
//# sourceMappingURL=index.js.map