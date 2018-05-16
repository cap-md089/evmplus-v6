import * as express from 'express';
import * as bodyParser from 'body-parser';

import Account from '../../lib/Account';

let filerouter: express.Router = express.Router();

import getfiles from './getfiles';
import fileinfo from './fileinfo';
import upload from './fileupload';
import getfile from './getfile';
import setfileinfo from './setfileinfo';
import setfiledata from './setfiledata';
import deletefile from './deletefile';
import setfileinfopartial from './setfileinfopartial';

filerouter.use(Account.ExpressMiddleware);

// Only client will need this, but I'm going to make files a folder with a MIME type of application/folder

/// https://developers.google.com/drive/v2/reference/files#methods
// The following two have to be first, as they can't have bodyParser taking the data
filerouter.post('/upload', upload); // insert
filerouter.put('/upload/:fileid', setfiledata); // update
filerouter.use(bodyParser.json());
filerouter.get('/:fileid', fileinfo); // get
filerouter.get('/:fileid/export', getfile); // export, functions differently and downloads data for file
filerouter.delete('/:fileid', deletefile); // delete
filerouter.put('/:fileid', setfileinfo); // update
filerouter.patch('/:fileid', setfileinfopartial); // patch

/// https://developers.google.com/drive/v2/reference/children#methods
filerouter.get('/:folderid/children', getfiles); // list
// filerouter.delete('/:folderid/children/:childid', removefile); // delete
// filerouter.get('/:folderid/children/:childid', getchild); // get
// filerouter.post('/:folderid/children', insertchild); // insert

export default filerouter;