/**
 * Copyright (C) 2020 Andrew Rioux
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
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const organizationParse: CAPWATCHModule<NHQ.Organization> = async (
	fileData,
	schema,
	isORGIDValid,
	trustedFile,
) => {
	if (!trustedFile) {
		return CAPWATCHError.NOPERMISSIONS;
	}

	if (
		typeof fileData[0].ORGID === 'undefined' ||
		typeof fileData[0].Region === 'undefined' ||
		typeof fileData[0].Wing === 'undefined' ||
		typeof fileData[0].Unit === 'undefined' ||
		typeof fileData[0].NextLevel === 'undefined' ||
		typeof fileData[0].Name === 'undefined' ||
		typeof fileData[0].Type === 'undefined' ||
		typeof fileData[0].Status === 'undefined' ||
		typeof fileData[0].Scope === 'undefined' ||
		typeof fileData[0].OrgNotes === 'undefined'
	) {
		return CAPWATCHError.BADDATA;
	}

	const organizationCollection = schema.getCollection<NHQ.Organization>('NHQ_Organization');

	try {
		await organizationCollection.remove('true').execute();
	} catch (e) {
		console.warn(e);
		return CAPWATCHError.CLEAR;
	}

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
		} catch (e) {
			console.warn(e);
			return CAPWATCHError.INSERT;
		}
	}

	return CAPWATCHError.NONE;
};

export default organizationParse;
