/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

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
router.post('/api/files/upload/:parentid?', upload);

// api.files.files.GetFileData
router.get('/api/files/:fileid/export', getfile);
// export, functions differently and downloads data for file with download headers
// api.files.files.DownloadFile
router.get('/api/files/:fileid/download', downloadfile);

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
