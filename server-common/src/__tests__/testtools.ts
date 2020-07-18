import { getSession, Schema, Session } from '@mysql/xdevapi';
import {
	AccountType,
	Configuration,
	Maybe,
	RawCAPEventAccountObject,
	RawCAPSquadronAccountObject,
	EitherObj,
	Either,
} from 'common-lib';
import 'common-lib/dist/test';

let testSession: Session;

type TestTools = [Schema, RawCAPSquadronAccountObject, Session] & {
	sqAccount: RawCAPSquadronAccountObject;
	evtAccount: RawCAPEventAccountObject;
	schema: Schema;
	session: Session;
};

export const testTools = async (conf: Configuration): Promise<TestTools> => {
	const sqAccount: RawCAPSquadronAccountObject = {
		type: AccountType.CAPSQUADRON,
		aliases: [],
		comments: '',
		discordServer: Maybe.none(),
		displayName: "St Mary's Test",
		id: 'mdx89',
		mainCalendarID: '',
		mainOrg: 916,
		orgIDs: [916, 2529],
		parent: Maybe.none(),
		serviceAccount: Maybe.none(),
		shareLink: '',
		wingCalendarID: '',
	};

	const evtAccount: RawCAPEventAccountObject = {
		type: AccountType.CAPEVENT,
		aliases: [],
		comments: '',
		discordServer: Maybe.none(),
		displayName: 'ALS',
		id: 'md001als',
		mainCalendarID: '',
		parent: Maybe.none(),
		serviceAccount: Maybe.none(),
		shareLink: '',
		wingCalendarID: '',
	};

	testSession =
		testSession ||
		(await getSession({
			user: conf.database.connection.user,
			password: conf.database.connection.password,
			host: conf.database.connection.host,
			port: conf.database.connection.port,
		}));

	if (testSession === undefined) {
		throw new Error('Could not get MySQL session!');
	}

	const schema = testSession.getSchema(conf.database.connection.database);

	// @ts-ignore
	const returnValue: TestTools = [schema, sqAccount, testSession];

	returnValue.sqAccount = sqAccount;
	returnValue.evtAccount = evtAccount;
	returnValue.schema = schema;
	returnValue.session = testSession;

	return returnValue;
};

export const assertRight = <T>(eith: EitherObj<any, T>): T => {
	if (Either.isLeft(eith)) {
		throw new Error('Either object is left');
	}

	return eith.value;
};
