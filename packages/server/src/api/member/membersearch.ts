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

import {
	api,
	AsyncEither,
	asyncIterFilter,
	asyncIterMap,
	asyncIterTap,
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
	ShortNHQDutyPosition,
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

const memberSearchSQL = (
	schema: Schema,
	orgids: number[],
	dutyName: string,
	includeAssts: boolean,
): string => /* sql */ `SELECT DISTINCT
	M.CAPID
FROM
	${schema.getName()}.NHQ_Member as M
INNER JOIN
	${schema.getName()}.NHQ_Organization as O
ON
	M.ORGID = O.ORGID
LEFT JOIN
	(SELECT doc, CAPID FROM ${schema.getName()}.NHQ_DutyPosition UNION ALL SELECT doc, CAPID FROM ${schema.getName()}.NHQ_CadetDutyPosition) as D 
ON
	M.CAPID = D.CAPID
WHERE
	M.ORGID in ${bindForArray(orgids)}
AND
	TRIM(LOWER(M.doc ->> '$.NameFirst')) LIKE ?
AND
	TRIM(LOWER(M.doc ->> '$.NameLast')) LIKE ?
AND
	TRIM(LOWER(O.doc ->> '$.Name')) LIKE ?
${dutyName.length > 3 ? "AND TRIM(LOWER(D.doc ->> '$.Duty')) LIKE ?" : "?"}
${dutyName.length > 3 ? (includeAssts ? '' : "AND D.doc ->> '$.Asst' = 0") : ``}
;`;

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
							.sql(
								memberSearchSQL(
									schema,
									safeOrgIds,
									req.params.dutyName??'%',
									req.params.includeAssts === 'true',
								),
							)
							.bind([
								...safeOrgIds,
								`%${(req.params.firstName ?? '').toLocaleLowerCase().trim()}%`,
								`%${(req.params.lastName ?? '').toLocaleLowerCase().trim()}%`,
								`%${stripPunctuation(
									req.params.unitName ?? '',
								).toLocaleLowerCase().trim()}%`,
								`${(req.params.dutyName ?? '').toLocaleLowerCase().trim()}`,
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
								.getMember(req.account.type === 'CAPWing' ? { ...req.account, id: req.account.id + '-ignore', orgIDs: safeOrgIds } : req.account)({
									type: 'CAPNHQMember',
									id,
								})
								.flatMap(member =>
									AsyncEither.All([
										getOrganization(member.orgid),
										AsyncEither.All(member.dutyPositions.filter((duty): duty is ShortNHQDutyPosition => duty.type === 'NHQ').map(duty => getOrganization(duty.orgid)))
									])
										.map(([organization, dutyOrgs]) => ({
											member,
											organization,
											dutyOrgs: dutyOrgs.filter(Maybe.isSome).map(get('value'))
										}))
								),
						)(iter);
					})
					.tap(asyncIterTap(console.log))
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
