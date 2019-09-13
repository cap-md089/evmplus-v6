import * as bodyParser from 'body-parser';
import * as express from 'express';
import {
	Account,
	FileObjectValidator,
	memberMiddleware,
	replaceUndefinedWithNullMiddleware,
	Validator
} from '../../lib/internals';
import { tokenMiddleware } from '../formtoken';
// Children methods
import getfiles from './children/getfiles';
import insertchild from './children/insertchild';
import removefile from './children/removefile';
// File methods
import createfolder from './files/createfolder';
import deletefile from './files/deletefile';
import downloadfile from './files/downloadfile';
import fileinfo from './files/fileinfo';
import upload from './files/fileupload';
import getfile from './files/getfile';
import photolibrary from './files/photolibrary';
import setfiledata from './files/setfiledata';
import setfileinfo from './files/setfileinfo';

const filerouter: express.Router = express.Router();

filerouter.use(Account.ExpressMiddleware);

// Only client will need this, but I'm going to make files a folder with a MIME type of application/folder

/// https://developers.google.com/drive/v2/reference/files#methods
// The following two have to be first, as they can't have bodyParser taking the data
// and ending the data stream
filerouter.post('/upload', memberMiddleware, upload); // insert
filerouter.put('/upload/:fileid', memberMiddleware, setfiledata); // update
filerouter.use(bodyParser.json());
// export, functions differently and downloads data for file without download headers
filerouter.get('/:fileid/export', memberMiddleware, getfile);
filerouter.get('/photolibrary/:page', memberMiddleware, photolibrary);
// export, functions differently and downloads data for file with download headers
filerouter.get('/:fileid/download', memberMiddleware, downloadfile);
filerouter.get('/:fileid/:method?', memberMiddleware, fileinfo); // get
filerouter.get('/:fileid', memberMiddleware, fileinfo); // get
filerouter.delete('/:fileid', memberMiddleware, tokenMiddleware, deletefile); // delete
filerouter.put(
	'/:fileid',
	memberMiddleware,
	tokenMiddleware,
	replaceUndefinedWithNullMiddleware,
	Validator.PartialBodyExpressMiddleware(FileObjectValidator),
	setfileinfo
); // update
filerouter.post('/create', memberMiddleware, createfolder);

/// https://developers.google.com/drive/v2/reference/children#methods
filerouter.delete('/:parentid/children/:childid', memberMiddleware, tokenMiddleware, removefile); // delete
filerouter.post('/:parentid/children', memberMiddleware, tokenMiddleware, insertchild); // insert
filerouter.get('/:parentid/children/:method?', memberMiddleware, getfiles);
filerouter.get('/:parentid/children', memberMiddleware, getfiles);

export default filerouter;
