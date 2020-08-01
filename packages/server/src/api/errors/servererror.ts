/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
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

import { NextFunction, Response } from 'express';
import saveServerError, { Requests } from '../../lib/saveServerError';

export default async (err: Error, req: Requests, res: Response, next: NextFunction) => {
	if (!(err instanceof Error)) {
		await req.mysqlxSession.close();
		return next();
	}

	// CORS issue; the connection may not have been established
	if (err.message.startsWith('Not allowed by CORS')) {
		await req.mysqlxSession?.close();
		return next();
	}

	// There was an error formatting the JSON properly
	if (err.message.startsWith('Unexpected token ')) {
		await req.mysqlxSession.close();
		return next();
	}

	await saveServerError(err, req);

	await req.mysqlxSession.close();

	// End the connection
	// Even though the error is handled, there is still an error and the
	// client shouldn't expect a result
	// However, to indicate that the error is recorded and may be fixed later
	// there is a non-standard header attached
	res.status(500);
	res.set('x-error-handled', 'true');
	res.end();
};
