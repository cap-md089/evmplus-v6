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
	asyncLeft,
	asyncRight,
	Either,
	EitherObj,
	errorGenerator,
	get,
	isRegularCAPAccountObject,
	isRequesterRioux,
	Maybe,
	memoize,
	Right,
	ServerError,
	SessionType,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	BasicAccountRequest,
	bindForArray,
	CAP,
	collectResults,
	combineBackends,
	getCombinedMemberBackend,
	getRawMySQLBackend,
	MemberBackend,
	PAM,
	RawMySQLBackend,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../..';
import wrapper from '../../lib/wrapper';

const memberSearchSQL = (schema: Schema, orgids: number[]): string => /* sql */ `SELECT
	CAPID
FROM
	${schema.getName()}.NHQ_Member as M
INNER JOIN
	${schema.getName()}.NHQ_Organization as O
ON
	M.ORGID = O.ORGID
WHERE
	M.ORGID in ${bindForArray(orgids)}
AND
	LOWER(M.doc ->> '$.NameFirst') LIKE ?
AND
	LOWER(M.doc ->> '$.NameLast') LIKE ?
AND
	LOWER(O.doc ->> '$.Name') LIKE ?`;

const stripPunctuation = (s: string): string => s.replace(/[',.]/g, '');

export const func: Endpoint<
	Backends<[RawMySQLBackend, AccountBackend, MemberBackend, CAP.CAPMemberBackend, TeamsBackend]>,
	api.member.MemberSearch
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		asyncRight(req, errorGenerator('Could not validate request'))
			.filter(
				request =>
					(request.member.seniorMember && request.member.dutyPositions.length > 0) ||
					isRequesterRioux(request),
				{
					type: 'OTHER',
					code: 403,
					message: 'You do not have permission to do that',
				},
			)
			.flatMap(request =>
				isRegularCAPAccountObject(request.account)
					? backend.getSubordinateCAPUnitIDs(request.account)
					: asyncLeft<ServerError, number[]>({
							type: 'OTHER',
							code: 400,
							message: 'You cannot do that for this type of account',
					  }),
			)
			.flatMap(safeOrgIds =>
				asyncRight(backend.getSchema(), errorGenerator('Could not get members'))
					.map(schema =>
						schema
							.getSession()
							.sql(memberSearchSQL(schema, safeOrgIds))
							.bind([
								...safeOrgIds,
								`%${(req.params.firstName ?? '').toLocaleLowerCase()}%`,
								`%${(req.params.lastName ?? '').toLocaleLowerCase()}%`,
								`%${stripPunctuation(
									req.params.unitName ?? '',
								).toLocaleLowerCase()}%`,
							])
							.execute(),
					)
					.map(result =>
						result
							.fetchAll()
							.map(([capid]: [string | number]) => parseInt(capid.toString(), 10)),
					)
					.map(iter => {
						const getOrganization = memoize((orgid: number) =>
							asyncRight(
								backend.getCollection('NHQ_Organization'),
								errorGenerator('Could not get member organization'),
							)
								.map(collection =>
									collection.find('ORGID = :ORGID').bind('ORGID', orgid),
								)
								.map(collectResults)
								.map(Maybe.fromArray),
						);

						return asyncIterMap<
							number,
							EitherObj<ServerError, api.member.MemberSearchResult>
						>(id =>
							backend
								.getMember(req.account)({
									type: 'CAPNHQMember',
									id,
								})
								.flatMap(member =>
									getOrganization(member.orgid).map(organization => ({
										member,
										organization,
									})),
								),
						)(iter);
					})
					.map(
						asyncIterFilter<
							EitherObj<ServerError, api.member.MemberSearchResult>,
							Right<api.member.MemberSearchResult>
						>(Either.isRight),
					)
					.map(asyncIterMap(get('value')))
					.map(wrapper),
			),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[
			RawMySQLBackend,
			Backends<[AccountBackend, MemberBackend, CAP.CAPMemberBackend, TeamsBackend]>,
		]
	>(getRawMySQLBackend, getCombinedMemberBackend()),
);
