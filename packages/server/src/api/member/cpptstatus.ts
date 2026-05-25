/**
 * Copyright (C) 2026 Andrew Rioux
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
	RawCAPGroupAccountObject,
	RawCAPWingAccountObject,
	api,
	asyncLeft,
	asyncRight,
	errorGenerator,
	hasOneDutyPosition,
	hasPermission,
	isRegularCAPAccountObject,
	Permissions,
	SessionType,
} from 'common-lib';
import {
	CAP,
	AccountBackend,
	BasicAccountRequest,
	Backends,
	bindForArray,
	combineBackends,
	getCombinedMemberBackend,
	MemberBackend,
	getRawMySQLBackend,
	PAM,
	RawMySQLBackend,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../..';
import wrapper from '../../lib/wrapper';

const hasAllowedDutyPosition = hasOneDutyPosition([
	'Cadet Flight Commander',
	'Cadet Flight Sergeant',
	'Cadet Commander',
	'Cadet Deputy Commander for Operations',
	'Cadet Deputy Commander for Support',
	'Deputy Commander For Cadets',
]);

const getCPPTStatusSql = (orgids: number[], schemaName: string): string => `
SELECT
	E.CAPID,
	E.MemberType,
	E.MemberRank,
	E.NameFirst,
	E.NameLast,
	DATE_FORMAT(C.CPPTCompletionDate, '%Y-%m-%d') AS CPPTCompletionDate
FROM (
	SELECT
		M.CAPID,
		M.doc ->> '$.Type' AS MemberType,
		M.doc ->> '$.Rank' AS MemberRank,
		M.doc ->> '$.NameFirst' AS NameFirst,
		M.doc ->> '$.NameLast' AS NameLast
	FROM ${schemaName}.NHQ_Member M
	WHERE M.ORGID IN ${bindForArray(orgids)}
	AND (
		M.doc ->> '$.Type' = 'SENIOR'
		OR (
			M.doc ->> '$.Type' = 'CADET'
			AND TIMESTAMPDIFF(
				YEAR,
				STR_TO_DATE(SUBSTR(M.doc ->> '$.DOB', 1, 10), '%Y-%m-%d'),
				CURDATE()
			) >= 18
		)
	)
) E
LEFT JOIN (
	SELECT
		CAST(T.doc ->> '$.CAPID' AS UNSIGNED) AS CAPID,
		MAX(STR_TO_DATE(SUBSTR(T.doc ->> '$.Completed', 1, 10), '%Y-%m-%d')) AS CPPTCompletionDate
	FROM ${schemaName}.NHQ_Training T
	WHERE LOWER(TRIM(T.doc ->> '$.TypeCrs')) LIKE '%cadet protection%'
		OR UPPER(TRIM(T.doc ->> '$.TypeCrs')) = 'CPPT'
	GROUP BY CAST(T.doc ->> '$.CAPID' AS UNSIGNED)
) C ON C.CAPID = E.CAPID
ORDER BY E.NameLast, E.NameFirst`;

const getMemberDutyInOrgSql = (schemaName: string): string => `
SELECT 1
FROM ${schemaName}.NHQ_DutyPosition D
WHERE D.CAPID = ?
AND D.ORGID = ?
UNION
SELECT 1
FROM ${schemaName}.NHQ_CadetDutyPosition D
WHERE D.CAPID = ?
AND D.ORGID = ?
LIMIT 1`;

const getUpperLevelOrgId = (
	account: RawCAPGroupAccountObject | RawCAPWingAccountObject,
): number => account.orgid;

export const func: Endpoint<
	Backends<[RawMySQLBackend, AccountBackend, MemberBackend, CAP.CAPMemberBackend, TeamsBackend]>,
	api.member.cpptstatus.Get
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req => {
		const isSquadronContext = req.account.type === 'CAPSquadron';

		if (
			!isSquadronContext &&
			req.account.type !== 'CAPGroup' &&
			req.account.type !== 'CAPWing'
		) {
			return asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'This operation is only supported for squadron, group, and wing accounts',
			});
		}

		if (
			isSquadronContext &&
			!hasPermission('PromotionManagement')(Permissions.PromotionManagement.FULL)(req.member) &&
			!hasAllowedDutyPosition(req.member)
		) {
			return asyncLeft({
				type: 'OTHER',
				code: 403,
				message: 'Member does not have permissions to perform the requested action',
			});
		}

		if (!isRegularCAPAccountObject(req.account)) {
			return asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'You cannot do that for this type of account',
			});
		}

		return backend.getSubordinateCAPUnitIDs(req.account).flatMap(orgIds => {
			if (orgIds.length === 0) {
				return asyncRight(wrapper([]), errorGenerator('Could not build CPPT status report'));
			}

			const getCPPTStatusReport = () =>
				asyncRight(
					backend
						.getSession()
						.sql(getCPPTStatusSql(orgIds, backend.getSchema().getName()))
						.bind(orgIds)
						.execute(),
					errorGenerator('Could not query CPPT status data'),
				)
					.map(result => result.fetchAll())
					.map(rows =>
						rows.map(
							([
								capid,
								memberType,
								memberRank,
								nameFirst,
								nameLast,
								cpptCompletionDate,
							]) => ({
								capid: parseInt(capid.toString(), 10),
								memberType: memberType.toString(),
								memberRank: memberRank.toString(),
								nameFirst: nameFirst.toString(),
								nameLast: nameLast.toString(),
								cpptCompletionDate: cpptCompletionDate?.toString() ?? '',
							}),
						),
					)
					.map(wrapper);

			if (req.account.type === 'CAPGroup' || req.account.type === 'CAPWing') {
				const upperLevelOrgId = getUpperLevelOrgId(req.account);

				const memberAssignedInScope = req.member.orgid === upperLevelOrgId;

				if (memberAssignedInScope) {
					return getCPPTStatusReport();
				}

				return asyncRight(
					backend
						.getSession()
						.sql(getMemberDutyInOrgSql(backend.getSchema().getName()))
						.bind([req.member.id, upperLevelOrgId, req.member.id, upperLevelOrgId])
						.execute(),
					errorGenerator('Could not verify member duty scope'),
				)
					.map(result => result.fetchAll().length > 0)
					.filter(hasDutyInScope => hasDutyInScope, {
						type: 'OTHER',
						code: 403,
						message:
							'Member must be assigned to this group/wing or hold a duty position in this group/wing to access this report',
					})
					.flatMap(() => getCPPTStatusReport());
			}

			return getCPPTStatusReport();
		});
	});

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
