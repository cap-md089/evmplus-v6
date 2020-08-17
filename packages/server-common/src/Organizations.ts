/**
 * Copyright (C) 2020 Andrew Rioux
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

import { Schema } from '@mysql/xdevapi';
import {
	AsyncEither,
	asyncRight,
	errorGenerator,
	get,
	getORGIDFromAccount,
	NHQ,
	RegularCAPAccountObject,
	ServerError,
	Timezone,
} from 'common-lib';
import { collectResults, safeBind } from './MySQLUtil';

// import { Schema } from '@mysql/xdevapi';
// import { NHQ } from 'common-lib';

export function getUnitNumber(inOrg: number) {
	// execute query and return unit Region + '-' + Wing + '-' + Unit
}

export function getUnitName(inOrg: number) {
	// execute query and return unit Name
}

const timezoneForWing: { [key: string]: Timezone } = {
	AK: 'America/Anchorage',
	AL: 'America/Chicago',
	AR: 'America/Chicago',
	AZ: 'America/Arizona',
	CA: 'America/Los_Angeles',
	CO: 'America/Denver',
	CT: 'America/New_York',
	DC: 'America/New_York',
	DE: 'America/New_York',
	FL: 'America/New_York',
	GA: 'America/New_York',
	GLR: 'America/New_York',
	HI: 'America/Hawaii',
	IA: 'America/Chicago',
	ID: 'America/Denver',
	IL: 'America/Chicago',
	IN: 'America/New_York',
	KS: 'America/New_York',
	KY: 'America/New_York',
	LA: 'America/Chicago',
	MA: 'America/New_York',
	MAR: 'America/New_York',
	MD: 'America/New_York',
	ME: 'America/New_York',
	MI: 'America/New_York',
	MN: 'America/Chicago',
	MO: 'America/Chicago',
	MS: 'America/Chicago',
	MT: 'America/Denver',
	NC: 'America/New_York',
	NCR: 'America/Chicago',
	ND: 'America/Denver',
	NE: 'America/Chicago',
	NER: 'America/New_York',
	NH: 'America/New_York',
	NHQ: 'America/Chicago',
	NJ: 'America/New_York',
	NM: 'America/Denver',
	NV: 'America/Los_Angeles',
	NY: 'America/New_York',
	OH: 'America/New_York',
	OK: 'America/Chicago',
	OR: 'America/Los_Angeles',
	PA: 'America/New_York',
	PCR: 'America/Los_Angeles',
	PR: 'America/Puerto_Rico',
	RI: 'America/New_York',
	RMR: 'America/Denver',
	SC: 'America/New_York',
	SD: 'America/Denver',
	SER: 'America/New_York',
	SWR: 'America/Chicago',
	TN: 'America/New_York',
	TX: 'America/Chicago',
	UT: 'America/Denver',
	VA: 'America/New_York',
	VT: 'America/New_York',
	WA: 'America/Los_Angeles',
	WI: 'America/Chicago',
	WV: 'America/New_York',
	WY: 'America/Denver',
};

export const getUnitTimezoneGuess = (
	schema: Schema,
	account: RegularCAPAccountObject,
): AsyncEither<ServerError, Timezone> =>
	asyncRight(
		schema.getCollection<NHQ.Organization>('NHQ_Organization'),
		errorGenerator('Could not get timezone for organization'),
	)
		.map(collection => collection.find('ORGID = :ORGID'))
		.map(find => safeBind(find, { ORGID: getORGIDFromAccount(account) }))
		.map(find => collectResults(find))
		.filter(orgs => orgs.length === 1, {
			type: 'OTHER',
			code: 404,
			message: 'Could not find organization requested',
		})
		.map(get(0))
		.map(org => timezoneForWing[org.Wing])
		.filter(timezone => timezone !== undefined && timezone !== null, {
			type: 'OTHER',
			code: 404,
			message: 'Could not find timezone requested',
		});
