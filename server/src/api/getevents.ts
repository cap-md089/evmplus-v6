import * as express from 'express';

export default (req: express.Request, res: express.Response, next: Function) => {
	res.json({
		'name': 'Test1',
		'people': 2
	});
};