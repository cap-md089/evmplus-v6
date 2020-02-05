import * as aws from 'aws-sdk';
import { just, left, RawAccountObject } from 'common-lib';
import * as mysql from 'mysql';
import conf from './conf';
import { deleteAllGoogleCalendarEvents, getMigrateAccount, updateGoogleCalendars } from './lib/internals';

/*

import * as aws from 'aws-sdk';
import { just, left, RawMemberObject } from 'common-lib';
import conf from './conf';
import { collectResults, deleteAllGoogleCalendarEvents, findAndBind, getMigrateAccount, updateGoogleCalendars } from './lib/internals';

*/

(async () => {
	// const capImport2 = ImportCAPWATCHFile(
	// 	'/storage/storage/MyFiles/CAP/CAPWATCH/Archive/2018-12-12_546319-089.zip',
	// 	schema,
	// 	session,
	// 	2529
	// );

	// for await (const i of capImport2) {
	// 	console.log(i);
	// }import { newEvent as myRawEvent } from './__tests__/consts';

	// const capImport = ImportCAPWATCHFile(
	// 	'/storage/storage/MyFiles/CAP/CAPWATCH/Archive/2018-12-12_546319-890.zip',
	// 	schema,
	// 	session,
	// 	916
	// );

	// for await (const i of capImport) {
	// 	console.log(i);
	// }
	/*
	const testmonth = "02";
	const testday = "02";
	const testhour = "14";  
	const testminute = "00";
	const testdate = new Date("2020-" + testmonth + "-" + testday + "T" + testhour + ":" + testminute + ":00");
	const epochstart = testdate.getTime();
	const epochend = epochstart + (60 * 60 * 1.5 * 1000);
	const epochreg = epochstart - (60 * 60 * 2 * 1000);
	const epochfee = epochstart - (60 * 60 * 1 * 1000);

	const myEvent: RawEventObject = {
		...myRawEvent,
		name: 'Weekly Meeting',
		timeModified: new Date().getTime(),
		timeCreated: new Date().getTime(),
		accountID: 'mdx89',
		googleCalendarIds:{
			mainId: "20a915de22f34a7ba2a5db6a077e8021",
			wingId: "2ad459d92b1641c3b13c47cb0f003a16",
			regId: "72389fe585c640ed8894ac3a1d756c69",
			feeId: "6dbc5854a7ee4b398ef375618f4fafbe"
		},
		author: { type: 'CAPNHQMember', id: 546319 },
		debrief: [],
		id: 4,
		sourceEvent: null,
		meetDateTime: epochstart,
		meetLocation: 'Civil Air Patrol St. Mary\'s Composite Squadron',
		startDateTime: epochstart,
		location: 'Airport',
		endDateTime: epochend,
		pickupDateTime: epochend,
		pickupLocation: 'Airport',
		transportationProvided: false,
		uniform: [[true, false, true, false, false, false, false, false, false], ''],
		status: 1,
// 		registration: { deadline: epochreg, information: "This is registration information" },
// 		participationFee: { feeDue: epochfee, feeAmount: 20 }
	};
*/
	// const myAccount: RawAccountObject = {
	// 	id: "md089",
	// 	accountName: "St. Mary\'s Composite Squadron",
	// 	mainCalendarID: "r2lu9p16lh7qa5r69bv14h85i8@group.calendar.google.com",
	// 	wingCalendarID: "6t22lk6thigsg6udc7rkpap2tg@group.calendar.google.com",
	// 	serviceAccount: "md089-capunit-calendar@md089-capunit.iam.gserviceaccount.com",
	// 	echelon: false,
	// 	mainOrg: 916,
	// 	orgIDs: [916,2529],
	// 	paid: true,
	// 	expires: 4102462740,
	// 	paidEventLimit: 60,
	// 	unpaidEventLimit: 10,
	// 	aliases: [ "stmarys" ],
	// 	adminIDs: [{ type: 'CAPNHQMember', id: 546319 }]
	// }

	// const newId: string = await createCalendarEvent(myEvent);
	// myEvent.googleCalendarId = newId;

	// console.log(myEvent.googleCalendarId);

	// 99999999999 need to load return value into event object stored in database
	// main, wing, reg, fee
	// 	const googleCalendarUUIDs: string[] = await updateGoogleCalendars(myEvent, account);
	// 	console.log(googleCalendarUUIDs);

	const runCalendar = false as boolean;
	const runEmail = false as boolean;
	const runTableAccount = true as boolean;

	if (runCalendar) {
		await calendarFunction();
	}

	if (runEmail) {
		await emailerFunction();
	}

	if (runTableAccount) {
		await tableAccountFunction();
	}

	process.exit();
})();

