import { addAPI } from 'auto-client-api';
import { Validator } from 'common-lib';
import * as express from 'express';
import { endpointAdder } from '../../lib/API';
import clienterror from './clienterror';
import geterrors from './geterrors';
import markerrordone from './markerrordone';

const router = express.Router();

const adder = endpointAdder(router) as () => () => void;

addAPI(Validator, adder, clienterror);
addAPI(Validator, adder, geterrors);
addAPI(Validator, adder, markerrordone);

export default router;
