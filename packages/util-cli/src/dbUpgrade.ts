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
	labels,
	RawEventObject,
	RawLinkedEvent,
	RawRegularEventObject,
	SimpleMultCheckboxReturn,
	stripProp,
} from 'common-lib';
import 'dotenv/config';
import { conf, generateResults } from 'server-common';

process.on('unhandledRejection', up => {
	throw up;
});

const fixRawRegularEventObject = (ev: RawRegularEventObject): RawRegularEventObject => ({
	...(stripProp('uniform')(ev) as RawRegularEventObject),
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
	smuniform: (ev as any).uniform,
	cuniform: {
		labels: labels.CUniforms,
		values: [
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			((ev as any).uniform as SimpleMultCheckboxReturn).values[0],
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			((ev as any).uniform as SimpleMultCheckboxReturn).values[1],
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			((ev as any).uniform as SimpleMultCheckboxReturn).values[2],
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			((ev as any).uniform as SimpleMultCheckboxReturn).values[3],
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			((ev as any).uniform as SimpleMultCheckboxReturn).values[6],
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			((ev as any).uniform as SimpleMultCheckboxReturn).values[7],
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			((ev as any).uniform as SimpleMultCheckboxReturn).values[8],
		],
	},
});

void (async () => {
	const config = await conf.getCLIConfiguration();

	const session = await getSession({
		host: config.DB_HOST,
		password: config.DB_PASSWORD,
		port: config.DB_PORT,
		user: config.DB_USER,
	});

	// @ts-ignore: this function is only sometimes used
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const schema = session.getSchema(config.DB_SCHEMA);

	// @ts-ignore: this function is only sometimes used
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const upgradeTable = async <T>(
		table: Collection<T>,
		map: (prev: { [p in keyof T]: any }) => PromiseLike<T> | T,
	): Promise<number> => {
		const foundIDs = new Map<string, boolean>();

		for await (const obj of generateResults(table.find('true'))) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			if (foundIDs.has(obj._id!)) {
				continue;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			await table.removeOne(obj._id!);

			const result = await table.add(await map(obj)).execute();
			const [newID] = result.getGeneratedIds();
			foundIDs.set(newID, true);
		}

		return foundIDs.size;
	};

	await session.startTransaction();

	try {
		await Promise.all([
			upgradeTable(schema.getCollection<RawEventObject>('Events'), ev =>
				ev.type === ((2 as unknown) as EventType.LINKED) || ev.type === EventType.LINKED
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
