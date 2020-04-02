import { Schema } from '@mysql/xdevapi';
import {
	AbsenteeInformation,
	ExtraMemberInformation,
	MemberPermissions,
	NoSQLDocument,
	ProspectiveMemberObject,
	ProspectiveMemberReference,
	RawProspectiveMemberObject,
	ShortDutyPosition,
	TemporaryDutyPosition
} from 'common-lib';
import {
	Account,
	CAPNHQMember,
	collectResults,
	findAndBind,
	generateResults,
	MemberBase
} from '../../internals';

export const Member: Readonly<MemberPermissions> = {
	AdministerPT: 0,
	AssignTasks: 0,
	FileManagement: 0,
	FlightAssign: 0,
	MusterSheet: 0,
	PTSheet: 0,
	PromotionManagement: 0,

	AssignTemporaryDutyPositions: 0,
	EventContactSheet: 0,
	EventLinkList: 0,
	ORMOPORD: 0,
	ProspectiveMemberManagement: 0,
	CreateNotifications: 0,
	ManageEvent: 0,
	ManageTeam: 0,
	ScanAdd: 0,
	AttendanceView: 0,

	DownloadCAPWATCH: 0,
	PermissionManagement: 0,
	RegistryEdit: 0
};

export default class CAPProspectiveMember extends MemberBase
	implements ProspectiveMemberObject, Required<NoSQLDocument> {
	public static async Create(
		newMember: RawProspectiveMemberObject,
		account: Account,
		schema: Schema
	): Promise<CAPProspectiveMember> {
		const prospectiveCollection = schema.getCollection<RawProspectiveMemberObject>(
			CAPProspectiveMember.tableName
		);

		let id: string = `${account.id}-`;
		let highestNumber: number = 0;

		const iterator = generateResults(
			findAndBind(prospectiveCollection, {
				accountID: account.id
			})
		);

		for await (const prospectiveMember of iterator) {
			const match = (prospectiveMember.id.match(/([0-9])*$/) || [])[1];
			const numberPortion = parseInt(match, 10);

			highestNumber = Math.max(numberPortion, highestNumber);
		}

		id += highestNumber + 1;

		// tslint:disable-next-line:variable-name
		const _id = (
			await prospectiveCollection
				.add({
					...newMember,
					id,
					accountID: account.id,
					type: 'CAPProspectiveMember'
				})
				.execute()
		).getGeneratedIds()[0];

		const extraInformation = await CAPProspectiveMember.LoadExtraMemberInformation(
			{
				id,
				type: 'CAPProspectiveMember'
			},
			schema,
			account
		);

		return new CAPProspectiveMember(
			{
				_id,
				...newMember,
				accountID: account.id,
				type: 'CAPProspectiveMember',
				squadron: account.getSquadronName(),
				absenteeInformation: null,
				permissions: Member,
				id
			},
			schema,
			account,
			extraInformation
		);
	}

	public static async Get(
		id: string,
		account: Account,
		schema: Schema
	): Promise<CAPProspectiveMember | CAPNHQMember> {
		const prospectiveCollection = schema.getCollection<
			RawProspectiveMemberObject & Required<NoSQLDocument>
		>(CAPProspectiveMember.tableName);

		const results = await collectResults(
			findAndBind(prospectiveCollection, { id, accountID: account.id })
		);

		if (results.length !== 1) {
			throw new Error('Could not get member');
		}

		const permissions = Member;

		const extraInformation = await CAPProspectiveMember.LoadExtraMemberInformation(
			{
				id,
				type: 'CAPProspectiveMember'
			},
			schema,
			account
		);

		return new CAPProspectiveMember(
			{ ...results[0], permissions },
			schema,
			account,
			extraInformation
		);
	}

	private static tableName = 'ProspectiveMembers';

	/**
	 * Limit prospective member IDs to strings
	 */
	public id: string;
	/**
	 * Used to differentiate between users
	 */
	public type = 'CAPProspectiveMember' as const;
	/**
	 * Records the rank of the user
	 */
	public memberRank: string;
	/**
	 * Records the account this member belongs to
	 */
	public accountID: string;
	/**
	 * Records the flight this member is a part of
	 */
	public flight: string | null;
	/**
	 * Records absentee information about this member
	 */
	public absenteeInformation: AbsenteeInformation | null;
	/**
	 * Stores the duty positions of this member
	 */
	public dutyPositions: ShortDutyPosition[];
	/**
	 * Whether or not this member is a senior member
	 */
	public seniorMember: boolean;
	/**
	 * The squadron this member is a part of
	 */
	public squadron: string;
	/**
	 * The organization this member is a part of
	 */
	public orgid: number;
	/**
	 * The id in the database that holds information for this member
	 */
	// tslint:disable-next-line: variable-name
	public _id: string;

	public constructor(
		data: ProspectiveMemberObject & Required<NoSQLDocument>,
		schema: Schema,
		requestingAccount: Account,
		extraInformation: ExtraMemberInformation
	) {
		super(data, schema, requestingAccount, extraInformation);

		this.id = data.id;
		this.orgid = data.orgid;
		this.memberRank = data.memberRank;
		this.seniorMember = data.seniorMember;
		this.dutyPositions = data.dutyPositions;
		this.flight = data.flight;
		this.squadron = data.squadron;
		this.absenteeInformation = data.absenteeInformation;
		this.accountID = data.accountID;
		this._id = data._id;
	}

	public getHomeAccount = () => Account.Get(this.accountID, this.schema);

	public async *getAccounts() {
		yield this.getHomeAccount();
	}

	public getMainAccounts = () => this.getAccounts();

	public getReference = (): ProspectiveMemberReference => ({
		type: 'CAPProspectiveMember',
		id: this.id
	});

	public async save() {
		const prospectiveCollection = this.schema.getCollection<RawProspectiveMemberObject>(
			CAPProspectiveMember.tableName
		);

		await prospectiveCollection.replaceOne(this._id, this.toRealRaw());
	}

	public addTemporaryDutyPosition(position: TemporaryDutyPosition) {
		for (const tempPosition of this.extraInformation.temporaryDutyPositions) {
			if (tempPosition.Duty === position.Duty) {
				tempPosition.validUntil = position.validUntil;
				tempPosition.assigned = position.assigned;
				return;
			}
		}

		this.extraInformation.temporaryDutyPositions.push({
			Duty: position.Duty,
			assigned: position.assigned,
			validUntil: position.validUntil
		});

		this.updateDutyPositions();
	}

	public removeDutyPosition(duty: string) {
		if (this.extraInformation.temporaryDutyPositions.length === 0) {
			this.updateDutyPositions();
			return;
		}
		for (let i = this.extraInformation.temporaryDutyPositions.length - 1; i >= 0; i--) {
			if (this.extraInformation.temporaryDutyPositions[i].Duty === duty) {
				this.extraInformation.temporaryDutyPositions.splice(i, 1);
			}
		}

		this.updateDutyPositions();
	}

	public hasDutyPosition = (dutyPosition: string | string[]): boolean =>
		typeof dutyPosition === 'string'
			? this.dutyPositions.filter(duty => duty.duty === dutyPosition).length > 0
			: dutyPosition.map(this.hasDutyPosition).reduce((a, b) => a || b, false);

	public toRealRaw(): RawProspectiveMemberObject {
		return {
			id: this.id,
			contact: this.contact,
			nameFirst: this.nameFirst,
			nameLast: this.nameLast,
			nameMiddle: this.nameMiddle,
			nameSuffix: this.nameSuffix,
			usrID: this.usrID,
			type: this.type,
			teamIDs: this.teamIDs,
			absenteeInformation: this.absenteeInformation,
			flight: this.flight,
			dutyPositions: this.dutyPositions,
			memberRank: this.memberRank,
			seniorMember: this.seniorMember,
			squadron: this.squadron,
			orgid: this.orgid,
			accountID: this.accountID
		};
	}

	public toRaw(): ProspectiveMemberObject {
		return {
			...this.toRealRaw(),
			permissions: this.permissions
		};
	}

	private updateDutyPositions() {
		this.dutyPositions = [
			...this.dutyPositions.filter(v => v.type === 'NHQ'),
			...this.extraInformation.temporaryDutyPositions.map(v => ({
				type: 'CAPUnit' as 'CAPUnit',
				expires: v.validUntil,
				duty: v.Duty,
				date: v.assigned
			}))
		];
	}
}
