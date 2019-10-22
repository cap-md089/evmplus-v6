import { MemberReference } from 'common-lib';
import {
	asyncErrorHandler,
	Event,
	MemberValidatedRequest,
	streamAsyncGeneratorAsJSONArrayTyped
} from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberValidatedRequest<MemberReference>, res) => {
	const eventGenerator = req.account.getEvents();
	const member = req.body;

	await streamAsyncGeneratorAsJSONArrayTyped<
		Event,
		{
			name: string;
			id: number;
			endDateTime: number;
			location: string;
			startDateTime: number;
			planToUseCAPTransportation: boolean;
			comments: string;
		}
	>(res, eventGenerator, event => {
		const record = event.getAttendanceRecordForMember(member);
		if (record !== undefined) {
			const { name, id, endDateTime, location, startDateTime } = event;
			const { planToUseCAPTransportation, comments } = record;

			return {
				planToUseCAPTransportation,
				name,
				endDateTime,
				location,
				startDateTime,
				comments,
				id
			};
		}

		return false;
	});
});
