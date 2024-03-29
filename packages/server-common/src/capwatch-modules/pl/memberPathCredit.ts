// Copyright (C) 2022 Glenn Rioux
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

import { validator } from 'auto-client-api';
import { NHQ, Validator } from 'common-lib';
import { CAPWATCHError, CAPWATCHModule, isFileDataValid } from '../../ImportCAPWATCHFile';
import { convertCAPWATCHValidator } from '../lib/validator';

const recordValidator = convertCAPWATCHValidator(
	validator<NHQ.PL.MemberPathCredit>(Validator) as Validator<NHQ.PL.MemberPathCredit>,
);

const plMemberPathCredit: CAPWATCHModule<NHQ.PL.MemberPathCredit> = async function* (
	backend,
	fileData,
	schema,
	isORGIDValid,
	trustedFile,
) {
	if (!trustedFile) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.NOPERMISSIONS,
		};
	}

	if (!isFileDataValid(recordValidator)(fileData)) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	try {
		const collection = schema.getCollection<NHQ.PL.MemberPathCredit>('NHQ_PL_MemberPathCredit');

		if (!(await collection.existsInDatabase())) {
			await schema.createCollection('NHQ_PL_MemberPathCredit');
		}

		try {
			await collection.remove('true').execute();
		} catch (e) {
			console.warn(e);
			return yield {
				type: 'Result',
				error: CAPWATCHError.CLEAR,
			};
		}

		let currentRecord = 0;

		const promises = [];

		for (const mpc of fileData) {
			const values = {
				ExtraCreditEarned: mpc.ExtraCreditEarned,
				Expiration: mpc.Expiration,
				Completed: mpc.Completed,
				StatusID: parseInt(mpc.StatusID, 10),
				CAPID: parseInt(mpc.CAPID, 10),
				PathID: parseInt(mpc.PathID, 10),
				MemberPathCreditID: parseInt(mpc.MemberPathCreditID, 10),
			};

			promises.push(collection.add(values).execute());

			currentRecord++;

			if (currentRecord % 15 === 0) {
				yield {
					type: 'Update',
					currentRecord,
				};
			}
		}

		await Promise.all(promises);

		return yield {
			type: 'Result',
			error: CAPWATCHError.NONE,
		};
	} catch (e) {
		console.warn(e);
		return yield {
			type: 'Result',
			error: CAPWATCHError.INSERT,
		};
	}
};

export default plMemberPathCredit;
