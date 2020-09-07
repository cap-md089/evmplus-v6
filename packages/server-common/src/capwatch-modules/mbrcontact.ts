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

import { NHQ, CAPMemberContactType, CAPMemberContactPriority } from 'common-lib';
import { convertNHQDate } from '..';
import { CAPWATCHError, CAPWATCHModule } from '../ImportCAPWATCHFile';

const mbrContact: CAPWATCHModule<NHQ.MbrContact> = async (fileData, schema) => {
	if (typeof fileData[0].CAPID === 'undefined') {
		return CAPWATCHError.BADDATA;
	}

	try {
		const mbrContactCollection = schema.getCollection<NHQ.MbrContact>('NHQ_MbrContact');

		const addedCAPIDs: { [key: string]: boolean } = {};

		let values: NHQ.MbrContact;

		for (const contact of fileData) {
			if (!addedCAPIDs[contact.CAPID]) {
				await mbrContactCollection
					.remove('CAPID = :CAPID')
					.bind('CAPID', parseInt(contact.CAPID, 10))
					.execute();
			}

			addedCAPIDs[contact.CAPID] = true;

			values = {
				CAPID: parseInt(contact.CAPID.toString(), 10),
				Type: contact.Type as CAPMemberContactType,
				Priority: contact.Priority as CAPMemberContactPriority,
				Contact: contact.Contact,
				UsrID: contact.UsrID,
				DateMod: convertNHQDate(contact.DateMod).toISOString(),
				DoNotContact: contact.DoNotContact === 'True',
			};

			await mbrContactCollection.add(values).execute();
		}

		return CAPWATCHError.NONE;
	} catch (e) {
		console.warn(e);
		return CAPWATCHError.INSERT;
	}
};

export default mbrContact;
