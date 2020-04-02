import {
	api,
	asyncRight,
	CAPWATCHImportUpdate,
	fromValue,
	left,
	MemberUpdateEventEmitter,
	none,
	right
} from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	BasicMemberRequest,
	CAPNHQMember,
	CAPNHQUser,
	ImportCAPWATCHFile,
	memberRequestTransformer,
	permissionTransformer,
	serverErrorGenerator,
	SessionType,
	Validator
} from '../../../lib/internals';
import { tokenTransformer } from '../../formtoken';

interface RequestBody {
	orgIDs: number[];
	files?: string[];
	password: string;
}

const validator = new Validator<RequestBody>({
	orgIDs: {
		validator: Validator.ArrayOf(Validator.Number)
	},
	files: {
		validator: Validator.ArrayOf(Validator.String),
		required: false
	},
	password: {
		validator: Validator.String
	}
});

const defaultFiles = [
	'Member.txt',
	'DutyPosition.txt',
	'MbrContact.txt',
	'CadetDutyPositions.txt',
	'CadetActivities.txt',
	'OFlight.txt',
	'MbrAchievements.txt'
];

const sequentialExecute = async <T, R>(
	info: T[],
	mapper: (info: T, index: number) => Promise<R>
): Promise<R[]> => {
	const res = [];
	let index = 0;
	for (const i of info) {
		res.push(await mapper(i, index++));
	}
	return res;
};

const collect = async <T>(iter: AsyncIterableIterator<T>): Promise<T[]> => {
	const res = [];
	for await (const i of iter) {
		res.push(i);
	}
	return res;
};

export default (capwatchEmitter: MemberUpdateEventEmitter) =>
	asyncEitherHandler2<api.member.capwatch.RequestImport>(request =>
		asyncRight(request, serverErrorGenerator('Could not import CAPWATCH files'))
			// Validate request
			.flatMap(Account.RequestTransformer)
			.flatMap(memberRequestTransformer(SessionType.REGULAR, true))
			.flatMap(tokenTransformer)
			.flatMap(permissionTransformer('DownloadCAPWATCH'))
			.flatMap(r => validator.transform(r))
			.flatMap<Omit<BasicMemberRequest<{}, RequestBody>, 'member'> & { member: CAPNHQUser }>(
				req =>
					req.member instanceof CAPNHQMember
						? right({
								...req,
								member: req.member
						  })
						: left({
								code: 400,
								message:
									'Member cannot import CAPWATCH files. Member has to be a CAP NHQ member',
								error: none<Error>()
						  })
			)
			// Perform import
			.flatMap(req =>
				asyncRight(
					fromValue(req.body.files).orSome(defaultFiles),
					serverErrorGenerator('Could not import CAPWATCH files')
				)
					.flatMap(files =>
						asyncRight(
							req.body.orgIDs,
							serverErrorGenerator('Could not get CAPWATCH files')
						)
							// Download CAPWATCH files
							.map(ids =>
								Promise.all(
									ids.map(id =>
										req.member.downloadCAPWATCHFile(
											id,
											req.body.password,
											req.configuration
										)
									)
								)
							)
							// Import files
							.map(filePaths =>
								sequentialExecute(filePaths, (path, i) =>
									collect(
										ImportCAPWATCHFile(
											path,
											req.mysqlx,
											req.mysqlxSession,
											req.body.orgIDs[i],
											files
										)
									)
								)
							)
							// Parse results, send them to the client
							.map(results =>
								results.map((resultList, index) =>
									resultList.map<api.member.capwatch.CAPWATCHFileImportedResult>(
										res => ({
											type: CAPWATCHImportUpdate.FileImported,
											orgID: req.body.orgIDs[index],
											error: res.error,
											file: res.file
										})
									)
								)
							)
							.map(results => results.reduce((prev, curr) => [...prev, ...curr], []))
					)
					.tap(results => {
						capwatchEmitter.emit('capwatchImport', req.account.toRaw());
					})
			)
	);
