import { Schema } from '@mysql/xdevapi';
import { DateTime } from 'luxon';
import Account from '../Account';
import MemberBase from '../MemberBase';
import { collectResults, findAndBind } from '../MySQLUtil';
import { getPermissions } from '../Permissions';

export default class CAPWATCHMember extends MemberBase {
	public static readonly tableNames = {
		member: 'NHQ_Member',
		contact: 'NHQ_MbrContact'
	};

	public static async Get(
		id: number,
		account: Account,
		schema: Schema
	): Promise<CAPWATCHMember> {
		const memberTable = schema.getCollection<NHQ.Member>(
			this.tableNames.member
		);
		const memberContactTable = schema.getCollection<NHQ.MbrContact>(
			this.tableNames.contact
		);

		const [
			results,
			capwatchContact,
			dutyPositions,
			extraInformation
		] = await Promise.all([
			collectResults(
				findAndBind(memberTable, {
					CAPID: id
				})
			),
			collectResults(
				findAndBind(memberContactTable, {
					CAPID: id
				})
			),
			CAPWATCHMember.GetRegularDutypositions(id, schema, account),
			CAPWATCHMember.LoadExtraMemberInformation(id, schema, account)
		]);

		if (results.length !== 1) {
			throw new Error('Cannot select member');
		}

		const memberContact: { [key: string]: Partial<{}> } = {
			ALPHAPAGER: {},
			ASSISTANT: {},
			CADETPARENTEMAIL: {},
			CADETPARENTPHONE: {},
			CELLPHONE: {},
			DIGITALPAGER: {},
			EMAIL: {},
			HOMEFAX: {},
			HOMEPHONE: {},
			INSTANTMESSAGER: {},
			ISDN: {},
			RADIO: {},
			TELEX: {},
			WORKFAX: {},
			WORKPHONE: {}
		};

		for (const i in memberContact) {
			if (memberContact.hasOwnProperty(i)) {
				memberContact[i] = {
					PRIMARY: '',
					SECONDARY: '',
					EMERGENCY: ''
				};
			}
		}

		const contact = (memberContact as any) as MemberContact;

		capwatchContact.forEach(val => {
			contact[
				val.Type.toUpperCase().replace(/ /g, '') as MemberContactType
			][val.Priority] = val.Contact;
		});

		const temporaryDutyPositions = extraInformation.temporaryDutyPositions
			.filter(val => val.validUntil > +DateTime.utc())
			.map(val => val.Duty);

		const permissions = getPermissions(extraInformation.accessLevel);

		return new CAPWATCHMember(
			{
				id,
				contact,
				dutyPositions: [...dutyPositions, ...temporaryDutyPositions],
				flight: extraInformation.flight,
				memberRank: results[0].Rank,
				nameFirst: results[0].NameFirst,
				nameLast: results[0].NameLast,
				nameMiddle: results[0].NameMiddle,
				nameSuffix: results[0].NameSuffix,
				seniorMember: results[0].Type !== 'CADET',
				squadron: `${results[0].Region}-${results[0].Wing}-${
					results[0].Unit
				}`,
				orgid: results[0].ORGID,
				usrID: CAPWATCHMember.GetUserID([
					results[0].NameFirst,
					results[0].NameMiddle,
					results[0].NameLast,
					results[0].NameSuffix
				]),
				kind: 'CAPWATCHMember',
				permissions,
				teamIDs: extraInformation.teamIDs
			},
			schema,
			account
		);
	}

	public permissions: MemberPermissions;

	public kind: MemberType = 'CAPWATCHMember';

	private constructor(
		data: MemberObject,
		schema: Schema,
		requestingAccount: Account
	) {
		super(data, schema, requestingAccount);
	}

	public getReference = (): MemberReference => ({
		id: this.id,
		kind: 'NHQMember'
	});
}
