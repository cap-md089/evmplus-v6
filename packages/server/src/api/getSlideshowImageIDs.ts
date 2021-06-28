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

import {
	api,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	Either,
	EitherObj,
	errorGenerator,
	FileObject,
	FileUserAccessControlPermissions,
	get,
	Maybe,
	RawFileObject,
	Right,
	ServerError,
	userHasFilePermission,
} from 'common-lib';
import {
	Backends,
	FileBackend,
	findAndBindC,
	generateResults,
	getCombinedFileBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '..';
import wrapper from '../lib/wrapper';

export const func: Endpoint<Backends<[FileBackend]>, api.SlideshowImageIDs> = backend => req =>
	asyncRight(
		req.mysqlx.getCollection<RawFileObject>('Files'),
		errorGenerator('Could not get files'),
	)
		.map(
			findAndBindC<RawFileObject>({
				forSlideshow: true,
				accountID: req.account.id,
			}),
		)
		.map(generateResults)
		.map(asyncIterFilter(userHasFilePermission(FileUserAccessControlPermissions.READ)(null)))
		.map(asyncIterMap(backend.expandRawFileObject(Maybe.none())))
		.map(asyncIterFilter<EitherObj<ServerError, FileObject>, Right<FileObject>>(Either.isRight))
		.map(asyncIterMap(get('value')))
		.map(wrapper);

export default withBackends(func, getCombinedFileBackend());
