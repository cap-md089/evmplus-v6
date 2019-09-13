import { AccountObject } from 'common-lib';
import { Response } from 'express';
import { AccountRequest, json } from '../lib/internals';

export default (req: AccountRequest, res: Response) => {
	json<AccountObject>(res, req.account.toRaw());
};
