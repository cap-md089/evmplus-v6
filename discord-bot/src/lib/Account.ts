import * as mysql from '@mysql/xdevapi';
import {
	AccountObject,
	asObj,
	DiscordServerInformation,
	MaybeObj,
	MemberReference,
	NHQ,
	NoSQLDocument,
	ProspectiveMemberObject,
	RawAccountObject,
	RawTeamObject
} from 'common-lib';
import {
	areMemberReferencesTheSame,
	CAPMemberClasses,
	CAPNHQMember,
	CAPProspectiveMember,
	findAndBind,
	generateResults,
	Team
} from './internals';

export default class Account implements AccountObject {
	public static async Get(id: string, schema: mysql.Schema): Promise<Account> {
		const accountCollection = schema.getCollection<RawAccountObject & Required<NoSQLDocument>>(
			'Accounts'
		);

		let result = null;
		for await (const account of generateResults(accountCollection.find('true'))) {
			if (account.id === id || account.aliases.includes(id)) {
				if (result !== null) {
					throw new Error('Unknown account: ' + id);
				}

				result = account;
			}
		}

		if (result === null) {
			throw new Error('Unknown account: ' + id);
		}

		const expired = false;
		const validPaid = !expired && result.paid;

		return new this(
			{
				...result,
				validPaid,
				expired
			},
			schema
		);
	}

	public static async Create(values: RawAccountObject, schema: mysql.Schema) {
		try {
			await Account.Get(values.id, schema);

			throw new Error('Cannot create duplicate account');
		} catch (e) {
			// Do nothing. An error is good
		}

		const accountCollection = schema.getCollection<RawAccountObject>('Accounts');

		const newValues: RawAccountObject = {
			adminIDs: values.adminIDs,
			mainCalendarID: values.mainCalendarID,
			wingCalendarID: values.wingCalendarID,
			serviceAccount: asObj(values.serviceAccount),
			shareLink: values.shareLink,
			comments: values.comments,
			echelon: values.echelon,
			expires: values.expires,
			id: values.id,
			mainOrg: values.mainOrg,
			orgIDs: values.orgIDs,
			paid: values.paid,
			paidEventLimit: values.paidEventLimit,
			unpaidEventLimit: values.unpaidEventLimit,
			aliases: values.aliases,
			discordServer: values.discordServer
		};

		const expired = false;
		const validPaid = !expired && newValues.paid;

		// tslint:disable-next-line:variable-name
		const _id = (await accountCollection.add(newValues).execute()).getGeneratedIds()[0];

		return new this(
			{
				...newValues,
				expired,
				validPaid,
				_id
			},
			schema
		);
	}

	/**
	 * The Account ID
	 */
	public id: string;
	/**
	 * The ids of the organizations
	 */
	public orgIDs: number[];
	/**
	 * Whether the account is a paid account
	 */
	public paid: boolean;
	/**
	 * Whether the accoutn is a valid paid account
	 */
	public validPaid: boolean;
	/**
	 * Whether the account is expired
	 */
	public expired: boolean;
	/**
	 * When the account expires in (seconds)
	 */
	public expires: number;
	/**
	 * How many events can be used if this account is paid for
	 */
	public paidEventLimit: number;
	/**
	 * How many events can be used if this account is unpaid for
	 */
	public unpaidEventLimit: number;
	/**
	 * CAP IDs of the admins of this account
	 */
	public adminIDs: MemberReference[];
	/**
	 * The web link used to share the Google Calendar to Wing or others
	 * (only contains events with the publishToWingCalendar property true)
	 */
	public shareLink: string;
	/**
	 * Miscellaneous comments regarding the account
	 */
	public comments: string;
	/**
	 * Whether or not this account is an echelon account
	 */
	public echelon: boolean;
	/**
	 * The main organization for this account
	 */
	public mainOrg: number;
	/**
	 * The different account IDs that can reference this one
	 */
	public aliases: string[];
	/**
	 * The ID of the main Google calendar
	 */
	public mainCalendarID: string;
	/**
	 * The ID of the wing Google calendar
	 */
	public wingCalendarID: string;
	/**
	 * The email address of the Google service account.  Not directly used by
	 * CAPUnit.com, however it is good to have for configuration.
	 */
	public serviceAccount: MaybeObj<string>;
	/**
	 * Does the account have Discord integration?
	 */
	public discordServer: MaybeObj<DiscordServerInformation>;

	// tslint:disable-next-line:variable-name
	public _id: string;

	private constructor(
		data: AccountObject & Required<NoSQLDocument>,
		private schema: mysql.Schema
	) {
		this._id = data._id;
		this.mainOrg = data.mainOrg;
		this.adminIDs = data.adminIDs;
		this.unpaidEventLimit = data.unpaidEventLimit;
		this.echelon = data.echelon;
		this.shareLink = data.shareLink;
		this.comments = data.comments;
		this.paidEventLimit = data.paidEventLimit;
		this.paid = data.paid;
		this.expired = data.expired;
		this.expires = data.expires;
		this.validPaid = data.validPaid;
		this.orgIDs = data.orgIDs;
		this.id = data.id;
		this.aliases = data.aliases;
		this.mainCalendarID = data.mainCalendarID;
		this.wingCalendarID = data.wingCalendarID;
		this.serviceAccount = data.serviceAccount;
		this.discordServer = data.discordServer;
	}

	public buildURI(...identifiers: string[]) {
		let uri = process.env.NODE_ENV !== 'production' ? `/` : `https://${this.id}.capunit.com/`;

		for (const i in identifiers) {
			if (identifiers.hasOwnProperty(i)) {
				uri += identifiers[i] + `/`;
			}
		}

		return uri.slice(0, -1);
	}

	public async *getMembers(): AsyncIterableIterator<CAPMemberClasses> {
		const memberCollection = this.schema.getCollection<NHQ.CAPMember>('NHQ_Member');

		for (const ORGID of this.orgIDs) {
			const memberFind = findAndBind(memberCollection, {
				ORGID
			});

			for await (const member of generateResults(memberFind)) {
				yield CAPNHQMember.GetFrom(member, this, this.schema);
			}
		}

		const prospectiveMemberCollection = this.schema.getCollection<ProspectiveMemberObject>(
			'ProspectiveMembers'
		);

		const prospectiveMemberFind = findAndBind(prospectiveMemberCollection, {
			accountID: this.id
		});

		for await (const member of generateResults(prospectiveMemberFind)) {
			yield CAPProspectiveMember.Get(member.id, this, this.schema);
		}
	}

	public async *getTeamObjects(): AsyncIterableIterator<RawTeamObject> {
		const teamsCollection = this.schema.getCollection<RawTeamObject>('Teams');

		// This needs to be included to include the staff team, which does not directly
		// exist in the database and is more dynamic
		yield await Team.GetRawStaffTeam(this, this.schema);

		const teamIterator = findAndBind(teamsCollection, {
			accountID: this.id
		});

		for await (const team of generateResults(teamIterator)) {
			yield team;
		}
	}

	public getSquadronName(): string {
		return this.id.replace(/([a-zA-Z]*)([0-9]*)/, '$1-$2').toUpperCase();
	}
	public isAdmin(member: MemberReference) {
		for (const i of this.adminIDs) {
			if (areMemberReferencesTheSame(member, i)) {
				return true;
			}
		}

		return false;
	}
}
