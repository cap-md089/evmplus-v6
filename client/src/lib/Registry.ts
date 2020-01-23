import {
	RankAndFileInformation,
	RegistryValues,
	WebsiteContact,
	WebsiteInformation,
	api,
	either
} from 'common-lib';
import Account from './Account';
import APIInterface from './APIInterface';
import MemberBase from './Members';

/**
 * A class to use to make changes to and read information from the database/server
 */
export default class Registry extends APIInterface<RegistryValues> implements RegistryValues {
	/**
	 * Gets the Registry values for an account
	 *
	 * @param account The Account to get the registry for
	 */
	public static async Get(account: Account) {
		let result;

		try {
			result = await account.fetch(`/api/registry`);
		} catch (e) {
			throw new Error('Could not get registry');
		}

		const registry = await result.json() as api.registry.Get;

		return either(registry).cata(
			e => Promise.reject(e.message),
			r => Promise.resolve(new Registry(r, account))
		);
	}

	/**
	 * Holds the Contact information in the Registry
	 */
	public Contact: WebsiteContact;

	/**
	 * Holds website information such as the name of the account
	 */
	public Website: WebsiteInformation;

	/**
	 * Contains information such as the flights in the account
	 */
	public RankAndFile: RankAndFileInformation;

	public constructor(values: RegistryValues, account: Account) {
		super(account.id);

		this.Contact = values.Contact;
		this.RankAndFile = values.RankAndFile;
		this.Website = values.Website;
	}

	public get id() {
		return this.accountID;
	}

	public toRaw(): RegistryValues {
		return {
			accountID: this.accountID,
			Contact: this.Contact,
			id: this.id,
			Website: this.Website,
			RankAndFile: this.RankAndFile
		};
	}

	public async save(member: MemberBase) {
		if (!member.hasPermission('RegistryEdit')) {
			throw new Error(`Member doesn't have permission to update registry`);
		}

		const token = await this.getToken(member);

		await this.fetch(
			'/api/registry',
			{
				method: 'POST',
				body: JSON.stringify({
					token,
					Contact: this.Contact,
					Website: this.Website,
					RankAndFile: this.RankAndFile
				})
			},
			member
		);
	}
}
