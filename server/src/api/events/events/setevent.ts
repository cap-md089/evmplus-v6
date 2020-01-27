import { api, asyncLeft, asyncRight, EventStatus, none } from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	BasicMemberRequest,
	CAPNHQUser,
	Event,
	EventValidator,
	memberRequestTransformer,
	serverErrorGenerator
} from '../../../lib/internals';
import { tokenTransformer } from '../../formtoken';

export default asyncEitherHandler2<api.events.events.Set, { id: string }>(req =>
	asyncRight(req, serverErrorGenerator('Could not update event'))
		.flatMap(r => Account.RequestTransformer(r))
		.flatMap(r => memberRequestTransformer(false, true)(r))
		.flatMap(r => tokenTransformer(r))
		.flatMap<BasicMemberRequest<{ id: string }>>(r =>
			r.member.hasPermission('ManageEvent') ||
			(r.member instanceof CAPNHQUser &&
				r.member.hasDutyPosition([
					'Operations Officer',
					'Squadron Activities Officer',
					'Activities Officer',
					'Cadet Operations Officer',
					'Cadet Operations NCO',
					'Cadet Activities Officer',
					'Cadet Activities NCO'
				]))
				? asyncRight(r, serverErrorGenerator('Could not create new event'))
				: asyncLeft({
						error: none<Error>(),
						message: 'Member does not have permission to perform that action',
						code: 403
				  })
		)
		.flatMap(r => EventValidator.partialTransform(r))
		.map(r => ({
			...r,
			body: {
				...r.body,
				// We don't want those without the proper permissions to publish an event
				// they don't have the permission to publish
				// This allows for cadets to have responsibility but still be verified by
				// senior members
				status:
					r.member.hasPermission('ManageEvent') ||
					(r instanceof CAPNHQUser &&
						r.member.hasDutyPosition([
							'Operations Officer',
							'Squadron Activities Officer',
							'Activities Officer'
						]))
						? r.body.status
						: EventStatus.DRAFT
			}
		}))
		.flatMap(r =>
			Event.GetEither(r.params.id, r.account, r.mysqlx)
				.tap(event => event.set(r.body, r.account, r.mysqlx, r.member))
				.map(event => event.save())
		)
);
