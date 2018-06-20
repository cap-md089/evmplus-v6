import * as express from 'express';

export default (req: express.Request, res: express.Response) => {
	res.json({
		value: {
			Contact: {
				
			},
			Website: {
				Name: 'CAP St. Mary\'s',
				Separator: ' - '
			}
		}
	});
};