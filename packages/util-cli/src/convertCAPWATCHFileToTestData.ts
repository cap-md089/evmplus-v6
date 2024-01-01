#!/usr/local/bin/node --no-warnings
/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { spawn } from 'child_process';
import { CAPMemberContactPriority, CAPMemberContactType, NHQ, TableDataType } from 'common-lib';
import * as csv from 'csv-parse';
import { promises as fs } from 'fs';
import { convertNHQDate } from 'server-common';
import { dirname } from 'path';
import type { PresetRecords } from 'server-jest-config';

if (process.argv.length !== 4) {
	console.error('Error! CAPWATCH file and conversion destination not provided');
	process.exit(2);
}

const capwatchPath = process.argv[2];
const destinationPath = process.argv[3];

if (!capwatchPath.startsWith('/')) {
	console.error('Error! CAPWATCH file path must be absolute');
	process.exit(3);
}

if (!destinationPath.startsWith('/')) {
	console.error('Error! Destination file path must be absolute');
	process.exit(3);
}

process.on('unhandledRejection', up => {
	throw up;
});

type Names =
	| 'Member'
	| 'DutyPosition'
	| 'MbrContact'
	| 'CadetDutyPositions'
	| 'CadetActivities'
	| 'OFlight'
	| 'MbrAchievements'
	| 'CadetAchv'
	| 'CadetAchvAprs'
	| 'CdtAchvEnum'
	| 'CadetHFZInformation'
	| 'Organization';

interface NameToType {
	Member: NHQ.NHQMember;
	DutyPosition: NHQ.DutyPosition;
	MbrContact: NHQ.MbrContact;
	CadetDutyPositions: NHQ.CadetDutyPosition;
	CadetActivities: NHQ.CadetActivities;
	OFlight: NHQ.OFlight;
	MbrAchievements: NHQ.MbrAchievements;
	CadetAchv: NHQ.CadetAchv;
	CadetAchvAprs: NHQ.CadetAchvAprs;
	CdtAchvEnum: NHQ.CdtAchvEnum;
	CadetHFZInformation: NHQ.CadetHFZInformation;
	Organization: NHQ.Organization;
}

type FileForm<T extends string> = `${T}.txt`;
type DBNames = Exclude<Names, 'CadetDutyPositions'> | 'CadetDutyPosition';

type TableForm<T extends string> = `NHQ_${T}`;

type FileData<T> = {
	[P in keyof T]: string;
};

type FileHandler<T> = (rawData: FileData<T>) => T;

