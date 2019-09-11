import { MemberReference, ShortCAPUnitDutyPosition } from 'common-lib';
import { resolveReference } from '../../../lib/Members';
import { asyncErrorHandler } from '../../../lib/Util';
import Validator, { MemberValidatedRequest } from '../../../lib/validator/Validator';

interface SetTemporaryDutyPositions {
	dutyPositions: Array<Omit<ShortCAPUnitDutyPosition, 'date'>>;
}

const shortCAPWatchDutyPositionValidator = new Validator<
	Omit<ShortCAPUnitDutyPosition, 'date'>
>({
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

export default asyncErrorHandler(
	async (
		req: MemberValidatedRequest<SetTemporaryDutyPositions, { id: string; type: string }>,
		res
	) => {
		let ref: MemberReference;
		if (req.params.type === 'CAPNHQMember') {
			if (parseInt(req.params.id, 10) !== parseInt(req.params.id, 10)) {
				res.status(400);
				return res.end();
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
			res.status(400);
			return res.end();
		}

		const member = await resolveReference(ref, req.account, req.mysqlx, false);

		if (!member) {
			res.status(404);
			return res.end();
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
					newDutyPosition.expires = Math.max(
						newDutyPosition.expires,
						duty.expires
					);
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

		await member.saveExtraMemberInformation(req.mysqlx, req.account);

		res.status(204);
		res.end();
	}
);
