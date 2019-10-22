import { TeamPublicity } from 'common-lib/index';
import { Response } from 'express';
import {
	asyncErrorHandler,
	ConditionalMemberRequest,
	resolveReference,
	Team
} from '../../../lib/internals';

export default asyncErrorHandler(
	async (req: ConditionalMemberRequest<{ id: string }>, res: Response) => {
		let team: Team;

		try {
			team = await Team.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			return res.end();
		}

		if (team.visibility === TeamPublicity.PRIVATE) {
			if (req.member === null) {
				res.status(403);
				return res.end();
			}
			if (!team.isMemberOrLeader(req.member.getReference())) {
				res.status(403);
				return res.end();
			}
		} else if (team.visibility === TeamPublicity.PROTECTED) {
			if (!req.member) {
				res.status(403);
				return res.end();
			}
		}

		res.header('Content-type: application/json');

		if (team.members.length === 0) {
			res.json([]);
			return res.end();
		}

		let started = false;

		const teamMembers = [
			...team.members.map(m => m.reference),
			team.seniorCoach,
			team.seniorMentor,
			team.cadetLeader
		].filter(m => m.type !== 'Null');

		for (const mem of teamMembers) {
			const fullMember = await resolveReference(mem, req.account, req.mysqlx);

			if (fullMember) {
				res.write((started ? ', ' : '[') + JSON.stringify(fullMember.toRaw()));
				started = true;
			}
		}

		if (!started) {
			res.write('[');
		}

		res.write(']');
		res.end();
	}
);
