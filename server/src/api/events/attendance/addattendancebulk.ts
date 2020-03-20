import { api, just, left, NewAttendanceRecord, none, Permissions, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	Event,
	MemberBase,
	NewAttendanceRecordValidator,
	resolveReference,
	Validator
} from '../../../lib/internals';

/**
 * Needs to be an object with the property as the token
 * needs to be sent as part of the body
 */
interface BulkAttendanceRequest {
	members: NewAttendanceRecord[];
}

export const attendanceBulkValidator = new Validator<BulkAttendanceRequest>({
	members: {
		validator: Validator.ArrayOf(NewAttendanceRecordValidator)
	}
});

export default asyncEitherHandler<api.events.attendance.AddBulk>(
	async (req: BasicMemberValidatedRequest<BulkAttendanceRequest, { id: string }>) => {
		let event: Event;
		let member: MemberBase | null;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find event'
			});
		}

		// DO NOT MOVE THIS INTO THE IF STATEMENT
		// For some reason it does not work, it needs to be
		// stored in a variable first
		const canAddOtherMembers =
			req.member.isPOCOf(event) ||
			req.member.hasPermission('ManageEvent', Permissions.ManageEvent.FULL) ||
			req.member.hasDutyPosition('Personnel Officer');

		if (!canAddOtherMembers) {
			return left({
				code: 403,
				error: none<Error>(),
				message: 'Invalid permissions'
			});
		}

		for (const i of req.body.members) {
			if (i.memberID === undefined) {
				continue;
			}

			member = await resolveReference(i.memberID, req.account, req.mysqlx);

			if (member === null) {
				continue;
			}

			event.addMemberToAttendance(
				{
					arrivalTime: i.arrivalTime,
					comments: i.comments,
					departureTime: i.departureTime,
					planToUseCAPTransportation: i.planToUseCAPTransportation,
					status: i.status,
					customAttendanceFieldValues: i.customAttendanceFieldValues
				},
				member
			);
		}

		try {
			await event.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save attendance information'
			});
		}

		return right(event.attendance);
	}
);
