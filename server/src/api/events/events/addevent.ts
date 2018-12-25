import * as express from 'express';
import { join } from 'path';
import conf from '../../../conf';
import Event from '../../../lib/Event';
import { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, getSchemaValidator, json } from '../../../lib/Util';

// tslint:disable-next-line:no-var-requires
const eventSchema = require(join(conf.schemaPath, 'NewEventObject.json'));

const privateEventValidator = getSchemaValidator(eventSchema);

const newEventValidator = (val: any): val is NewEventObject =>
	privateEventValidator(val) as boolean;

export default asyncErrorHandler(async (req: MemberRequest, res: express.Response) => {
	// if (newEventValidator(req.body)) {
		const newEvent = await Event.Create(
			req.body,
			req.account,
			req.mysqlx,
			req.member
		);

		json<EventObject>(res, newEvent.toRaw());
	// } else {
	// 	res.status(400);
	// 	if (conf.testing && privateEventValidator.errors) {
	// 		res.json(privateEventValidator.errors);
	// 	}
	// 	res.end();
	// }
});