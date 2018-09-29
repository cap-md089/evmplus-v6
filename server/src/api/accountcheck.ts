import { Response } from 'express';
import { AccountRequest } from '../lib/Account';
import { json } from '../lib/Util';

export default (req: AccountRequest, res: Response) => {
	json<AccountObject>(res, req.account.toRaw());
};
