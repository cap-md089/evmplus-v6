import { AbsenteeInformation } from 'common-lib';
import { asyncErrorHandler, MemberValidatedRequest } from '../../lib/internals';

export default asyncErrorHandler(async (req: MemberValidatedRequest<AbsenteeInformation>, res) => {
	req.member.setAbsenteeInformation(req.body);

	await req.member.saveExtraMemberInformation(req.mysqlx, req.account);

	res.status(200);
	res.end();
});
