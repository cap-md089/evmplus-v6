import { MaybeObj } from '../../../lib/Maybe';
import { APIEither } from '../../../typings/api';
import {
	NotificationCause,
	NotificationDataMessage,
	NotificationEveryoneTarget,
	NotificationObject,
} from '../../../typings/types';

export interface CreateGlobalNotification {
	(params: {}, body: { text: string; expires: number }): APIEither<
		NotificationObject<NotificationCause, NotificationEveryoneTarget, NotificationDataMessage>
	>;

	url: '/api/notifications/global';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface GetGlobalNotification {
	(params: {}, body: {}): APIEither<
		MaybeObj<
			NotificationObject<
				NotificationCause,
				NotificationEveryoneTarget,
				NotificationDataMessage
			>
		>
	>;

	url: '/api/notifications/global';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: false;
}
