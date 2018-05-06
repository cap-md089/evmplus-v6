import * as express from 'express';
import * as bodyParser from 'body-parser';
import { MyConfiguration } from '../../conf';

let filerouter: express.Router = express.Router();

import getfiles from './getfiles';
import fileinfo from './fileinfo';
import upload from './fileupload';

export default (Configuration: MyConfiguration) => {
	filerouter.post('/upload', upload);

	filerouter.use(bodyParser.json());

	filerouter.get('/', getfiles);
	filerouter.get('/:fileid', fileinfo);
	
	return filerouter;
};
