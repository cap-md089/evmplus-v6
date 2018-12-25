import APIInterface from './APIInterface';
import Account from './Account';

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

		const registry = await result.json();

		return new Registry(registry, account);
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
	 * Holds blog information
	 * 
	 * Also configures photo library
	 */
	public Blog: BlogInformation;

	public constructor(values: RegistryValues, account: Account) {
		super(account.id);

		this.Blog = values.Blog;
		this.Contact = values.Contact;
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
			Blog: this.Blog
		}
	}
}