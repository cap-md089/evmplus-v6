#!/usr/bin/env node
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

import { Collection, getSession } from '@mysql/xdevapi';
import {
	EventType,
	ExternalPointOfContact,
	InternalPointOfContact,
	RawEventObject,
	RawLinkedEvent,
	RawRegularEventObject,
} from 'common-lib';
import 'dotenv/config';
import { generateResults, getConf } from 'server-common';

process.on('unhandledRejection', up => {
	throw up;
});

(async () => {
	const conf = await getConf();

	const session = await getSession({
		host: conf.DB_HOST,
		password: conf.DB_PASSWORD,
		port: conf.DB_PORT,
		user: conf.DB_USER,
	});

	const schema = session.getSchema(conf.DB_SCHEMA);

	// @ts-ignore
	const upgradeTable = async <T>(
		table: Collection<T>,
		map: (prev: { [p in keyof T]: any }) => PromiseLike<T> | T,
	) => {
		const foundIDs = new Map<string, boolean>();

		for await (const obj of generateResults(table.find('true'))) {
			if (foundIDs.has(obj._id!)) {
				continue;
			}

			await table.removeOne(obj._id!);

			const result = await table.add(await map(obj)).execute();
			const [newID] = result.getGeneratedIds();
			foundIDs.set(newID, true);
		}

		return foundIDs.size;
	};

	await session.startTransaction();

	const fixRawRegularEventObject = (ev: RawRegularEventObject): RawRegularEventObject => ({
		...ev,
		pointsOfContact: ev.pointsOfContact.map(
			poc =>
				(({
					...poc,
					position: poc.position ?? '',
				} as unknown) as InternalPointOfContact | ExternalPointOfContact),
		),
	});

	try {
		await Promise.all([
			upgradeTable(schema.getCollection<RawEventObject>('Events'), ev =>
				ev.type === EventType.LINKED
					? {
							...(ev as RawLinkedEvent),
							type: EventType.LINKED as const,
					  }
					: fixRawRegularEventObject(ev as RawRegularEventObject),
			),
		]);

		await session.commit();
	} catch (e) {
		console.error(e);
		await session.rollback();
	}

	await session.close();

	process.exit();
})();
