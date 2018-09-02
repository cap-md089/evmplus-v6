import * as express from 'express';
import { join } from 'path';
import conf from '../../conf';
import { AccountRequest } from '../../lib/Account';
import Event from '../../lib/Event';
import { MemberRequest } from '../../lib/MemberBase';
import { getSchemaValidator, json } from '../../lib/Util';

// tslint:disable-next-line:no-var-requires
const eventSchema = require(join(conf.schemaPath, 'NewEventObject.json'));

const privateEventValidator = getSchemaValidator(eventSchema);

const newEventValidator = (val: any): val is NewEventObject =>
	privateEventValidator(val) as boolean;

export default async (
	req: MemberRequest & AccountRequest,
	res: express.Response
) => {
	if (
		req.member !== null &&
		req.account !== null &&
		newEventValidator(req.body)
	) {
		const newEvent = await Event.Create(req.body, req.account, req.mysqlx);

		json<EventObject>(res, newEvent.toRaw());
	} else {
		res.status(400);
		if (privateEventValidator.errors) {
			res.json(privateEventValidator.errors);
		}
		res.end();
	}
};
