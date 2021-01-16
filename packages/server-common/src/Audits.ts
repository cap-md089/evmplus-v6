import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	AllAudits,
	asyncLeft,
	asyncRight,
	AuditableEventType,
	AuditableObjects,
	ChangeEvent,
	ChangeRepresentation,
	CreateEvent,
	DatabaseIdentifiable,
	DeleteEvent,
	destroy,
	errorGenerator,
	getFullMemberName,
	MemberReference,
	TargetForType,
	toReference,
} from 'common-lib';
import { resolveReference } from './Members';
import { ServerEither } from './servertypes';

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

export const saveAudit = (schema: Schema) => (audit: AllAudits) =>
	asyncRight(
		schema.getCollection<AllAudits>('Audits'),
		errorGenerator('Could not save audit information'),
	)
		.map(collection => collection.add(audit).execute())
		.map(destroy);

export const generateCreationAuditFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (actor: MemberReference) => <T extends AuditableObjects & DatabaseIdentifiable>(
	object: T,
): ServerEither<CreateEvent<T>> =>
	resolveReference(schema)(account)(actor)
		.map(getFullMemberName)
		.map(actorName => ({
			target: targetForType(object),
			actor: toReference(actor),
			actorName,
			accountID: account.id,
			targetID: object._id,
			timestamp: now(),
			type: AuditableEventType.ADD,
		}));
export const generateCreationAudit = generateCreationAuditFunc(Date.now);

export const areDeepEqual = <T>(a: T, b: T) => {
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
			if ((a as any).hasOwnProperty(i)) {
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

export const generateChangeAuditFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (actor: MemberReference) => <T extends AuditableObjects & DatabaseIdentifiable>(
	oldObject: T,
) => (newObject: T): ServerEither<ChangeEvent<T>> =>
	newObject._id === oldObject._id
		? resolveReference(schema)(account)(actor)
				.map(getFullMemberName)
				.map(
					actorName => ({
						target: targetForType(newObject),
						actor: toReference(actor),
						actorName,
						changes: getChangesForObject(oldObject, newObject),
						targetID: newObject._id,
						timestamp: now(),
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
export const generateChangeAudit = generateChangeAuditFunc(Date.now);

export const generateDeleteAuditFunc = (now = Date.now) => (schema: Schema) => (
	account: AccountObject,
) => (actor: MemberReference) => <T extends AuditableObjects & DatabaseIdentifiable>(
	obj: T,
): ServerEither<DeleteEvent<T>> =>
	resolveReference(schema)(account)(actor)
		.map(getFullMemberName)
		.map(
			actorName => ({
				target: targetForType(obj),
				actor: toReference(actor),
				actorName,
				accountID: account.id,
				targetID: obj._id,
				objectData: obj,
				timestamp: now(),
				type: AuditableEventType.DELETE,
			}),
			errorGenerator('Could not generate delete event'),
		);
export const generateDeleteAudit = generateDeleteAuditFunc(Date.now);
