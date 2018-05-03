import * as express from 'express';

export default (req: express.Request, res: express.Response, next: Function) => {
	res.json(req.body);
};