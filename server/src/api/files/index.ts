import { addAPI } from 'auto-client-api';
import { Validator } from 'common-lib';
import * as express from 'express';
import { endpointAdder } from '../../lib/API';
// Children methods
import getfiles from './children/getfiles';
import getfullfiles from './children/getfullfiles';
import insertchild from './children/insertchild';
import removefile from './children/removefile';
// File methods
import createfolder from './files/createfolder';
import deletefile from './files/deletefile';
import downloadfile from './files/downloadfile';
import fileinfo from './files/fileinfo';
import upload from './files/fileupload';
import fullfileinfo from './files/fullfileinfo';
import getfile from './files/getfile';
import setfileinfo from './files/setfileinfo';

const router = express.Router();

// Only client will need this, but I'm going to make folders a file with a MIME type of application/folder

// The following two have to be first, as they can't have bodyParser taking the data
// and ending the data stream
router.post('/upload/:parentid?', upload);

// api.files.files.GetFileData
router.get('/:fileid/export', getfile);
// export, functions differently and downloads data for file with download headers
// api.files.files.DownloadFile
router.get('/:fileid/download', downloadfile);

const adder = endpointAdder(router) as () => () => void;

addAPI(Validator, adder, createfolder);
addAPI(Validator, adder, deletefile);
addAPI(Validator, adder, fileinfo);
addAPI(Validator, adder, fullfileinfo);
addAPI(Validator, adder, setfileinfo);

addAPI(Validator, adder, insertchild);
addAPI(Validator, adder, getfiles);
addAPI(Validator, adder, getfullfiles);
addAPI(Validator, adder, removefile);

export default router;
