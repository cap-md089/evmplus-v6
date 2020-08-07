/**
 * Copyright (C) 2020 Glenn Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { NHQ } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const cadetAchievementParse: CAPWATCHModule<NHQ.CadetAchv> = async (fileData, schema) => {
	if (
		fileData.length === 0 ||
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].CadetAchvID === 'undefined' ||
		typeof fileData[0].PhyFitTest === 'undefined' ||
		typeof fileData[0].LeadLabDateP === 'undefined' ||
		typeof fileData[0].LeadLabScore === 'undefined' ||
		typeof fileData[0].AEDateP === 'undefined' ||
		typeof fileData[0].AEScore === 'undefined' ||
		typeof fileData[0].AEMod === 'undefined' ||
		typeof fileData[0].AETest === 'undefined' ||
		typeof fileData[0].MoralLDateP === 'undefined' ||
		typeof fileData[0].ActivePart === 'undefined' ||
		typeof fileData[0].OtherReq === 'undefined' ||
		typeof fileData[0].SDAReport === 'undefined' ||
		typeof fileData[0].UsrID === 'undefined' ||
		typeof fileData[0].DateMod === 'undefined' ||
		typeof fileData[0].FirstUsr === 'undefined' ||
		typeof fileData[0].DateCreated === 'undefined' ||
		typeof fileData[0].DrillDate === 'undefined' ||
		typeof fileData[0].DrillScore === 'undefined' ||
		typeof fileData[0].LeadCurr === 'undefined' ||
		typeof fileData[0].CadetOath === 'undefined' ||
		typeof fileData[0].AEBookValue === 'undefined' ||
		typeof fileData[0].MileRun === 'undefined' ||
		typeof fileData[0].ShuttleRun === 'undefined' ||
		typeof fileData[0].SitAndReach === 'undefined' ||
		typeof fileData[0].PushUps === 'undefined' ||
		typeof fileData[0].CurlUps === 'undefined' ||
		typeof fileData[0].HFZID === 'undefined' ||
		typeof fileData[0].StaffServiceDate === 'undefined' ||
		typeof fileData[0].TechnicalWritingAssignment === 'undefined' ||
		typeof fileData[0].TechnicalWritingAssignmentDate === 'undefined' ||
		typeof fileData[0].OralPresentationDate === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const cadetAchievementCollection = schema.getCollection<NHQ.CadetAchv>('Cadet_Achv');

	for (const member of fileData) {
		try {
			await Promise.all([
				cadetAchievementCollection
					.remove('CAPID = :CAPID')
					.bind({ CAPID: parseInt(member.CAPID + '', 10) })
					.execute()
			]);

			const values = {
				CAPID: parseInt(member.CAPID + '', 10),
				CadetAchvID: member.CadetAchvID,
				PhyFitTest: convertNHQDate(member.PhyFitTest).toISOString(),
				LeadLabDateP: convertNHQDate(member.LeadLabDateP).toISOString(),
				LeadLabScore: member.LeadLabScore,
				AEDateP: convertNHQDate(member.AEDateP).toISOString(),
				AEScore: member.AEScore,
				AEMod: member.AEMod,
				AETest: member.AETest,
				MoralLDateP: convertNHQDate(member.MoralLDateP).toISOString(),
				ActivePart: member.ActivePart,
				OtherReq: member.OtherReq,
				SDAReport: member.SDAReport,
				UsrID: member.UsrID,
				DateMod: convertNHQDate(member.DateMod).toISOString(),
				FirstUsr: member.FirstUsr,
				DateCreated: convertNHQDate(member.DateCreated).toISOString(),
				DrillDate: convertNHQDate(member.DrillDate).toISOString(),
				DrillScore: member.DrillScore,
				LeadCurr: member.LeadCurr,
				CadetOath: member.CadetOath,
				AEBookValue: member.AEBookValue,
				MileRun: member.MileRun,
				ShuttleRun: member.ShuttleRun,
				SitAndReach: member.SitAndReach,
				PushUps: member.PushUps,
				CurlUps: member.CurlUps,
				HFZID: member.HFZID,
				StaffServiceDate: convertNHQDate(member.StaffServiceDate).toISOString(),
				TechnicalWritingAssignment: member.TechnicalWritingAssignment,
				TechnicalWritingAssignmentDate: convertNHQDate(member.TechnicalWritingAssignmentDate).toISOString(),
				OralPresentationDate: convertNHQDate(member.OralPresentationDate).toISOString()
			};

			await cadetAchievementCollection.add(values).execute();
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default cadetAchievementParse;
