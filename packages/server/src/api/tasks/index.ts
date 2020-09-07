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
