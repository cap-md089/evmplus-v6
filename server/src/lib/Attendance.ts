import * as moment from 'moment';
import { Pool } from 'promise-mysql';
import Account from './Account';
import { prettySQL } from './MySQLUtil';

interface RawAttendanceRecord {
	timestamp: number;
	eventID: number;
	accountID: string;
	memberID: number;
	memberRankName: string;
	comments: string;
	status: number;
	requirements: string;
	summaryEmailSent: number;
	planToUseCAPTransportation: number;
}

interface AttendanceRecord {
	timestamp: moment.Moment;
	eventID: number;
	accountID: string;
	memberID: number;
	memberRankName: string;
	comments: string;
	status: AttendanceStatus;
	requirements: string;
	summaryEmailSent: boolean;
	planToUseCAPTransportation: boolean;
}

enum AttendanceStatus {
	COMMITTEDATTENDED,
	NOSHOW,
	RESCINDEDCOMMITMENTTOATTEND
}

export default class EventAttendance {
	public static async Get (eventID: number, account: Account, pool: Pool) {
		const results = await pool.query(
			prettySQL`
				SELECT
					*
				FROM
					Attendance
				WHERE
					EventID = ?
				AND
					AccountID = ?
			`,
			[eventID, account.id]
		) as RawAttendanceRecord[];

		return new EventAttendance (
			results.map(rec => {
				let status;

				switch (rec.status) {
					case 0 :
						status = AttendanceStatus.COMMITTEDATTENDED;
					break;

					case 1 :
						status = AttendanceStatus.NOSHOW;
					break;

					case 2 :
						status = AttendanceStatus.RESCINDEDCOMMITMENTTOATTEND;
					break;
				}

				return {
					timestamp: moment(rec.timestamp),
					accountID: rec.accountID,
					eventID: rec.eventID,
					memberID: rec.memberID,
					memberRankName: rec.memberRankName,
					comments: rec.comments,
					status,
					requirements: rec.requirements,
					summaryEmailSent: rec.summaryEmailSent === 1,
					planToUseCAPTransportation: rec.planToUseCAPTransportation === 1
				};
			}),
			eventID,
			account,
			pool
		);
	}

	public static CreateEmpty (eventID: number, account: Account, pool: Pool) {
		return new EventAttendance ([], eventID, account, pool);
	}

	public attendanceRecords: AttendanceRecord[] = [];

	private constructor (
		records: AttendanceRecord[],
		public eventID: number,
		public account: Account,
		private pool: Pool
	) {
		this.attendanceRecords = records;
	}
}