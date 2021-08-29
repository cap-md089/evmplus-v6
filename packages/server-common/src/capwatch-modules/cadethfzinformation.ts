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

import { validator } from 'auto-client-api';
import { Either, NHQ, Validator } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';
import { convertCAPWATCHValidator } from './lib/validator';

const recordValidator = convertCAPWATCHValidator(
	validator<NHQ.CadetHFZInformation>(Validator) as Validator<NHQ.CadetHFZInformation>,
);

const cadetHFZInformationParse: CAPWATCHModule<NHQ.CadetHFZInformation> = async function* (
	backend,
	fileData,
	schema,
) {
	if (!!fileData.map(value => recordValidator.validate(value, '')).find(Either.isLeft)) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	const cadetHFZInformationCollection = schema.getCollection<NHQ.CadetHFZInformation>(
		'NHQ_CadetHFZInformation',
	);

	let currentRecord = 0;

	for (const member of fileData) {
		try {
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

			currentRecord++;
			if (currentRecord % 15 === 0) {
				yield {
					type: 'Update',
					currentRecord,
				};
			}
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default cadetHFZInformationParse;
