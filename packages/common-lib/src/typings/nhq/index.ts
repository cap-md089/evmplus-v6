// Table for SQL definitions for CAP NHQ
//
// Documentation is not provided by NHQ
//
// Copyright (C) 2022 Andrew Rioux
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

export type CadetAprvStatus = 'INC' | 'PND' | 'APR';

/**
 * The member contact info for a user
 *
 * We think it can only be a string, as it is hard (impossible?) to input
 * multiple contacts of a certain type through the UI provided on NHQ
 */
export interface CAPMemberContactInstance {
	/**
	 * First contact to try and raise
	 */
	PRIMARY?: string;
	/**
	 * Second contact to try and raise
	 */
	SECONDARY?: string;
	/**
	 * Only used for emergency; go through the primary and secondary
	 * contacts first
	 */
	EMERGENCY?: string;
}

/**
 * Contains all the contact info for the member, according to NHQ
 */
export interface CAPMemberContact {
	/**
	 * A contact method to use to get in touch with the member
	 */
	CADETPARENTEMAIL: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	CADETPARENTPHONE: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	CELLPHONE: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	EMAIL: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	HOMEPHONE: CAPMemberContactInstance;
	/**
	 * A contact method to use to get in touch with the member
	 */
	WORKPHONE: CAPMemberContactInstance;
}

/**
 * Used for looping through the contact types
 */
export type CAPMemberContactType = keyof CAPMemberContact;

/**
 * Used for getting priorities and such
 */
export type CAPMemberContactPriority = keyof CAPMemberContactInstance;

export interface CadetAchv {
	CAPID: number;
	CadetAchvID: number;
	PhyFitTest: string;
	LeadLabDateP: string;
	LeadLabScore: number;
	AEDateP: string;
	AEScore: number;
	AEMod: number;
	AETest: number;
	MoralLDateP: string;
	ActivePart: boolean;
	OtherReq: boolean;
	SDAReport: boolean;
	UsrID: string;
	DateMod: string;
	FirstUsr: string;
	DateCreated: string;
	DrillDate: string;
	DrillScore: number;
	LeadCurr: string;
	CadetOath: boolean;
	AEBookValue: string;
	MileRun: number;
	ShuttleRun: number;
	SitAndReach: number;
	PushUps: number;
	CurlUps: number;
	HFZID: number;
	StaffServiceDate: string;
	TechnicalWritingAssignment: string;
	TechnicalWritingAssignmentDate: string;
	OralPresentationDate: string;
}

export interface CadetAchvAprs {
	CAPID: number;
	CadetAchvID: number;
	Status: CadetAprvStatus;
	AprCAPID: number;
	DspReason: string;
	AwardNo: number;
	JROTCWaiver: boolean;
	UsrID: string;
	DateMod: string;
	FirstUsr: string;
	DateCreated: string;
	PrintedCert: boolean;
}

export interface CdtAchvEnum {
	CadetAchvID: number;
	AchvName: string;
	CurAwdNo: number;
	UsrID: string;
	DateMod: string;
	FirstUsr: string;
	DateCreated: string;
	Rank: string;
}

export interface CadetHFZInformation {
	HFZID: number;
	CAPID: number;
	DateTaken: string;
	ORGID: number;
	IsPassed: boolean;
	WeatherWaiver: boolean;
	PacerRun: string;
	PacerRunWaiver: boolean;
	PacerRunPassed: string;
	MileRun: string;
	MileRunWaiver: boolean;
	MileRunPassed: string;
	CurlUp: string;
	CurlUpWaiver: boolean;
	CurlUpPassed: string;
	SitAndReach: string;
	SitAndReachWaiver: boolean;
	SitAndReachPassed: string;
}

export interface CadetActivities {
	CAPID: number;
	Type: string;
	Location: string;
	Completed: string;
	UsrID: string;
	DateMod: string;
}

export interface Commanders {
	ORGID: number;
	Region: string;
	Wing: string;
	Unit: string;
	CAPID: number;
	DateAsg: string;
	UsrID: string;
	DateMod: string;
	NameLast: string;
	NameFirst: string;
	NameMiddle: string;
	NameSuffix: string;
	Rank: string;
}