const mapFunctions: { [F in Names as FileForm<F>]: FileHandler<NameToType[F]> } = {
	'Member.txt': member => ({
		CAPID: parseInt(member.CAPID, 10),
		SSN: '',
		NameLast: member.NameLast,
		NameFirst: member.NameFirst,
		NameMiddle: member.NameMiddle,
		NameSuffix: member.NameSuffix,
		Gender: member.Gender,
		DOB: convertNHQDate(member.DOB).toISOString(),
		Profession: member.Profession,
		EducationLevel: member.EducationLevel,
		Citizen: member.Citizen,
		ORGID: parseInt(member.ORGID + '', 10),
		Wing: member.Wing,
		Unit: member.Unit,
		Rank: member.Rank,
		Joined: convertNHQDate(member.Joined).toISOString(),
		Expiration: convertNHQDate(member.Expiration).toISOString(),
		OrgJoined: convertNHQDate(member.OrgJoined).toISOString(),
		UsrID: member.UsrID,
		DateMod: convertNHQDate(member.DateMod).toISOString(),
		LSCode: member.LSCode,
		Type: member.Type as NHQ.NHQMember['Type'],
		RankDate: convertNHQDate(member.RankDate).toISOString(),
		Region: member.Region,
		MbrStatus: member.MbrStatus,
		PicStatus: member.PicStatus,
		PicDate: convertNHQDate(member.PicDate).toISOString(),
		CdtWaiver: member.CdtWaiver,
	}),
	'DutyPosition.txt': duties => ({
		CAPID: parseInt(duties.CAPID, 10),
		Duty: duties.Duty,
		FunctArea: duties.FunctArea,
		Lvl: duties.Lvl,
		Asst: parseInt(duties.Asst, 10),
		UsrID: duties.UsrID,
		DateMod: convertNHQDate(duties.DateMod).toISOString(),
		ORGID: parseInt(duties.ORGID, 10),
	}),
	'MbrContact.txt': contact => ({
		CAPID: parseInt(contact.CAPID.toString(), 10),
		Type: contact.Type as CAPMemberContactType,
		Priority: contact.Priority as CAPMemberContactPriority,
		Contact: contact.Contact,
		UsrID: contact.UsrID,
		DateMod: convertNHQDate(contact.DateMod).toISOString(),
		DoNotContact: contact.DoNotContact === 'True',
	}),
	'CadetDutyPositions.txt': duties => ({
		CAPID: parseInt(duties.CAPID, 10),
		Duty: duties.Duty,
		FunctArea: duties.FunctArea,
		Lvl: duties.Lvl,
		Asst: parseInt(duties.Asst, 10),
		UsrID: duties.UsrID,
		DateMod: convertNHQDate(duties.DateMod).toISOString(),
		ORGID: parseInt(duties.ORGID, 10),
	}),
	'CadetActivities.txt': cadetActivitiesConst => ({
		CAPID: parseInt(cadetActivitiesConst.CAPID + '', 10),
		Type: cadetActivitiesConst.Type,
		Location: cadetActivitiesConst.Location,
		Completed: convertNHQDate(cadetActivitiesConst.Completed).toISOString(),
		UsrID: cadetActivitiesConst.UsrID,
		DateMod: convertNHQDate(cadetActivitiesConst.DateMod).toISOString(),
	}),
	'OFlight.txt': oFlightConst => ({
		CAPID: parseInt(oFlightConst.CAPID + '', 10),
		Wing: oFlightConst.Wing,
		Unit: oFlightConst.Unit,
		Amount: parseInt(oFlightConst.Amount, 10),
		Syllabus: parseInt(oFlightConst.Syllabus, 10),
		Type: parseInt(oFlightConst.Type, 10),
		FltDate: convertNHQDate(oFlightConst.FltDate).toISOString(),
		TransDate: convertNHQDate(oFlightConst.TransDate).toISOString(),
		FltRlsNum: oFlightConst.FltRlsNum,
		AcftTailNum: oFlightConst.AcftTailNum,
		FltTime: parseInt(oFlightConst.FltTime, 10),
		LstUsr: oFlightConst.LstUsr,
		LstDateMod: oFlightConst.LstDateMod,
		Comments: oFlightConst.Comments,
	}),
	'MbrAchievements.txt': achv => ({
		CAPID: parseInt(achv.CAPID.toString(), 10),
		AchvID: parseInt(achv.AchvID.toString(), 10),
		AuthByCAPID: parseInt(achv.AuthByCAPID.toString(), 10),
		AuthDate: +convertNHQDate(achv.AuthDate.toString()),
		AuthReason: achv.AuthReason,
		Completed: parseInt(achv.Completed.toString(), 10),
		DateCreated:
			achv.DateCreated.toString() === 'NTC'
				? +Date.now()
				: +convertNHQDate(achv.DateCreated.toString()),
		DateMod: +convertNHQDate(achv.DateMod.toString()),
		Expiration: +convertNHQDate(achv.Expiration.toString()),
		FirstUsr: achv.FirstUsr,
		ORGID: parseInt(achv.ORGID.toString(), 10),
		OriginallyAccomplished: +convertNHQDate(achv.OriginallyAccomplished.toString()),
		RecID: parseInt(achv.RecID.toString(), 10),
		Source: achv.Source,
		Status: achv.Status as NHQ.MbrAchievements['Status'],
		UsrID: achv.UsrID,
	}),
	'CadetAchv.txt': member => ({
		CAPID: parseInt(member.CAPID, 10),
		CadetAchvID: parseInt(member.CadetAchvID, 10),
		PhyFitTest: convertNHQDate(member.PhyFitTest).toISOString(),
		LeadLabDateP: convertNHQDate(member.LeadLabDateP).toISOString(),
		LeadLabScore: parseInt(member.LeadLabScore, 10),
		AEDateP: convertNHQDate(member.AEDateP).toISOString(),
		AEScore: parseInt(member.AEScore, 10),
		AEMod: parseInt(member.AEMod, 10),
		AETest: parseInt(member.AETest, 10),
		MoralLDateP: convertNHQDate(member.MoralLDateP).toISOString(),
		ActivePart: member.ActivePart === 'True',
		OtherReq: member.OtherReq === 'True',
		SDAReport: member.SDAReport === 'True',
		UsrID: member.UsrID,
		DateMod: convertNHQDate(member.DateMod).toISOString(),
		FirstUsr: member.FirstUsr,
		DateCreated: convertNHQDate(member.DateCreated).toISOString(),
		DrillDate: convertNHQDate(member.DrillDate).toISOString(),
		DrillScore: parseInt(member.DrillScore, 10),
		LeadCurr: member.LeadCurr,
		CadetOath: member.CadetOath === 'True',
		AEBookValue: member.AEBookValue,
		MileRun: parseInt(member.MileRun, 10),
		ShuttleRun: parseInt(member.ShuttleRun, 10),
		SitAndReach: parseInt(member.SitAndReach, 10),
		PushUps: parseInt(member.PushUps, 10),
		CurlUps: parseInt(member.CurlUps, 10),
		HFZID: parseInt(member.HFZID, 10),
		StaffServiceDate: convertNHQDate(member.StaffServiceDate).toISOString(),
		TechnicalWritingAssignment: member.TechnicalWritingAssignment,
		TechnicalWritingAssignmentDate: convertNHQDate(
			member.TechnicalWritingAssignmentDate,
		).toISOString(),
		OralPresentationDate: convertNHQDate(member.OralPresentationDate).toISOString(),
	}),
	'CadetAchvAprs.txt': member => ({
		CAPID: parseInt(member.CAPID, 10),
		CadetAchvID: parseInt(member.CadetAchvID, 10),
		Status: member.Status as NHQ.CadetAchvAprs['Status'],
		AprCAPID: parseInt(member.AprCAPID, 10),
		DspReason: member.DspReason,
		AwardNo: parseInt(member.AwardNo, 10),
		JROTCWaiver: member.JROTCWaiver === 'True',
		UsrID: member.UsrID,
		DateMod: convertNHQDate(member.DateMod).toISOString(),
		FirstUsr: member.FirstUsr,
		DateCreated: convertNHQDate(member.DateCreated).toISOString(),
		PrintedCert: member.PrintedCert === 'True',
	}),
	'CdtAchvEnum.txt': member => ({
		CadetAchvID: parseInt(member.CadetAchvID, 10),
		AchvName: member.AchvName,
		CurAwdNo: parseInt(member.CurAwdNo, 10),
		UsrID: member.UsrID,
		DateMod: convertNHQDate(member.DateMod).toISOString(),
		FirstUsr: member.FirstUsr,
		DateCreated: convertNHQDate(member.DateCreated).toISOString(),
		Rank: member.Rank,
	}),
	'CadetHFZInformation.txt': member => ({
		HFZID: parseInt(member.HFZID, 10),
		CAPID: parseInt(member.CAPID, 10),
		DateTaken: convertNHQDate(member.DateTaken).toISOString(),
		ORGID: parseInt(member.ORGID, 10),
		IsPassed: member.IsPassed === 'True',
		WeatherWaiver: member.WeatherWaiver === 'True',
		PacerRun: member.PacerRun,
		PacerRunWaiver: member.PacerRunWaiver === 'True',
		PacerRunPassed: member.PacerRunPassed,
		MileRun: member.MileRun,
		MileRunWaiver: member.MileRunWaiver === 'True',
		MileRunPassed: member.MileRunPassed,
		CurlUp: member.CurlUp,
		CurlUpWaiver: member.CurlUpWaiver === 'True',
		CurlUpPassed: member.CurlUpPassed,
		SitAndReach: member.SitAndReach,
		SitAndReachWaiver: member.SitAndReachWaiver === 'True',
		SitAndReachPassed: member.SitAndReachPassed,
	}),
	'Organization.txt': organization => ({
		ORGID: parseInt(organization.ORGID, 10),
		Region: organization.Region,
		Wing: organization.Wing,
		Unit: organization.Unit,
		NextLevel: parseInt(organization.NextLevel, 10),
		Name: organization.Name,
		Type: organization.Type,
		DateChartered: organization.DateChartered,
		Status: organization.Status,
		Scope: organization.Scope,
		UsrID: organization.UsrID,
		DateMod: organization.DateMod,
		FirstUsr: organization.FirstUsr,
		DateCreated: organization.DateCreated,
		DateReceived: organization.DateReceived,
		OrgNotes: organization.OrgNotes,
	}),
};

