import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	AllAudits,
	asyncLeft,
	asyncRight,
	AuditableEventType,
	AuditableObjects,
	BasicMySQLRequest,
	ChangeEvent,
	ChangeRepresentation,
	CreateEvent,
	DatabaseIdentifiable,
	DeleteEvent,
	destroy,
	errorGenerator,
	MemberReference,
	TargetForType,
	toReference,
} from 'common-lib';
import { Backends, TimeBackend } from './backends';
import { MemberBackend } from './Members';
import { ServerEither } from './servertypes';
import { TeamsBackend } from './Team';

const targetForType = <T extends AuditableObjects>(obj: T): TargetForType<T> =>
	('meetDateTime' in obj
		? 'Event'
		: 'planToUseCAPTransportaiton' in obj
		? 'Attendance'
		: 'fileName' in obj
		? 'File'
		: 'ManageEvent' in obj
		? 'Permissions'
		: 'CAPProspectiveMember') as TargetForType<T>;

export const saveAudit = (schema: Schema) => (audit: AllAudits): ServerEither<void> =>
	asyncRight(
		schema.getCollection<AllAudits>('Audits'),
		errorGenerator('Could not save audit information'),
	)
		.map(collection => collection.add(audit).execute())
		.map(destroy);

export const generateCreationAudit = (backend: Backends<[TimeBackend, MemberBackend]>) => (
	account: AccountObject,
) => (actor: MemberReference) => <T extends AuditableObjects & DatabaseIdentifiable>(
	object: T,
): ServerEither<CreateEvent<T>> =>
	backend
		.getMemberName(account)(actor)
		.map(actorName => ({
			target: targetForType(object),
			actor: toReference(actor),
			actorName,
			accountID: account.id,
			targetID: object._id,
			timestamp: backend.now(),
			type: AuditableEventType.ADD,
		}));

export const areDeepEqual = <T>(a: T, b: T): boolean => {
	if (a === null && b !== null) {
		return false;
	}
	if (b === null && a !== null) {
		return false;
	}
	if (a === null && b === null) {
		return true;
	}

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) {
			return false;
		}
		for (let looper = 0; looper < a.length; looper++) {
			if (!areDeepEqual(a[looper], b[looper])) {
				return false;
			}
		}
		return true;
	}

	if (typeof a === 'object' && typeof b === 'object') {
		for (const i in a) {
			if ((a as { hasOwnProperty(key: typeof i): boolean }).hasOwnProperty(i)) {
				if (!areDeepEqual(a[i], b[i])) {
					return false;
				}
			}
		}
		return true;
	} else {
		return a === b;
	}
};

export const getChangesForObject = <T extends object>(
	oldObj: T,
	newObj: T,
): ChangeRepresentation<T> => {
	const changes: ChangeRepresentation<T> = {};

	for (const key in oldObj) {
		if (
			oldObj.hasOwnProperty(key) &&
			newObj.hasOwnProperty(key) &&
			!areDeepEqual(oldObj[key], newObj[key])
		) {
			changes[key] = {
				oldValue: oldObj[key],
				newValue: newObj[key],
			};
		}
	}

	return changes;
};

export const generateChangeAudit = (backend: Backends<[TimeBackend, MemberBackend]>) => (
	account: AccountObject,
) => (actor: MemberReference) => <T extends AuditableObjects & DatabaseIdentifiable>(
	oldObject: T,
) => (newObject: T): ServerEither<ChangeEvent<T>> =>
	newObject._id === oldObject._id
		? backend
				.getMemberName(account)(actor)
				.map(
					actorName => ({
						target: targetForType(newObject),
						actor: toReference(actor),
						actorName,
						changes: getChangesForObject(oldObject, newObject),
						targetID: newObject._id,
						timestamp: backend.now(),
						accountID: account.id,
						type: AuditableEventType.MODIFY,
					}),
					errorGenerator(''),
				)
		: asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'Cannot record change event for two different objects',
		  });

export const generateDeleteAudit = (backend: Backends<[TimeBackend, MemberBackend]>) => (
	account: AccountObject,
) => (actor: MemberReference) => <T extends AuditableObjects & DatabaseIdentifiable>(
	obj: T,
): ServerEither<DeleteEvent<T>> =>
	backend
		.getMemberName(account)(actor)
		.map(
			actorName => ({
				target: targetForType(obj),
				actor: toReference(actor),
				actorName,
				accountID: account.id,
				targetID: obj._id,
				objectData: obj,
				timestamp: backend.now(),
				type: AuditableEventType.DELETE,
			}),
			errorGenerator('Could not generate delete event'),
		);

export interface AuditsBackend {
	generateCreationAudit: (
		account: AccountObject,
	) => (
		actor: MemberReference,
	) => <T extends AuditableObjects & DatabaseIdentifiable>(object: T) => ServerEither<void>;
	generateDeleteAudit: (
		account: AccountObject,
	) => (
		actor: MemberReference,
	) => <T extends AuditableObjects & DatabaseIdentifiable>(obj: T) => ServerEither<void>;
	generateChangeAudit: (
		account: AccountObject,
	) => (
		actor: MemberReference,
	) => <T extends AuditableObjects & DatabaseIdentifiable>(
		diff: [oldObj: T, newObj: T],
	) => ServerEither<void>;
}

export const getAuditsBackend = (
	req: BasicMySQLRequest,
	prevBackend: Backends<[TimeBackend, TeamsBackend, MemberBackend]>,
): AuditsBackend => getRequestFreeAuditsBackend(req.mysqlx, prevBackend);

export const getRequestFreeAuditsBackend = (
	mysqlx: Schema,
	prevBackend: Backends<[TimeBackend, TeamsBackend, MemberBackend]>,
): AuditsBackend => ({
	generateCreationAudit: account => actor => object =>
		generateCreationAudit(prevBackend)(account)(actor)(object).flatMap(saveAudit(mysqlx)),
	generateChangeAudit: account => actor => ([oldObj, newObj]) =>
		generateChangeAudit(prevBackend)(account)(actor)(oldObj)(newObj).flatMap(saveAudit(mysqlx)),
	generateDeleteAudit: account => actor => object =>
		generateDeleteAudit(prevBackend)(account)(actor)(object).flatMap(saveAudit(mysqlx)),
});
