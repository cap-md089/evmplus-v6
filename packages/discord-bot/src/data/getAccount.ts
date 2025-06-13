/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Schema } from '@mysql/xdevapi';
import { AccountObject, Maybe, MaybeObj } from 'common-lib';
import { collectResults, findAndBind } from 'server-common';

export default (schema: Schema) => async (serverID: string): Promise<MaybeObj<AccountObject>> => {
	const collection = schema.getCollection<AccountObject>('Accounts');

	const results = await collectResults<AccountObject>(
		findAndBind(collection, {
			// @ts-ignore: Error occurs from discordServer being MaybeObj, but the query only recognizes Some
			discordServer: { hasValue: true, value: { serverID } },
		}),
	);

	if (results.length !== 1) {
		return Maybe.none();
	}

	return Maybe.some(results[0]);
};