async function calendarFunction() {
	const { account } = await getMigrateAccount(conf, 'mdx89');
	await deleteAllGoogleCalendarEvents(account);

	for await (const dbEvent of account.getEvents()) {
		const googleCalendarEventIds = (await updateGoogleCalendars(dbEvent, account)) as [
			string,
			null | string,
			null | string,
			null | string
		];
		dbEvent.googleCalendarIds = {
			mainId: googleCalendarEventIds[0],
			wingId: googleCalendarEventIds[1],
			regId: googleCalendarEventIds[2],
			feeId: googleCalendarEventIds[3]
		};
		await dbEvent.save();
	}
}

async function emailerFunction() {
	const { account } = await getMigrateAccount(conf, 'mdx89');
	const migrateEmailAddresses: string[] = [];
	for await (const dbMember of account.getMembers()) {
		if (dbMember.contact.EMAIL.PRIMARY) {
			migrateEmailAddresses.push(dbMember.contact.EMAIL.PRIMARY);
		}
		if (dbMember.contact.EMAIL.SECONDARY) {
			migrateEmailAddresses.push(dbMember.contact.EMAIL.SECONDARY);
		}
		if (dbMember.contact.EMAIL.EMERGENCY) {
			migrateEmailAddresses.push(dbMember.contact.EMAIL.EMERGENCY);
		}
		if (dbMember.contact.CADETPARENTEMAIL.PRIMARY) {
			migrateEmailAddresses.push(dbMember.contact.CADETPARENTEMAIL.PRIMARY);
		}
		if (dbMember.contact.CADETPARENTEMAIL.SECONDARY) {
			migrateEmailAddresses.push(dbMember.contact.CADETPARENTEMAIL.SECONDARY);
		}
		if (dbMember.contact.CADETPARENTEMAIL.EMERGENCY) {
			migrateEmailAddresses.push(dbMember.contact.CADETPARENTEMAIL.EMERGENCY);
		}
	}
	await sendAnnouncementEmails(migrateEmailAddresses);
}

async function tableAccountFunction() {
	
	const myConnection = mysql.createConnection({
		port: 33389,
		host: 'md089.capunit.com',
		user: 'em',
		password: 'alongpassword2017',
		database: 'EventManagement'
	});
	console.log('Connection options created');
	await new Promise((res, rej) =>
		myConnection.connect(err => {
			if (err) {
				rej(err);
			}
			console.log('Connected!');
			res();
		})
	);

	const tableList: any[] = await new Promise((res, rej) => {
		myConnection.query('SELECT * FROM Accounts WHERE MainOrg = 1;', (err, results) => {
			if (err) {
				rej(err);
			}
 			// console.log(results);
			res(results);
		})
	});

// 	console.log(JSON.stringify(tableList[0]));
	for(const data of tableList) {
		const inRow = JSON.parse(JSON.stringify(data));

		const { schema } = await getMigrateAccount(conf, 'mdx89');
		const v4Collection = schema.getCollection<RawAccountObject>('Accounts');

		const myNewAccount: RawAccountObject = {
			adminIDs: [{ type: 'CAPNHQMember', id: inRow.AdminID }],
			id: inRow.AccountID,
			mainCalendarID: inRow.MainID,
			wingCalendarID: inRow.WingID,
			serviceAccount: "",
			shareLink: inRow.ShareLink,
			embedLink: inRow.EmbedLink,
			initialPassword: inRow.InitialPassword,
			comments: inRow.Comments,
			echelon: false,
			mainOrg: inRow.UnitID,
			orgIDs: [ inRow.UnitID ],
			paid: false,
			expires: 999999999999,
			paidEventLimit: 50,
			unpaidEventLimit: 25,
			aliases: []
		} 

		await v4Collection.add(myNewAccount).execute();

		console.log(inRow.AccountID);
	}

	console.log('end of function');

}

