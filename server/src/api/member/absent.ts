import { AbsenteeInformation } from 'common-lib';
import { asyncErrorHandler } from '../../lib/Util';
import { MemberValidatedRequest } from '../../lib/validator/Validator';

export default asyncErrorHandler(async (req: MemberValidatedRequest<AbsenteeInformation>, res) => {
	req.member.setAbsenteeInformation(req.body);

	await req.member.saveExtraMemberInformation(req.mysqlx, req.account);

	res.status(200);
	res.end();
});
