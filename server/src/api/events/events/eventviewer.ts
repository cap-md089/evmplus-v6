import {
	AccountObject,
	api,
	just,
	left,
	MaybeObj,
	Member,
	none,
	right,
	stringifyMemberReference
} from 'common-lib';
import {
	asyncEitherHandler,
	BasicConditionalMemberRequest,
	Event,
	resolveReference
} from '../../../lib/internals';

export default asyncEitherHandler<api.events.events.GetEventViewerData>(
	async (req: BasicConditionalMemberRequest<{ id: string }>) => {
		if (req.params.id === undefined) {
			return left({
				code: 400,
				error: none(),
				message: 'Event ID was not specified'
			});
		}

		let event: Event;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none(),
				message: 'Could not find event'
			});
		}

		let isValidMember = false;

		if (req.member) {
			for await (const account of req.member.getAccounts()) {
				if (account.id === req.account.id) {
					isValidMember = true;
				}
			}
		}

		const attendees: { [key: string]: MaybeObj<Member> } = {};
		const organizations: { [key: string]: AccountObject } = {};

		const inList = (member: Member): boolean => {
			for (const account in organizations) {
				if (organizations.hasOwnProperty(account)) {
					if (member.type === 'CAPNHQMember') {
						if (
							organizations[account].mainOrg === member.orgid ||
							organizations[account].orgIDs.includes(member.orgid)
						) {
							return true;
						}
					} else if (member.type === 'CAPProspectiveMember') {
						if (account === member.accountID) {
							return true;
						}
					}
				}
			}

			return false;
		};

		if (isValidMember) {
			const attendance = event.getAttendance();

			for (const attendee of attendance) {
				const ref = stringifyMemberReference(attendee.memberID);

				if (!attendees[ref]) {
					try {
						const member = await resolveReference(
							attendee.memberID,
							req.account,
							req.mysqlx,
							true
						);

						attendees[ref] = just(member.toRaw());

						if (!inList(member)) {
							for await (const account of member.getMainAccounts()) {
								organizations[account.id] = account.toRaw();
							}
						}
					} catch (e) {
						attendees[ref] = none();
					}
				}
			}
		}

		return right({
			event: event.toRaw(isValidMember ? req.member : null),
			attendees,
			organizations
		});
	}
);
