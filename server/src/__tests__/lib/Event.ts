import { Schema, Session } from '@mysql/xdevapi';
import { AttendanceStatus, EventStatus, just, stringifyMemberReference } from 'common-lib';
import { DateTime } from 'luxon';
import addevent from '../../api/events/events/addevent';
import copy from '../../api/events/events/copy';
import eventviewer from '../../api/events/events/eventviewer';
import getevent from '../../api/events/events/getevent';
import conftest from '../../conf.test';
import {
	Account,
	CAPNHQMember,
	CAPNHQUser,
	Event,
	getTestTools2,
	MemberBase
} from '../../lib/internals';
import { newEvent } from '../consts';
import '../EitherMatcher';
import {
	addAccountForTransformer,
	addUserForTransformer,
	getUser,
	prepareBasicGetRequest,
	prepareBasicPostRequest,
	resolveToEither
} from '../TestUtils';

describe('Event', () => {
	let event: Event;
	let mem: MemberBase;
	let account: Account;
	let schema: Schema;
	let session: Session;

	beforeAll(async done => {
		[account, schema, session] = await getTestTools2(conftest);

		mem = await CAPNHQMember.Get(542488, account, schema);

		await schema
			.getCollection('Events')
			.remove('true')
			.execute();

		done();
	});

	afterAll(async done => {
		await schema
			.getCollection('Events')
			.remove('true')
			.execute();

		await session.close();

		done();
	});

	it('should create an event successfully', async done => {
		event = await Event.Create(newEvent, account, schema, mem);

		expect(event.accountID).toEqual(account.id);
		expect(event.name).toEqual(newEvent.name);

		done();
	}, 8000);

	it('should get an event successfully', async done => {
		const getEvent = await Event.Get(event.id, account, schema);

		expect(getEvent.name).toEqual(newEvent.name);
		expect(getEvent.accountID).toEqual(account.id);

		done();
	});

	it('should get an event even if the id is an incorrect data type', async done => {
		// String ID vs number
		const getEvent = await Event.Get(event.id.toString(), account, schema);

		expect(getEvent.name).toEqual(newEvent.name);
		expect(getEvent.accountID).toEqual(account.id);

		done();
	});

	it('should get the display points of contacts', async done => {
		expect(event.pointsOfContact.length).toEqual(1);
		expect(event.pointsOfContact[0].name).toEqual('C/2dLt Andrew D Rioux');

		const getEvent = await Event.Get(event.id, account, schema);

		expect(getEvent.pointsOfContact.length).toEqual(1);
		expect(getEvent.pointsOfContact[0].name).toEqual('C/2dLt Andrew D Rioux');

		done();
	});

	it('should allow for adding attendance', () => {
		event.addMemberToAttendance(
			{
				arrivalTime: null,
				comments: '',
				departureTime: null,
				planToUseCAPTransportation: false,
				status: 0
			},
			mem
		);

		expect(event.attendance.length).toEqual(1);
		expect(event.attendance[0].memberID).toEqual(mem.getReference());
	});

	it('should allow for modifying attendance records', async done => {
		await event.modifyAttendanceRecord(
			{
				arrivalTime: null,
				comments: 'new record',
				departureTime: null,
				planToUseCAPTransportation: true,
				status: 0
			},
			mem
		);

		expect(event.attendance.length).toEqual(1);
		expect(event.attendance[0].memberID).toEqual(mem.getReference());
		expect(event.attendance[0].comments).toEqual('new record');
		expect(event.attendance[0].planToUseCAPTransportation).toEqual(true);

		done();
	});

	it('should allow for removing from attendance by member', () => {
		event.removeMemberFromAttendance(mem);

		expect(event.attendance.length).toEqual(0);
	});

	it('should save values', async done => {
		event.complete = true;

		await event.save();

		const getEvent = await Event.Get(event.id, account, schema);

		expect(getEvent.complete).toEqual(true);

		done();
	});

	it('should allow for linking to an event', async done => {
		let targetAccount: Account;

		try {
			targetAccount = await Account.Get('linktarget', schema);
		} catch (e) {
			targetAccount = await Account.Create(
				{
					adminIDs: [],
					echelon: false,
					expires: 0,
					id: 'linktarget',
					mainOrg: 916,
					orgIDs: [916],
					paid: true,
					paidEventLimit: 5,
					unpaidEventLimit: 500,
					aliases: []
				},
				schema
			);
		}

		const linkedEventCreated = await event.linkTo(targetAccount, mem);

		const getLinkedEvent = await Event.Get(linkedEventCreated.id, targetAccount, schema);

		expect(getLinkedEvent.author).toEqual(linkedEventCreated.author);
		expect(getLinkedEvent.sourceEvent!.id).toEqual(event.id);
		expect(getLinkedEvent.sourceEvent!.accountID).toEqual('mdx89');

		done();
	});

	it(`should fail to get an event that doesn't exist`, async done => {
		try {
			await Event.Get(3000, account, schema);
		} catch (e) {
			expect(e).toEqual(expect.any(Error));
		}

		done();
	});

	it('should copy an event', async done => {
		const testCopy = await event.copy(DateTime.fromMillis(event.startDateTime), mem);

		expect(testCopy.id).not.toEqual(event.id);
		expect(testCopy.name).toEqual(event.name);

		done();
	});

	it('should delete a file', async done => {
		const toDelete = await event.copy(DateTime.fromMillis(event.startDateTime), mem);

		await expect(toDelete.delete()).resolves.toEqual(void 0);

		done();
	});

	describe('/api/event', () => {
		it('should get an event', async done => {
			const req = prepareBasicGetRequest(conftest, { id: '1' }, session, '/api/event/1');
			const accReq = addAccountForTransformer(req, account);

			const res = await resolveToEither(getevent.fn(accReq));

			expect(res).toEqualRight(event.toRaw());

			done();
		});

		it('should get an event with attendance', async done => {
			const rioux = await getUser(
				{ type: 'CAPNHQMember', id: 542488 },
				'arioux',
				schema,
				account,
				CAPNHQUser
			);

			const req = prepareBasicGetRequest(conftest, { id: '1' }, session, '/api/event/1');
			const accReq = addAccountForTransformer(req, account);
			const riouxReq = addUserForTransformer(accReq, rioux);

			const res = await resolveToEither(getevent.fn(riouxReq));

			expect(res).toEqualRight(event.toRaw(mem));

			done();
		});

		it('should allow for creating events', async done => {
			const rioux = await getUser(
				{ type: 'CAPNHQMember', id: 542488 },
				'arioux',
				schema,
				account,
				CAPNHQUser
			);

			const req = prepareBasicPostRequest(conftest, newEvent, session, '/api/event');
			const accReq = addAccountForTransformer(req, account);
			const riouxReq = addUserForTransformer(accReq, rioux);

			const res = await resolveToEither(addevent.fn(riouxReq));

			expect(res).toMatchRight({
				...newEvent,
				signUpDenyMessage: null
			});

			done();
		});

		it('should allow for copying events', async done => {
			const rioux = await getUser(
				{ type: 'CAPNHQMember', id: 542488 },
				'arioux',
				schema,
				account,
				CAPNHQUser
			);
			const gemmel = await getUser(
				{ type: 'CAPNHQMember', id: 507228 },
				'mgemmel',
				schema,
				account,
				CAPNHQUser
			);

			const req = {
				...prepareBasicPostRequest(
					conftest,
					{ newTime: 0 },
					session,
					`/api/event/${event.id}/copy`
				),
				params: { id: event.id.toString() }
			};
			const accReq = addAccountForTransformer(req, account);
			const riouxReq = addUserForTransformer(accReq, rioux);
			const gemmelReq = addUserForTransformer(accReq, gemmel);

			const res1 = await resolveToEither(copy.fn(riouxReq));

			// The new event contains the information the copied event contains
			expect(res1).toMatchRight({
				...newEvent,
				status: EventStatus.INFORMATIONONLY,
				signUpDenyMessage: null,
				complete: true
			});

			const res2 = await resolveToEither(copy.fn(gemmelReq));

			expect(res2).toMatchLeft({
				code: 403
			});

			done();
		});

		it('should get event viewer information', async done => {
			const rioux = await getUser(
				{ type: 'CAPNHQMember', id: 542488 },
				'arioux',
				schema,
				account,
				CAPNHQUser
			);

			const req = {
				...prepareBasicGetRequest(
					conftest,
					{ id: event.id.toString() },
					session,
					`/api/event/${event.id}/viewer`
				),
				params: { id: event.id.toString() }
			};
			const accReq = addAccountForTransformer(req, account);
			const riouxReq = addUserForTransformer(accReq, rioux);

			const res1 = await eventviewer.fn(accReq);

			// If the member is not a member of the unit, it should return
			// the basic information about an event
			expect(res1).toMatchRight({
				attendees: {},
				event: event.toRaw(),
				organizations: {}
			});

			const res2 = await resolveToEither(eventviewer.fn(riouxReq));

			expect(res2).toMatchRight({
				attendees: {},
				event: event.toRaw(),
				organizations: {}
			});

			await event.addMemberToAttendance(
				{
					comments: '',
					status: AttendanceStatus.COMMITTEDATTENDED,
					arrivalTime: null,
					departureTime: null,
					planToUseCAPTransportation: false,
					memberID: rioux.getReference()
				},
				rioux
			);

			const res3 = await resolveToEither(eventviewer.fn(riouxReq));

			expect(res3).toMatchRight({
				attendees: {
					[stringifyMemberReference(rioux)]: just(rioux.toRaw())
				},
				event: event.toRaw(rioux),
				organizations: {
					[account.id]: account.toRaw(),
					// The accounts below have to be added because they use 916 as their main ORG id
					// the Rioux account is in the 916 org, and as such the accounts below
					'linktarget': (await Account.Get('linktarget', schema)).toRaw(),
					'md089-test': (await Account.Get('md089-test', schema)).toRaw()
				}
			});

			done();
		});
	});
});
