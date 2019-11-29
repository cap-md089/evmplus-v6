import { Schema } from '@mysql/xdevapi';
import { DatabaseInterface, NoSQLDocument, RegistryValues } from 'common-lib';
import { Account, collectResults, findAndBind, RegistryValueValidator } from './internals';
import { getUnitTimezoneGuess } from './Organizations';

export default class Registry implements DatabaseInterface<RegistryValues> {
	public static async Get(account: Account, schema: Schema): Promise<Registry> {
		const registryCollection = schema.getCollection<RegistryValues & Required<NoSQLDocument>>(
			Registry.collectionName
		);

		const results = await collectResults(
			findAndBind(registryCollection, {
				accountID: account.id
			})
		);

		if (results.length > 1) {
			throw new Error('Cannot get the registry values for an account');
		}

		if (results.length === 0) {
			return Registry.Create(account, schema);
		}

		return new Registry(results[0], account, schema);
	}

	private static collectionName = 'Registry';

	private static async Create(account: Account, schema: Schema): Promise<Registry> {
		const registryValues: RegistryValues = {
			Contact: {
				FaceBook: null,
				Flickr: null,
				Instagram: null,
				LinkedIn: null,
				MailingAddress: null,
				MeetingAddress: null,
				Twitter: null,
				YouTube: null
			},
			Website: {
				Name: '',
				Separator: ' - ',
				ShowUpcomingEventCount: 7,
				PhotoLibraryImagesPerPage: 20,
				Timezone: await getUnitTimezoneGuess(schema, account.mainOrg).fullJoin()
			},
			RankAndFile: {
				Flights: ['Alpha', 'Bravo', 'Charlie']
			},
			accountID: account.id,
			id: account.id
		};

		const registryCollection = schema.getCollection<RegistryValues>(Registry.collectionName);

		// tslint:disable-next-line:variable-name
		const _id = (await registryCollection.add(registryValues).execute()).getGeneratedIds()[0];

		return new Registry(
			{
				...registryValues,
				_id
			},
			account,
			schema
		);
	}

	public values: RegistryValues = {} as RegistryValues;

	// tslint:disable-next-line:variable-name
	public _id: string;

	public get accountID(): string {
		return this.account.id;
	}

	public get id(): string {
		return this.accountID;
	}

	private account: Account;

	private schema: Schema;

	private constructor(
		values: RegistryValues & Required<NoSQLDocument>,
		account: Account,
		schema: Schema
	) {
		this._id = values._id;
		this.values = values;
		this.account = account;
		this.schema = schema;
	}

	/**
	 * Updates the values in a secure manner
	 *
	 * TODO: Implement actual type checking, either return false or throw an error on failure
	 *
	 * @param values The values to set
	 */
	public set(values: Partial<RegistryValues>): boolean {
		if (RegistryValueValidator.validate(values, true)) {
			RegistryValueValidator.partialPrune(values, this.values);

			return true;
		} else {
			return false;
		}
	}

	public async save() {
		const registryCollection = this.schema.getCollection<RegistryValues>(
			Registry.collectionName
		);

		await registryCollection.replaceOne(this._id, this.values);
	}

	public async delete() {
		const registryCollection = this.schema.getCollection<RegistryValues>(
			Registry.collectionName
		);

		await registryCollection.removeOne(this._id);
	}

	public toRaw = (): RegistryValues => ({
		...this.values,
		accountID: this.account.id,
		id: this.account.id
	});
}
