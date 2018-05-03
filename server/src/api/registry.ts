import * as express from 'express';

export default (req: express.Request, res: express.Response, next: Function) => {
	res.json({
		value: {
			Website: {
				Name: 'CAP St. Mary\'s',
				Separator: ' - '
			},
			Contact: {
				
			}
		}
	});
};