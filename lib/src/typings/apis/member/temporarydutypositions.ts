import { APIEither } from '../../../typings/api';
import { NewShortCAPUnitDutyPosition, ShortCAPUnitDutyPosition } from '../../../typings/types';

export interface GetTemporaryDutyPositions {
	(params: { id: string }, body: {}): APIEither<ShortCAPUnitDutyPosition[]>;

	url: '/api/member/tempdutypositions/:id';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

export interface SetTemporaryDutyPositions {
	(params: { id: string }, body: { dutyPositions: NewShortCAPUnitDutyPosition[] }): APIEither<
		void
	>;

	url: '/api/member/tempdutypositions/:id';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
