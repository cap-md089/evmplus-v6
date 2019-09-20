import { Schema, Session } from '@mysql/xdevapi';
import conftest from '../../conf.test';
import { Account, CAPNHQMember, Event, getTestTools2, MemberBase } from '../../lib/internals';
import { newEvent } from '../consts';

describe('Event', () => {
	let event: Event;
	let mem: MemberBase;
	let account: Account;
	let schema: Schema;
	let session: Session;

	beforeAll(async done => {
		[account, schema, session] = await getTestTools2(conftest);

		mem = await CAPNHQMember.Get(542488, account, schema);

		done();
	});

	afterAll(async done => {
		await Promise.all([
			schema
				.getCollection('Events')
				.remove('true')
				.execute(),
			session.close()
		]);

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
				status: 0,
				canUsePhotos: true
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
				status: 0,
				canUsePhotos: true
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
					unpaidEventLimit: 500
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
});
