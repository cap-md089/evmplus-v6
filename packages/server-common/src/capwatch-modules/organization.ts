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

import { validator } from 'auto-client-api';
import { NHQ, Validator } from 'common-lib';
import { CAPWATCHError, CAPWATCHModule, isFileDataValid } from '../ImportCAPWATCHFile';
import { convertCAPWATCHValidator } from './lib/validator';

const recordValidator = convertCAPWATCHValidator(
	validator<NHQ.Organization>(Validator) as Validator<NHQ.Organization>,
);

const organizationParse: CAPWATCHModule<NHQ.Organization> = async function* (
	backend,
	fileData,
	schema,
	isORGIDValid,
	trustedFile,
) {
	if (!trustedFile) {
		return CAPWATCHError.NOPERMISSIONS;
	}

	if (!isFileDataValid(recordValidator)(fileData)) {
		return yield {
			type: 'Result',
			error: CAPWATCHError.BADDATA,
		};
	}

	const organizationCollection = schema.getCollection<NHQ.Organization>('NHQ_Organization');

	try {
		await organizationCollection.remove('true').execute();
	} catch (e) {
		console.warn(e);
		return yield {
			type: 'Result',
			error: CAPWATCHError.CLEAR,
		};
	}

	let currentRecord = 0;

	for (const organization of fileData) {
		try {
			const values: NHQ.Organization = {
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
			};

			await organizationCollection.add(values).execute();

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

export default organizationParse;
