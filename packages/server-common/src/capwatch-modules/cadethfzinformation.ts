/**
 * Copyright (C) 2020 Glenn Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { NHQ } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const cadetHFZInformationParse: CAPWATCHModule<NHQ.CadetHFZInformation> = async (
	fileData,
	schema,
) => {
	if (
		fileData.length === 0 ||
		typeof fileData[0].HFZID === 'undefined' ||
		typeof fileData[0].CAPID === 'undefined' ||
		typeof fileData[0].DateTaken === 'undefined' ||
		typeof fileData[0].ORGID === 'undefined' ||
		typeof fileData[0].IsPassed === 'undefined' ||
		typeof fileData[0].WeatherWaiver === 'undefined' ||
		typeof fileData[0].PacerRun === 'undefined' ||
		typeof fileData[0].PacerRunWaiver === 'undefined' ||
		typeof fileData[0].PacerRunPassed === 'undefined' ||
		typeof fileData[0].MileRun === 'undefined' ||
		typeof fileData[0].MileRunWaiver === 'undefined' ||
		typeof fileData[0].MileRunPassed === 'undefined' ||
		typeof fileData[0].CurlUp === 'undefined' ||
		typeof fileData[0].CurlUpWaiver === 'undefined' ||
		typeof fileData[0].CurlUpPassed === 'undefined' ||
		typeof fileData[0].SitAndReach === 'undefined' ||
		typeof fileData[0].SitAndReachWaiver === 'undefined' ||
		typeof fileData[0].SitAndReachPassed === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const cadetHFZInformationCollection = schema.getCollection<NHQ.CadetHFZInformation>(
		'NHQ_CadetHFZInformation',
	);

	const removedCAPIDs: { [key: string]: boolean } = {};

	for (const member of fileData) {
		try {
			if (!removedCAPIDs[member.CAPID]) {
				await cadetHFZInformationCollection
					.remove('CAPID = :CAPID')
					.bind({ CAPID: parseInt(member.CAPID + '', 10) })
					.execute();
			}

			removedCAPIDs[member.CAPID] = true;

			const values: NHQ.CadetHFZInformation = {
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
			};

			await cadetHFZInformationCollection.add(values).execute();
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default cadetHFZInformationParse;
