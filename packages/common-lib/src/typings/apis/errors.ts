/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file represents the error recording API
 *
 * See `common-lib/src/typings/api.ts` for more information
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { APIEither } from '../api';
import { Errors, ErrorType, NewClientErrorObject } from '../types';

/**
 * Stores a client error
 */
export interface ClientError {
	(params: {}, body: NewClientErrorObject): APIEither<void>;

	url: '/api/errors/clienterror';

	method: 'post';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Gets a list of errors currently stored on the server that
 * are unresolved
 *
 * Locked to developers only
 */
export interface GetErrors {
	(params: {}, body: {}): APIEither<Errors[]>;

	url: '/api/errors';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

interface MarkErrorDoneRequestBody {
	message: string;
	type: ErrorType;
	fileName: string;
	line: number;
	column: number;
}

/**
 * Marks an error as handled
 *
 * Locked to developers only
 */
export interface MarkErrorAsDone {
	(params: {}, body: MarkErrorDoneRequestBody): APIEither<void>;

	url: '/api/errors';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
