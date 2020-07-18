import { addAPI } from 'auto-client-api';
import { Validator } from 'common-lib';
import * as express from 'express';
import { endpointAdder } from '../../lib/API';
// APIs
import get from './get';
import set from './set';

const router = express.Router();

const adder = endpointAdder(router) as () => () => void;

addAPI(Validator, adder, get);
addAPI(Validator, adder, set);

export default router;
