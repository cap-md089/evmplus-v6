import * as express from 'express';

export default (req: express.Request & {busboy?: busboy.Busboy}, res: express.Response, next: Function) => {
	res.json({
		id: req.params.fileid,
		name: 'string.TXT'
	});
};