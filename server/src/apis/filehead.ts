import { IMyConfiguration } from '../conf';
import * as express from 'express';

export default (config: IMyConfiguration) => {
    return (req: express.Request & {busboy?: busboy.Busboy}, res: express.Response, next: Function) => {
        res.json([
			{
				id: 'a',
				name: 'string.TXT'
			}
		]);
    }
}