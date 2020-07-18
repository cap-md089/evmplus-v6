import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	asyncRight,
	errorGenerator,
	get,
	isRegularCAPAccountObject,
	RegistryValues,
	ServerError,
	Timezone,
} from 'common-lib';
import {
	addItemToCollection,
	collectResults,
	findAndBindC,
	saveItemToCollectionA,
} from './MySQLUtil';
import { getUnitTimezoneGuess } from './Organizations';
import { ServerEither } from './servertypes';

export const getRegistry = (schema: Schema) => (
	account: AccountObject
): ServerEither<RegistryValues> =>
	asyncRight(
		schema.getCollection<RegistryValues>('Registry'),
		errorGenerator('Could not get registry')
	)
		.map(
			findAndBindC<RegistryValues>({ accountID: account.id })
		)
		.map(collectResults)
		.filter(results => results.length <= 1, {
			type: 'OTHER',
			code: 500,
			message: 'Could not get registry',
		})
		.flatMap(results =>
			results.length === 0
				? createRegistry(schema)(account)
				: asyncRight(results[0], errorGenerator('Could not get registry'))
		);

export const getRegistryById = (schema: Schema) => (
	accountID: string
): ServerEither<RegistryValues> =>
	asyncRight(
		schema.getCollection<RegistryValues>('Registry'),
		errorGenerator('Could not get registry')
	)
		.map(
			findAndBindC<RegistryValues>({ accountID })
		)
		.map(collectResults)
		.filter(results => results.length === 1, {
			type: 'OTHER',
			code: 500,
			message: 'Could not get registry',
		})
		.map(get(0));

export const createRegistry = (schema: Schema) => (
	account: AccountObject
): ServerEither<RegistryValues> =>
	(isRegularCAPAccountObject(account)
		? getUnitTimezoneGuess(schema, account)
		: asyncRight<ServerError, Timezone>(
				'America/New_York',
				errorGenerator('Could not create registry')
		  )
	).flatMap(timezone =>
		asyncRight(
			schema.getCollection<RegistryValues>('Registry'),
			errorGenerator('Could not get registry')
		).flatMap(
			addItemToCollection<RegistryValues>({
				Contact: {
					FaceBook: null,
					Flickr: null,
					Instagram: null,
					LinkedIn: null,
					MailingAddress: null,
					MeetingAddress: null,
					Twitter: null,
					YouTube: null,
					Discord: null,
				},
				Website: {
					Name: '',
					Separator: ' - ',
					ShowUpcomingEventCount: 7,
					PhotoLibraryImagesPerPage: 20,
					Timezone: timezone,
				},
				RankAndFile: {
					Flights: ['Alpha', 'Bravo', 'Charlie'],
				},
				accountID: account.id,
				id: account.id,
			})
		)
	);

export const saveRegistry = (schema: Schema) => (
	registry: RegistryValues
): ServerEither<RegistryValues> =>
	asyncRight(
		schema.getCollection<RegistryValues>('Registry'),
		errorGenerator('Could not save registry')
	).flatMap(saveItemToCollectionA(registry));
