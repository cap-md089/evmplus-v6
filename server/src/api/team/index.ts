import { addAPI } from 'auto-client-api';
import { Validator } from 'common-lib';
import * as express from 'express';
import { endpointAdder } from '../../lib/API';
// API routes
import create from './create';
import deleteTeam from './delete';
import get from './get';
import list from './list';
import add from './members/add';
import listmembers from './members/list';
import modify from './members/modify';
import remove from './members/remove';
import set from './set';

const router = express.Router();

const adder = endpointAdder(router) as () => () => void;

addAPI(Validator, adder, create);
addAPI(Validator, adder, deleteTeam);
addAPI(Validator, adder, get);
addAPI(Validator, adder, list);
addAPI(Validator, adder, set);
addAPI(Validator, adder, add);
addAPI(Validator, adder, listmembers);
addAPI(Validator, adder, modify);
addAPI(Validator, adder, remove);

export default router;