export interface OFlight {
	CAPID: number;
	Wing: string;
	Unit: string;
	Amount: number;
	Syllabus: number;
	Type: number;
	FltDate: string;
	TransDate: string;
	FltRlsNum: string;
	AcftTailNum: string;
	FltTime: number;
	LstUsr: string;
	LstDateMod: string;
	Comments: string;
}

export interface CadetDutyPosition {
	CAPID: number;
	Duty: string;
	FunctArea: string;
	Lvl: string;
	Asst: number;
	UsrID: string;
	DateMod: string;
	ORGID: number;
}

export interface DutyPosition {
	CAPID: number;
	Duty: string;
	FunctArea: string;
	Lvl: string;
	Asst: number;
	UsrID: string;
	DateMod: string;
	ORGID: number;
}

export interface MbrContact {
	CAPID: number;
	Type: CAPMemberContactType;
	Priority: CAPMemberContactPriority;
	Contact: string;
	UsrID: string;
	DateMod: string;
	DoNotContact: boolean;
}

export interface NHQMember {
	CAPID: number;
	SSN: '';
	NameLast: string;
	NameFirst: string;
	NameMiddle: string;
	NameSuffix: string;
	Gender: string;
	DOB: string;
	Profession: string;
	EducationLevel: string;
	Citizen: string;
	ORGID: number;
	Wing: string;
	Unit: string;
	Rank: string;
	Joined: string;
	Expiration: string;
	OrgJoined: string;
	UsrID: string;
	DateMod: string;
	LSCode: string;
	Type:
		| 'NULL'
		| 'CADET'
		| 'CADET SPONSOR'
		| 'SENIOR'
		| 'PATRON'
		| 'FIFTY YEAR'
		| 'FiftyYear'
		| 'INDEFINITE'
		| 'LIFE'
		| 'PATRON'
		| 'STATE LEG';
	RankDate: string;
	Region: string;
	MbrStatus: string;
	PicStatus: string;
	PicDate: string;
	CdtWaiver: string;
}

export interface OrgAddresses {
	ORGID: number;
	Wing: string;
	Unit: string;
	Type: string;
	Priority: string;
	Addr1: string;
	Addr2: string;
	City: string;
	State: string;
	Zip: string;
	Latitude: string;
	Longitude: string;
	UsrID: string;
	DateMod: string;
}

export interface Organization {
	ORGID: number;
	Region: string;
	Wing: string;
	Unit: string;
	NextLevel: number;
	Name: string;
	Type: string;
	DateChartered: string;
	Status: string;
	Scope: string;
	UsrID: string;
	DateMod: string;
	FirstUsr: string;
	DateCreated: string;
	DateReceived: string;
	OrgNotes: string;
}

export interface OrgContact {
	ORGID: number;
	Wing: string;
	Unit: string;
	Type: string;
	Priority: string;
	Contact: string;
	UsrID: string;
	DateMod: string;
}

export interface OrgMeetings {
	ORGID: number;
	Wing: string;
	Unit: string;
	MeetTime: string;
	MeetDay: string;
	ActivityDate: string;
	Descr: string;
	UsrID: string;
	DateMod: string;
}

export interface Achievements {
	AcvhID: string;
	Achv: string;
	FunctionalArea: string;
}

export interface MbrAchievements {
	CAPID: number;
	AchvID: number;
	Status: 'ACTIVE' | 'EXPIRED' | 'NOT APPROVED' | 'PENDING' | 'TRAINING';
	OriginallyAccomplished: number;
	Completed: number;
	Expiration: number;
	AuthByCAPID: number;
	AuthReason: string;
	AuthDate: number;
	Source: string;
	RecID: number;
	FirstUsr: string;
	DateCreated: number;
	UsrID: string;
	DateMod: number;
	ORGID: number;
}

export interface SeniorAwards {
	CAPID: number;
	Award: string;
	AwardNo: number;
	Completed: string;
	UsrID: string;
	DateMod: string;
}

export interface SeniorLevel {
	CAPID: number;
	Lvl: string;
	Completed: string;
	UsrID: string;
	DateMod: string;
	FirstUsr: string;
	DateCreated: string;
	RecID: number;
}

export * as PL from './pl';
