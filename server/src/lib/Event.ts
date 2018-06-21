import * as moment from 'moment';
import { Pool } from 'promise-mysql';
import { EventObject, Identifiable } from '../types';
import Account from './Account';
import EventAttendance from './Attendance';
import BaseMember from './BaseMember';
import { prettySQL } from './MySQLUtil';

interface RawEventObject extends Identifiable {
	id: number;
	accountID: string;
}

export default class LocalEvent implements EventObject {
	public static async Get (id: number, pool: Pool, account: Account) {
		const dbDataPromise = pool.query(
			prettySQL`
				SELECT
					*
				FROM
					EventInformation
				WHERE
					id = ?
				AND
					accountID = ?
			`,
			[id, account.id]
		);

		const attendancePromise = EventAttendance.Get(id, account, pool);

		const [
			attendance,
			dbData
		] = await Promise.all([
			attendancePromise,
			dbDataPromise
		]);

		if (dbData.length !== 1) {
			throw new Error('There was a problem getting the event');
		}

		return new LocalEvent(
			LocalEvent.parseEventObject(dbData[0] as RawEventObject),
			attendance,
			pool
		);
	}

	public static async Create (data: EventObject, account: Account, pool: Pool) {
		return new LocalEvent (
			data,
			EventAttendance.CreateEmpty(data.id, account, pool),
			pool
		);
	}

	private static parseEventObject (rawEvent: RawEventObject): EventObject {
		return {
			id: rawEvent.id,
			accountID: rawEvent.accountID
		};
	}

	public id: number = 0;

	public accountID: string = '';

	public readonly attendance: EventAttendance;

	private constructor (data: EventObject, attendance: EventAttendance, private pool: Pool) {
		Object.assign(this, data);
		this.attendance = attendance;
	}

	/**
	 * Saves the event to the database
	 * 
	 * @param account The account to save it to. If not provided,
	 * 		it uses the account ID the object was created with
	 */
	public async save (account?: Account) {
		const updatedTimestamp = moment();
		
		await this.pool.query(
			prettySQL`
				UPDATE
					EventInformation
				SET
					?
				WHERE
					id = ?
				AND
					accountID = ?
			`,
			[this.toRaw(), this.id, this.accountID]
		);
	}

	public async remove () {
		await this.pool.query(
			prettySQL`
				DELETE FROM
					EventInformation
				WHERE
					eventID = ?
				AND
					accountID = ?
			`,
			[this.id, this.accountID]
		);
	}

	public isPOC (member: BaseMember) {
		return (
// 			member.id === this.CAPPOC1ID ||
// 			member.id === this.CAPPOC2ID ||
// 			member.id === this.Author
			member.isRioux
		);
	}

	public toRaw (): RawEventObject {
		return {
			id: this.id,
			accountID: this.accountID
		};
	}
}