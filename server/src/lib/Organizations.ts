import { Collection, Schema } from '@mysql/xdevapi';
import { AsyncEither, asyncLeft, asyncRight, NHQ, Timezone } from 'common-lib';
import { collectResults } from './MySQLUtil';

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
	WY: 'America/Denver'
};

export const getUnitTimezoneGuess = (
	schema: Schema,
	ORGID: number
): AsyncEither<string, Timezone> =>
	asyncRight<string, Collection<NHQ.Organization>>(
		schema.getCollection<NHQ.Organization>('NHQ_Organization'),
		'Could not get organization'
	)
		.map(collection => collection.find('ORGID = :ORGID'))
		.map(find => find.bind({ ORGID }))
		.map(find => collectResults(find))
		.flatMap(orgs =>
			orgs.length === 1
				? asyncRight<string, NHQ.Organization>(orgs[0], 'Could not get timezone')
				: asyncLeft<string, NHQ.Organization>('Could not get organization')
		)
		.map(org => timezoneForWing[org.Wing])
		.flatMap(timezone =>
			timezone === undefined || timezone === null
				? asyncLeft<string, Timezone>('Could not get timezone')
				: asyncRight(timezone, 'Could not get timezone')
		);
