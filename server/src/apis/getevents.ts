import { Configuration, IMyConfiguration } from '../conf';
import { extend } from '../lib/Util';
import * as express from 'express';

export default (config: IMyConfiguration) => {
	let conf: IMyConfiguration = extend<IMyConfiguration>(Configuration, config);
	return (req: express.Request, res: express.Response, next: Function) => {
		res.json({
			'name': 'Test1',
			'people': 2
		});
	};
};