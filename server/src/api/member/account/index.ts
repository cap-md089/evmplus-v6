import { addAPI } from 'auto-client-api';
import { Validator } from 'common-lib';
import { Router } from 'express';
import { endpointAdder } from '../../../lib/API';
import createprospective from './capprospective/createprospective';
import finishaccount from './finishaccount';
import finishpasswordreset from './finishpasswordreset';
import requestnhqaccount from './nhq/requestaccount';
import requestnhqusername from './nhq/requestusername';
import registerdiscord from './registerdiscord';
import requestpasswordreset from './requestpasswordreset';

const router = Router();

const adder = endpointAdder(router) as () => () => void;

addAPI(Validator, adder, requestnhqusername);
addAPI(Validator, adder, requestnhqaccount);

addAPI(Validator, adder, createprospective);

addAPI(Validator, adder, finishaccount);
addAPI(Validator, adder, finishpasswordreset);
addAPI(Validator, adder, requestpasswordreset);
addAPI(Validator, adder, registerdiscord);

export default router;
