import * as express from 'express';
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/BaseMember';
import { prettySQL } from '../../../lib/MySQLUtil';

export default async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		typeof req.account !== 'undefined'
	) {
		const id = uuid();

		try {
			await req.connectionPool.query(
				prettySQL`
					INSERT INTO
						FileInfo (
							id,
							uploaderID,
							fileName,
							comments,
							contentType,
							created,
							memberOnly,
							forDisplay,
							forSlideshow,
							accountID
						)
					VALUES (
						?,
						?,
						?,
						'',
						'application/folder',
						?,
						0,
						0,
						0,
						?
					)
				`,
				[
					`${req.account.id}-${id}`,
					0,
					req.params.name,
					Math.floor(moment().valueOf() / 1000),
					req.account.id
				],
			);

			res.send(204);
		} catch (e) {
			// tslint:disable-next-line:no-console
			console.log(e);
			res.send(500);
		}
	} else {
		res.status(400);
		res.end();
	}
};
