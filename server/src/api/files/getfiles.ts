import { Configuration as config } from '../../conf';
import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';

export default (req: express.Request & {busboy?: busboy.Busboy}, res: express.Response, next: Function) => {
	fs.readdir(join(config.path, 'uploads'), (err, data) => {
		res.json(data);
	});
};