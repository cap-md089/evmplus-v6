import { APIEither } from '../../../typings/api';
import { NotificationCause, NotificationObject, NotificationTarget } from '../../../typings/types';

export * as global from './global';

export interface GetNotification {
	(params: { id: string }, body: {}): APIEither<
		NotificationObject<NotificationCause, NotificationTarget>
	>;

	url: '/api/notifications/:id';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}

export interface GetNotificationList {
	(params: {}, body: {}): APIEither<
		Array<APIEither<NotificationObject<NotificationCause, NotificationTarget>>>
	>;

	url: '/api/notifications';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}

export interface ToggleNotificationRead {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/notifications/:id';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}

export interface DeleteNotification {
	(params: { id: string }, body: {}): APIEither<void>;

	url: '/api/notifications/:id';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