void (async () => {
	const tableSetup: PresetRecords = {};

	await Promise.all(
		Object.entries(mapFunctions).map(async ([fileString, handler]) => {
			const file = fileString as FileForm<Names>;

			const { stdout, stderr } = spawn('unzip', ['-op', capwatchPath, file]);

			stderr.pipe(process.stderr);

			const parser = csv({
				columns: true,
			});

			const table = [] as Array<NameToType[Names]>;

			parser.on('readable', () => {
				let record: any;

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				while ((record = parser.read())) {
					console.log(record);
					table.push(handler(record));
				}
			});

			await new Promise<void>(res => {
				parser.on('end', () => {
					res();
				});

				stdout.pipe(parser);
			});

			const basicTableName = `NHQ_${file.split('.')[0]}`;
			const tableName: TableForm<DBNames> =
				basicTableName === 'NHQ_CadetDutyPositions'
					? ('NHQ_CadetDutyPosition' as const)
					: (basicTableName as TableForm<DBNames>);

			// @ts-ignore: it's a bit hard to keep the type consistent across the types with variables
			tableSetup[tableName] = table as Array<TableDataType<typeof tableName>>;
		}),
	);

	const tableSetupString = JSON.stringify(tableSetup, null, 4);

	try {
		await fs.mkdir(dirname(destinationPath));
		// eslint-disable-next-line
	} catch (e) {}

	await fs.writeFile(destinationPath, tableSetupString);
})();
