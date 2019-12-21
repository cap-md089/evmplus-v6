import { api, asyncLeft, asyncRight, none } from 'common-lib';
import { DateTime } from 'luxon';
import {
	Account,
	asyncEitherHandler2,
	Event,
	memberRequestTransformer,
	serverErrorGenerator,
	Validator
} from '../../../lib/internals';
import { tokenTransformer } from '../../formtoken';

interface EventCopyBody {
	newTime: number;
	copyStatus: boolean | undefined | null;
	copyFiles: boolean | undefined | null;
}

export const copyValidator = new Validator<EventCopyBody>({
	newTime: {
		validator: Validator.Number
	},
	copyStatus: {
		validator: Validator.Or(Validator.Boolean, Validator.Nothing),
		required: false
	},
	copyFiles: {
		validator: Validator.Or(Validator.Boolean, Validator.Nothing),
		required: false
	}
});

export default asyncEitherHandler2<api.events.events.Copy, { id: string }>(req =>
	asyncRight(req, serverErrorGenerator('Could not copy event'))
		// Middleware
		.flatMap(r => Account.RequestTransformer(r))
		.flatMap(r => memberRequestTransformer(false, true)(r))
		.flatMap(r => tokenTransformer(r))
		// For some reason, this causes the type system to work properly, as opposed to just passing in copyValidator.transform
		.flatMap(r => copyValidator.transform(r))
		// Take the request and get the event
		.flatMap(r =>
			Event.GetEither(r.params.id, r.account, r.mysqlx)
				// Check for permissions
				.flatMap<Event>(event =>
					event.isPOC(r.member)
						? asyncRight(event, serverErrorGenerator('Could not copy event'))
						: asyncLeft({
								code: 403,
								error: none<Error>(),
								message: 'Member has invalid permissions to perform that action'
						  })
				)
				// Copy the event
				.map(event =>
					event.copy(
						DateTime.fromMillis(r.body.newTime),
						r.member,
						!!r.body.copyStatus,
						!!r.body.copyFiles
					)
				)
				// Return it to the user
				.map(event => event.toRaw(r.member))
		)
);
