/**
 * Copyright (C) 2020 Glenn Rioux
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

import { always, asyncRight, BasicMySQLRequest, ChangeLogItem, errorGenerator } from 'common-lib';
import { Backends } from './backends';
import { collectResults, getRawMySQLBackend, RawMySQLBackend } from './MySQLUtil';
import { ServerEither } from './servertypes';

export const getChangeLog = (schema: Backends<[RawMySQLBackend]>) => (): ServerEither<
	ChangeLogItem[]
> =>
	asyncRight(
		schema.getCollection('ChangeLog').find('true'),
		errorGenerator('Could not get change log'),
	).map(collectResults);

export const addChangeLog = (schema: Backends<[RawMySQLBackend]>) => (values: {
	entryDateTime: number;
	entryCAPID: number;
	noteDateTime: number;
	noteText: string;
}): ServerEither<ChangeLogItem> =>
	asyncRight(schema.getCollection('ChangeLog'), errorGenerator('Could not add to change log'))
		.map(collection => collection.add(values).execute())
		.map(always(values));

export interface ChangeLogBackend {
	getChangeLog: () => ServerEither<ChangeLogItem[]>;
	addChangeLog: (item: ChangeLogItem) => ServerEither<ChangeLogItem>;
}

export const getChangeLogBackend = (req: BasicMySQLRequest): ChangeLogBackend => ({
	getChangeLog: getChangeLog(getRawMySQLBackend(req)),
	addChangeLog: addChangeLog(getRawMySQLBackend(req)),
});
