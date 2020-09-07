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

import { Errors } from '../typings/types';

export const areErrorObjectsTheSame = (err1: Errors) => (err2: Errors): boolean =>
	err1.type === err2.type &&
	err1.message === err2.message &&
	err1.stack[0]?.filename === err2.stack[0]?.filename &&
	err1.stack[0]?.line === err2.stack[0]?.line &&
	err1.stack[0]?.column === err2.stack[0]?.column;
