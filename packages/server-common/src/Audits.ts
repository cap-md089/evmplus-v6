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
	MemberReference,
	TargetForType,
} from 'common-lib';
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

export const generateCreationAuditFunc = (now = Date.now) => (account: AccountObject) => (
	actor: MemberReference,
) => <T extends AuditableObjects & DatabaseIdentifiable>(object: T): ServerEither<CreateEvent<T>> =>
	asyncRight(
		{
			target: targetForType(object),
			actor,
			accountID: account.id,
			targetID: object._id,
			timestamp: now(),
			type: AuditableEventType.ADD,
		},
		errorGenerator('Could not generate creation audit'),
	);
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

export const generateChangeAuditFunc = (now = Date.now) => (account: AccountObject) => (
	actor: MemberReference,
) => <T extends AuditableObjects & DatabaseIdentifiable>(oldObject: T) => (
	newObject: T,
): ServerEither<ChangeEvent<T>> =>
	newObject._id === oldObject._id
		? asyncRight(
				{
					target: targetForType(newObject),
					actor,
					changes: getChangesForObject(oldObject, newObject),
					targetID: newObject._id,
					timestamp: now(),
					accountID: account.id,
					type: AuditableEventType.MODIFY,
				},
				errorGenerator(''),
		  )
		: asyncLeft({
				type: 'OTHER',
				code: 400,
				message: 'Cannot record change event for two different objects',
		  });
export const generateChangeAudit = generateChangeAuditFunc(Date.now);

export const generateDeleteAuditFunc = (now = Date.now) => (account: AccountObject) => (
	actor: MemberReference,
) => <T extends AuditableObjects & DatabaseIdentifiable>(obj: T): ServerEither<DeleteEvent<T>> =>
	asyncRight(
		{
			target: targetForType(obj),
			actor,
			accountID: account.id,
			targetID: obj._id,
			objectData: obj,
			timestamp: now(),
			type: AuditableEventType.DELETE,
		},
		errorGenerator('Could not generate delete event'),
	);
export const generateDeleteAudit = generateDeleteAuditFunc(Date.now);
