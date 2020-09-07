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