async function sendAnnouncementEmails(inAddresses: string[]) {
	// get list of emails in md089, 890, 007, nc300, 111, va056, admins/interested
	/* const admins = ["john.wilder@vawg.cap.gov", "thallihan@ncwgcap.org", "rhallihan@ncwgcap.org",
		"rthompson@cap.gov", "wlapre@cap.gov", "Henrywaller041@aol.com", "tkdrobert@yahoo.com",
		"pablo.burgos@comcast.net", "arioux.cap@gmail.com", "dennis.villar.cap@gmail.com",
		"davidtrick@msn.com", "larrytrick@msn.com", "cdavis3625@aol.com"]; */
	const fakeAdmins = ['grioux@gmail.com'];
	fakeAdmins.forEach(address => {
		inAddresses.push(address);
	});
	const unique = inAddresses.splice(0, inAddresses.length, ...new Set(inAddresses));

	unique.forEach(async uniqueAddress => {
		await sendAnnouncementEmail(uniqueAddress);
	});
}

async function sendAnnouncementEmail(inEmail: string) {
	// format message and call sendEmail
	const subjectmessage = 'CAPUnit.com v4 is here!';
	let htmlmessage =
		'<h3>We are pleased to announce that CAPUnit.com version 4 is ready to go live!</h3>';
	htmlmessage +=
		'<h3>The new site engine will be put in place on 08 Feb 2020.  As such, the service will ';
	htmlmessage +=
		'be unavailable on 08 Feb, but will be back in operation by 09 Feb.  All event and member ';
	htmlmessage +=
		'data will be migrated to the new system, however, will be required to perform a "Password Reset" using the new site.  As soon as the conversion ';
	htmlmessage +=
		'to the new engine is complete we will send all members with accounts in the current site an email ';
	htmlmessage += 'with instructions and a link to establish their password on the new site.<br>';
	htmlmessage += 'Sincerely,<br>The CAPUnit.com Support Team</h3>';
	let textmessage =
		'We are pleased to announce that CAPUnit.com version 4 is ready to go live!\n';
	textmessage += '';

	await sendEmail(inEmail, subjectmessage, htmlmessage, textmessage);
}

async function sendEmail(inEmail: string, inSubject: string, inHtml: string, inText: string) {
	// send email here
	aws.config.update({ region: 'us-east-1' });
	const charsetinuse = 'UTF-8';

	const emailParams = {
		Destination: {
			BccAddresses: [inEmail],
			// 	CcAddresses: [''],
			ToAddresses: ['']
		},
		Message: {
			Body: {
				Html: { Charset: charsetinuse, Data: inHtml },
				Text: { Charset: charsetinuse, Data: inText }
			},
			Subject: { Charset: charsetinuse, Data: inSubject }
		},
		Source: '"CAPUnit.com Support" <support@capunit.com>',
		ReplyToAddresses: ['"CAPUnit.com Support" <support@capunit.com>']
	};
	const SEShandle = new aws.SES({ apiVersion: '2010-12-01' });

	// https://{account.id}.capunit.com/finishaccount/{token}
	try {
		const sendPromise = await SEShandle.sendEmail(emailParams).promise();
		if (!!sendPromise.$response.error) {
			throw sendPromise.$response.error;
		}
	} catch (e) {
		// need to log failed attempt with req.body.capid and req.body.email here
		return left({
			code: 500,
			error: just(e),
			message: 'Email failed to send'
		});
	}
}
