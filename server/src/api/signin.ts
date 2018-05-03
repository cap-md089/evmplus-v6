import * as express from 'express';
import Member from '../lib/Member';

export default (req: express.Request, res: express.Response, next: Function) => {
	let { capid, password } = req.body;

	Member.Create(capid, password).then(member => {
		res.json({
			sessionID: member.setSession()
		});
	});
};