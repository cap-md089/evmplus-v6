import { AttendanceRecord, NewAttendanceRecord } from 'common-lib';
import { ManageEvent } from 'common-lib/permissions';
import { Response } from 'express';
import {
	asyncErrorHandler,
	Event,
	json,
	MemberBase,
	MemberValidatedRequest,
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

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<BulkAttendanceRequest, { id: string }>, res: Response) => {
		let event: Event;
		let member: MemberBase | null;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		// DO NOT MOVE THIS INTO THE IF STATEMENT
		// For some reason it does not work, it needs to be
		// stored in a variable first
		const canAddOtherMembers =
			req.member.isPOCOf(event) || req.member.hasPermission('ManageEvent', ManageEvent.FULL);

		if (!canAddOtherMembers) {
			res.status(403);
			res.end();
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
					canUsePhotos: i.canUsePhotos
				},
				member
			);
		}

		await event.save();

		json<AttendanceRecord[]>(res, event.attendance);
	}
);
