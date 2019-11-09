/*
import { Schema } from '@mysql/xdevapi';
import {
	NoSQLDocument,
	OrganizationObject
} from 'common-lib';
import {
	collectResults,
	findAndBind
} from './internals';

export default class Organization implements OrganizationObject {
	public static async Get(orgid: number, schema: Schema) {
		const organizationCollection = schema.getCollection<OrganizationObject & Required<NoSQLDocument>>('Organizations');

		const results = await collectResults(
			findAndBind(organizationCollection, {
				ORGID: orgid
			})
		);

		if (results.length !== 1) {
			throw new Error('Could not get organization');
		}

		return new Organization(results[0], schema);
	}

	public ORGID: number;
	public Region: string;
	public Wing: string;
	public Unit: string;
	public NextLevel: number;
	public Name: string;
	public Type: string;
	public DateChartered: string;
	public Status: string;
	public Scope: string;
	public UsrID: string;
	public DateMod: string;
	public FirstUsr: string;
	public DateCreated: string;
	public DateReceived: string;
	public OrgNotes: string;

	public constructor(
		data: OrganizationObject & Required<NoSQLDocument>,
		private schema: Schema
	) {
		this.ORGID = data.ORGID;
		this.Region = data.Region;
		this.Wing = data.Wing;
		this.Unit = data.Unit;
		this.NextLevel = data.NextLevel;
		this.Name = data.Name;
		this.Type = data.Type;
		this.DateChartered = data.DateChartered;
		this.Status = data.Status;
		this.Scope = data.Scope;
		this.UsrID = data.UsrID;
		this.DateMod = data.DateMod;
		this.FirstUsr = data.FirstUsr;
		this.DateCreated = data.DateCreated;
		this.DateReceived = data.DateReceived;
		this.OrgNotes = data.OrgNotes;
	}



	public toRaw() {
		return {
			ORGID: this.ORGID,
			Region: this.Region,
			Wing: this.Wing,
			Unit: this.Unit,
			NextLevel: this.NextLevel,
			Name: this.Name,
			Type: this.Type,
			DateChartered: this.DateChartered,
			Status: this.Status,
			Scope: this.Scope,
			UsrID: this.UsrID,
			DateMod: this.DateMod,
			FirstUsr: this.FirstUsr,
			DateCreated: this.DateCreated,
			DateReceived: this.DateReceived,
			OrgNotes: this.OrgNotes,
		};
	}



}

/*
const getOrganization = async (orgid: number): NHQ.Organization => {
	
}
*/

export const getUnitNumber = async (orgid: number) => {
	return 'MAR-MD-089';
}

export const getUnitName = async (orgid: number) => {
	return 'ST MARYS COMPOSITE SQUADRON';
}
