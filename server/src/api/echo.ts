import * as express from 'express';

export default (req: express.Request, res: express.Response) => {
	res.json(req.body);
};
