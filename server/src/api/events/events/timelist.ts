import { Response } from 'express';
import Event from '../../../lib/Event';
import { ConditionalMemberRequest } from '../../../lib/Members';
import { asyncErrorHandler, streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default asyncErrorHandler(
	async (req: ConditionalMemberRequest<{ start: string; end: string }>, res: Response) => {
		// In JavaScript, true === (NaN !== NaN) for some reason

		if (
			parseInt(req.params.start, 10) !== parseInt(req.params.start, 10) ||
			parseInt(req.params.end, 10) !== parseInt(req.params.end, 10)
		) {
			res.status(400);
			res.end();
			return;
		}

		const start = parseInt(req.params.start, 10);
		const end = parseInt(req.params.end, 10);

		await streamAsyncGeneratorAsJSONArray<Event>(res, req.account.getSortedEvents(), event => {
			return (event.pickupDateTime > start && event.pickupDateTime < end) ||
				(event.meetDateTime < end && event.meetDateTime > start)
				? JSON.stringify(event.toRaw(req.member))
				: false;
		});
	}
);
