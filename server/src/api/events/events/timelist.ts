import { EventObject } from 'common-lib';
import { Response } from 'express';
import {
	asyncErrorHandler,
	ConditionalMemberRequest,
	streamAsyncGeneratorAsJSONArray
} from '../../../lib/internals';

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

		await streamAsyncGeneratorAsJSONArray<EventObject>(
			res,
			req.account.getEventsInRange(start, end)
		);
	}
);
