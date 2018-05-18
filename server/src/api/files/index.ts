import * as express from 'express';
import * as bodyParser from 'body-parser';

import Account from '../../lib/Account';
import Member from '../../lib/Member';

let filerouter: express.Router = express.Router();

// File methods
import fileinfo from './files/fileinfo';
import upload from './files/fileupload';
import getfile from './files/getfile';
import setfileinfo from './files/setfileinfo';
import setfiledata from './files/setfiledata';
import deletefile from './files/deletefile';
import setfileinfopartial from './files/setfileinfopartial';

// Children methods
import getfiles from './children/getfiles';
import removefile from './children/removefile';
import getchild from './children/getchild';
import insertchild from './children/insertchild';

filerouter.use(Account.ExpressMiddleware);
filerouter.use(Member.ExpressMiddleware);

// Only client will need this, but I'm going to make files a folder with a MIME type of application/folder

/// https://developers.google.com/drive/v2/reference/files#methods
// The following two have to be first, as they can't have bodyParser taking the data
// and ending the data stream
filerouter.post('/upload', upload); // insert
filerouter.put('/upload/:fileid', setfiledata); // update
filerouter.use(bodyParser.json());
filerouter.get('/:fileid', fileinfo); // get
filerouter.get('/:fileid/export', getfile); // export, functions differently and downloads data for file
filerouter.delete('/:fileid', deletefile); // delete
filerouter.put('/:fileid', setfileinfo); // update
filerouter.patch('/:fileid', setfileinfopartial); // patch

/// https://developers.google.com/drive/v2/reference/children#methods
filerouter.get('/:parentid/children', getfiles); // list
filerouter.delete('/:parentid/children/:childid', removefile); // delete
filerouter.get('/:parentid/children/:childid', getchild); // get
filerouter.post('/:parentid/children', insertchild); // insert

export default filerouter;