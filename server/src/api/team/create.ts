import { Response } from 'express';
import { MemberRequest } from '../../lib/MemberBase';
import Team from '../../lib/Team';
import { getFullSchemaValidator, json } from '../../lib/Util';

const validator = getFullSchemaValidator<NewTeamObject>('NewTeamObject.json');

export default async (req: MemberRequest, res: Response) => {
	if (!validator(req.body)) {
		res.status(400);
		res.end();
		return;
	}

	const newTeam = await Team.Create(req.body, req.account, req.mysqlx);

	json<TeamObject>(res, newTeam.toRaw(req.member));
}