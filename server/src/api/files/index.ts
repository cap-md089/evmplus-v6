import * as express from 'express';
// import * as busboy from 'connect-busboy';
import { MyConfiguration } from '../../conf';
// import * as bodyParser from 'body-parser';

let filerouter: express.Router = express.Router();

// filerouter.post('/upload', busboy({
// 	limits: {
// 		fileSize: 10 * 1024 * 1024
// 	},
// 	immediate: true
// }));

import getfiles from './getfiles';
import fileinfo from './fileinfo';
import upload from './fileupload';

export default (Configuration: MyConfiguration) => {
	filerouter.post('/upload', upload);

	filerouter.get('/', getfiles);
	filerouter.get('/:fileid', fileinfo);
	
	return filerouter;
};
