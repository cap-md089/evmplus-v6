import {
	AccountObject,
	api,
	asyncRight,
	just,
	MaybeObj,
	Member,
	none,
	stringifyMemberReference
} from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	Event,
	memberRequestTransformer,
	resolveReference,
	serverErrorGenerator
} from '../../../lib/internals';

const inList = (
	member: Member,
	organizations: {
		[key: string]: AccountObject;
	}
): boolean => {
	for (const account in organizations) {
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

	return false;
};

export default asyncEitherHandler2<api.events.events.GetEventViewerData, { id: string }>(r =>
	asyncRight(r, serverErrorGenerator('Could not get event information'))
		.flatMap(req => Account.RequestTransformer(req))
		.flatMap(req => memberRequestTransformer(false, false)(req))
		.flatMap<api.events.events.EventViewerData>(req =>
			Event.GetEither(req.params.id, req.account, req.mysqlx)
				.setErrorValue(serverErrorGenerator('Could not get event information'))
				.map(async event => {
					let isValidMember = false;

					if (req.member.isSome()) {
						const member = req.member.some();

						for await (const account of member.getAccounts()) {
							if (account.id === req.account.id) {
								isValidMember = true;
							}
						}
					}

					return [isValidMember, event] as [boolean, Event];
				})
				.map(async ([isValidMember, event]) => {
					const attendance = event.getAttendance();

					const attendees: { [key: string]: MaybeObj<Member> } = {};
					const organizations: { [key: string]: AccountObject } = {};

					if (isValidMember) {
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

									if (!inList(member, organizations)) {
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

					return {
						event: event.toRaw(isValidMember ? req.member.some() : null),
						attendees,
						organizations
					};
				})
		)
);
