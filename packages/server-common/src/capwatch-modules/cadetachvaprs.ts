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
	validator<NHQ.CadetAchvAprs>(Validator) as Validator<NHQ.CadetAchvAprs>,
);

const cadetAchievementApprovalsParse: CAPWATCHModule<NHQ.CadetAchvAprs> = async function* (
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

	const cadetAchievementApprovalsCollection = schema.getCollection<NHQ.CadetAchvAprs>(
		'NHQ_CadetAchvAprs',
	);

	let currentRecord = 0;

	for (const member of fileData) {
		try {
			const values: NHQ.CadetAchvAprs = {
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
			};

			await cadetAchievementApprovalsCollection.add(values).execute();

			currentRecord++;
			if (currentRecord % 15 === 0) {
				yield {
					type: 'Update',
					currentRecord,
				};
			}
		} catch (e) {
			console.warn(e);
			return yield {
				type: 'Result',
				error: CAPWATCHError.INSERT,
			};
		}
	}

	return yield {
		type: 'Result',
		error: CAPWATCHError.NONE,
	};
};

export default cadetAchievementApprovalsParse;
