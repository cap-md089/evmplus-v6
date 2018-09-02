import { Response } from 'express';
import { AccountRequest } from '../lib/Account';

export default (req: AccountRequest, res: Response) => {
	res.json(req.account);
};
