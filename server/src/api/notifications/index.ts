import { addAPI } from 'auto-client-api';
import { Validator } from 'common-lib';
import { Router } from 'express';
import { endpointAdder } from '../../lib/API';
import deletenotification from './deletenotification';
import get from './get';
import globalcreate from './global/create';
import globalget from './global/get';
import list from './list';
import toggleread from './toggleread';

const router = Router();

const adder = endpointAdder(router) as () => () => void;

addAPI(Validator, adder, globalget);
addAPI(Validator, adder, globalcreate);
addAPI(Validator, adder, deletenotification);
addAPI(Validator, adder, get);
addAPI(Validator, adder, list);
addAPI(Validator, adder, toggleread);

export default router;
