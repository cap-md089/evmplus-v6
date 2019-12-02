import {
	api,
	just,
	left,
	MemberReference,
	none,
	right,
	ShortCAPUnitDutyPosition
} from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	resolveReference,
	Validator
} from '../../../lib/internals';

interface SetTemporaryDutyPositions {
	dutyPositions: Array<Omit<ShortCAPUnitDutyPosition, 'date'>>;
}

const shortCAPWatchDutyPositionValidator = new Validator<Omit<ShortCAPUnitDutyPosition, 'date'>>({
	duty: {
		validator: Validator.String
	},
	type: {
		validator: Validator.StrictValue('CAPUnit' as 'CAPUnit')
	},
	expires: {
		validator: Validator.Number
	}
});

export const setDutyPositionsValidator = new Validator<SetTemporaryDutyPositions>({
	dutyPositions: {
		validator: Validator.ArrayOf(shortCAPWatchDutyPositionValidator)
	}
});

const areDutiesTheSame = (d1: ShortCAPUnitDutyPosition, d2: ShortCAPUnitDutyPosition) =>
	d1.date === d2.date && d1.duty === d2.duty && d1.expires === d2.expires;

export default asyncEitherHandler<api.member.temporarydutypositions.Set>(
	async (
		req: BasicMemberValidatedRequest<SetTemporaryDutyPositions, { id: string; type: string }>
	) => {
		let ref: MemberReference;
		if (req.params.type === 'CAPNHQMember') {
			if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
				return left({
					code: 400,
					error: none<Error>(),
					message: 'Invalid CAP ID'
				});
			}

			ref = {
				type: 'CAPNHQMember',
				id: parseInt(req.params.id, 10)
			};
		} else if (req.params.type === 'CAPProspectiveMember') {
			ref = {
				type: 'CAPProspectiveMember',
				id: req.params.id
			};
		} else {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Invalid member type'
			});
		}

		let member;
		try {
			member = await resolveReference(ref, req.account, req.mysqlx, true);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find member specified'
			});
		}

		const now = Date.now();

		const oldDutyPositions = member.dutyPositions.filter(
			v => v.type === 'CAPUnit'
		) as ShortCAPUnitDutyPosition[];
		const newDutyPositions: ShortCAPUnitDutyPosition[] = [];

		for (const duty of req.body.dutyPositions) {
			let found = false;

			for (const newDutyPosition of newDutyPositions) {
				if (newDutyPosition.duty === duty.duty) {
					newDutyPosition.expires = Math.max(newDutyPosition.expires, duty.expires);
					found = true;
					break;
				}
			}

			if (!found) {
				newDutyPositions.push({
					...duty,
					date: Date.now()
				});
			}
		}

		const oldDutyPositionsDiff: ShortCAPUnitDutyPosition[] = oldDutyPositions.slice();
		const newDutyPositionsDiff: ShortCAPUnitDutyPosition[] = newDutyPositions.slice();

		for (let i = oldDutyPositions.length - 1; i >= 0; i--) {
			for (let j = newDutyPositions.length - 1; j >= 0; j--) {
				if (areDutiesTheSame(oldDutyPositions[i], newDutyPositions[j])) {
					oldDutyPositionsDiff.splice(i, 1);
				}
			}
		}

		for (let i = newDutyPositions.length - 1; i >= 0; i--) {
			for (let j = oldDutyPositions.length - 1; j >= 0; j--) {
				if (areDutiesTheSame(oldDutyPositions[i], newDutyPositions[j])) {
					newDutyPositionsDiff.splice(i, 1);
				}
			}
		}

		for (const duty of newDutyPositions) {
			member.addTemporaryDutyPosition({
				Duty: duty.duty,
				assigned: now,
				validUntil: duty.expires
			});
		}

		for (const oldDuty of oldDutyPositions) {
			member.removeDutyPosition(oldDuty.duty);
		}

		try {
			await member.saveExtraMemberInformation(req.mysqlx, req.account);
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save member information'
			});
		}

		return right(void 0);
	}
);
