import { addAPI } from 'auto-client-api';
import { Validator } from 'common-lib';
import * as express from 'express';
import { endpointAdder } from '../../lib/API';
// APIs
import taskcreate from './taskcreate';
import taskdelete from './taskdelete';
import taskedit from './taskedit';
import taskget from './taskget';
import tasklist from './tasklist';

const router = express.Router();

const adder = endpointAdder(router) as () => () => void;

addAPI(Validator, adder, taskcreate);
addAPI(Validator, adder, taskdelete);
addAPI(Validator, adder, taskedit);
addAPI(Validator, adder, taskget);
addAPI(Validator, adder, tasklist);

export default router;
