import * as bodyParser from 'body-parser';
import * as express from 'express';
import {
	Account,
	FileObjectValidator,
	leftyConditionalMemberMiddleware,
	leftyMemberMiddleware,
	memberMiddleware,
	replaceUndefinedWithNullMiddleware,
	Validator
} from '../../lib/internals';
import { leftyTokenMiddleware } from '../formtoken';
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

// Only client will need this, but I'm going to make folders a file with a MIME type of application/folder

/// https://developers.google.com/drive/v2/reference/files#methods
// The following two have to be first, as they can't have bodyParser taking the data
// and ending the data stream
filerouter.post('/upload', memberMiddleware, upload); // insert
filerouter.put('/upload/:fileid', memberMiddleware, setfiledata); // update
filerouter.use(bodyParser.json());
// export, functions differently and downloads data for file without download headers
filerouter.get('/:fileid/export', leftyMemberMiddleware, getfile);
filerouter.get('/photolibrary/:page', leftyMemberMiddleware, photolibrary);
// export, functions differently and downloads data for file with download headers
filerouter.get('/:fileid/download', leftyMemberMiddleware, downloadfile);
filerouter.get('/:fileid/:method?', leftyConditionalMemberMiddleware, fileinfo); // get
filerouter.get('/:fileid', leftyConditionalMemberMiddleware, fileinfo); // get
filerouter.delete('/:fileid', leftyMemberMiddleware, leftyTokenMiddleware, deletefile); // delete
filerouter.put(
	'/:fileid',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	replaceUndefinedWithNullMiddleware,
	Validator.LeftyPartialBodyExpressMiddleware(FileObjectValidator),
	setfileinfo
); // update
filerouter.post('/:parentid/createfolder/:name', leftyMemberMiddleware, createfolder);

/// https://developers.google.com/drive/v2/reference/children#methods
filerouter.delete(
	'/:parentid/children/:childid',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	removefile
); // delete
filerouter.post('/:parentid/children', leftyMemberMiddleware, leftyTokenMiddleware, insertchild); // insert
filerouter.get('/:parentid/children/:method?', leftyConditionalMemberMiddleware, getfiles);
filerouter.get('/:parentid/children', leftyConditionalMemberMiddleware, getfiles);

export default filerouter;
