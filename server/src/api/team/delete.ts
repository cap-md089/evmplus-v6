import { Response } from 'express';
import { MemberRequest } from '../../lib/MemberBase';
import Team from '../../lib/Team';

export default async (req: MemberRequest, res: Response) => {
	let team: Team;

	try {
		team = await Team.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	try {
		await team.delete();
	} catch (e) {
		res.status(500);
		res.end();
		return;
	}

	res.status(204);
	res.end();
}