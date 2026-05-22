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
	api,
	asyncLeft,
	asyncRight,
	errorGenerator,
	hasOneDutyPosition,
	hasPermission,
	Permissions,
	SessionType,
} from 'common-lib';
import {
	Backends,
	bindForArray,
	getRawMySQLBackend,
	PAM,
	RawMySQLBackend,
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
	E.DOB,
	DATE_FORMAT(C.CPPTCompletionDate, '%Y-%m-%d') AS CPPTCompletionDate
FROM (
	SELECT
		M.CAPID,
		M.doc ->> '$.Type' AS MemberType,
		M.doc ->> '$.Rank' AS MemberRank,
		M.doc ->> '$.NameFirst' AS NameFirst,
		M.doc ->> '$.NameLast' AS NameLast,
		SUBSTR(M.doc ->> '$.DOB', 1, 10) AS DOB
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

export const func: Endpoint<Backends<[RawMySQLBackend]>, api.member.cpptstatus.Get> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req => {
		if (req.account.type !== 'CAPSquadron') {
			return asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'This operation is only supported for squadrons',
			});
		}

		if (
			!hasPermission('PromotionManagement')(Permissions.PromotionManagement.FULL)(req.member) &&
			!hasAllowedDutyPosition(req.member)
		) {
			return asyncLeft({
				type: 'OTHER',
				code: 403,
				message: 'Member does not have permissions to perform the requested action',
			});
		}

		const orgIds =
			req.account.orgIDs.length > 0
				? req.account.orgIDs
				: req.account.mainOrg > 0
				? [req.account.mainOrg]
				: [];

		if (orgIds.length === 0) {
			return asyncRight(wrapper([]), errorGenerator('Could not build CPPT status report'));
		}

		return asyncRight(
			backend
				.getSchema()
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
						dob,
						cpptCompletionDate,
					]) => ({
						capid: parseInt(capid.toString(), 10),
						memberType: memberType.toString(),
						memberRank: memberRank.toString(),
						nameFirst: nameFirst.toString(),
						nameLast: nameLast.toString(),
						dob: dob?.toString() ?? '',
						cpptCompletionDate: cpptCompletionDate?.toString() ?? '',
					}),
				),
			)
			.map(wrapper);
	});

export default withBackends(func, getRawMySQLBackend);