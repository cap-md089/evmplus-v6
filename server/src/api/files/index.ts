import * as bodyParser from 'body-parser';
import * as express from 'express';
import Account from '../../lib/Account';
import File from '../../lib/File';
import Member from '../../lib/members/NHQMember';
import { replaceUndefinedWithNull } from '../../lib/Util';
import Validator from '../../lib/validator/Validator';
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
import setfiledata from './files/setfiledata';
import setfileinfo from './files/setfileinfo';

const filerouter: express.Router = express.Router();

filerouter.use(Account.ExpressMiddleware);

// Only client will need this, but I'm going to make files a folder with a MIME type of application/folder

/// https://developers.google.com/drive/v2/reference/files#methods
// The following two have to be first, as they can't have bodyParser taking the data
// and ending the data stream
filerouter.post('/upload', Member.ExpressMiddleware, upload); // insert
filerouter.put('/upload/:fileid', Member.ExpressMiddleware, setfiledata); // update
filerouter.use(bodyParser.json());
// export, functions differently and downloads data for file without download headers
filerouter.get('/:fileid/export', Member.ConditionalExpressMiddleware, getfile);
// export, functions differently and downloads data for file with download headers
filerouter.get(
	'/:fileid/download',
	Member.ConditionalExpressMiddleware,
	downloadfile
);
filerouter.get(
	'/:fileid/:method?',
	Member.ConditionalExpressMiddleware,
	fileinfo
); // get
filerouter.get('/:fileid', Member.ConditionalExpressMiddleware, fileinfo); // get
filerouter.delete(
	'/:fileid',
	Member.ExpressMiddleware,
	tokenMiddleware,
	deletefile
); // delete
filerouter.put(
	'/:fileid',
	Member.ExpressMiddleware,
	tokenMiddleware,
	replaceUndefinedWithNull,
	Validator.PartialBodyExpressMiddleware(File.Validator),
	setfileinfo
); // update
filerouter.post('/create', Member.ExpressMiddleware, createfolder);

/// https://developers.google.com/drive/v2/reference/children#methods
filerouter.delete(
	'/:parentid/children/:childid',
	Member.ExpressMiddleware,
	tokenMiddleware,
	removefile
); // delete
filerouter.post(
	'/:parentid/children',
	Member.ExpressMiddleware,
	tokenMiddleware,
	insertchild
); // insert
filerouter.get(
	'/:parentid/children/:method?',
	Member.ConditionalExpressMiddleware,
	getfiles
);
filerouter.get(
	'/:parentid/children',
	Member.ConditionalExpressMiddleware,
	getfiles
);

export default filerouter;
