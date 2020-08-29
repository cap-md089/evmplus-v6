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

const cadetAchievementApprovalsParse: CAPWATCHModule<NHQ.CadetAchvAprs> = async (
	fileData,
	schema,
) => {
	if (
		fileData.length === 0 ||
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].CadetAchvID === 'undefined' ||
		typeof fileData[0].Status === 'undefined' ||
		typeof fileData[0].AprCAPID === 'undefined' ||
		typeof fileData[0].DspReason === 'undefined' ||
		typeof fileData[0].AwardNo === 'undefined' ||
		typeof fileData[0].JROTCWaiver === 'undefined' ||
		typeof fileData[0].UsrID === 'undefined' ||
		typeof fileData[0].DateMod === 'undefined' ||
		typeof fileData[0].FirstUsr === 'undefined' ||
		typeof fileData[0].DateCreated === 'undefined' ||
		typeof fileData[0].PrintedCert === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const cadetAchievementApprovalsCollection = schema.getCollection<NHQ.CadetAchvAprs>(
		'NHQ_CadetAchvAprs',
	);

	for (const member of fileData) {
		try {
			await Promise.all([
				cadetAchievementApprovalsCollection
					.remove('CAPID = :CAPID')
					.bind({ CAPID: parseInt(member.CAPID + '', 10) })
					.execute(),
			]);

			const values: NHQ.CadetAchvAprs = {
				CAPID: parseInt(member.CAPID, 10),
				CadetAchvID: parseInt(member.CadetAchvID, 10),
				Status: member.Status,
				AprCAPID: parseInt(member.AprCAPID, 10),
				DspReason: member.DspReason,
				AwardNo: parseInt(member.AwardNo, 10),
				JROTCWaiver: member.JROTCWaiver === 'True',
				UsrID: member.UsrID,
				DateMod: convertNHQDate(member.DateMod).toISOString(),
				FirstUsr: member.FirstUsr,
				DateCreated: convertNHQDate(member.DateCreated).toISOString(),
				PrintedCert: +convertNHQDate(member.PrintedCert),
			};

			await cadetAchievementApprovalsCollection.add(values).execute();
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default cadetAchievementApprovalsParse;
