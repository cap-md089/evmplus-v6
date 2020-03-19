// import { DateTime } from 'luxon';
// import { Configuration } from '../conf';
import {
	EventStatus,
	formatGoogleCalendarDate,
	isOneOfSelected,
	RawAccountObject,
	RawEventObject
} from 'common-lib';
import { calendar_v3, google } from 'googleapis';
import { v4 as uuid } from 'uuid';
import { Configuration as config } from '../conf';
import { Account, presentMultCheckboxReturn } from './internals';

// 99999999  these five arrays need to go to a common area between client and server
export const Uniforms = [
	'Dress Blue A',
	'Dress Blue B',
	'Battle Dress Uniform or Airman Battle Uniform (BDU/ABU)',
	'PT Gear',
	'Polo Shirts (Senior Members)',
	'Blue Utilities (Senior Members)',
	'Civilian Attire',
	'Flight Suit',
	'Not Applicable'
];
export const Activities = [
	'Squadron Meeting',
	'Classroom/Tour/Light',
	'Backcountry',
	'Flying',
	'Physically Rigorous',
	'Recurring Meeting'
];
export const RequiredForms = [
	'CAP Identification Card',
	'CAPF 31 Application For CAP Encampment Or Special Activity',
	'CAPF 60-80 Civil Air Patrol Cadet Activity Permission Slip',
	'CAPF 101 Specialty Qualification Card',
	'CAPF 160 CAP Member Health History Form',
	'CAPF 161 Emergency Information',
	'CAPF 163 Permission For Provision Of Minor Cadet Over-The-Counter Medication'
];
export const Meals = ['No meals provided', 'Meals provided', 'Bring own food', 'Bring money'];
export const LodgingArrangments = [
	'Hotel or individual room',
	'Open bay building',
	'Large tent',
	'Individual tent'
];

function buildEventDescription(inEvent: RawEventObject): string {
	// set status message
	let status = 'invalid.  Please contact support@capunit.com to report this.';
	if (inEvent.status === EventStatus.TENTATIVE) {
		status =
			'TENTATIVELY planned.  Please contact the POC directly BEFORE traveling to the event.';
	} else if (inEvent.status === EventStatus.CANCELLED) {
		status = 'CANCELLED!';
	} else if (inEvent.status === EventStatus.CONFIRMED) {
		status = 'CONFIRMED that it is planned as described here.';
	} else if (inEvent.status === EventStatus.COMPLETE) {
		status = 'marked as complete.';
	} else if (inEvent.status === EventStatus.INFORMATIONONLY) {
		status =
			'marked as INFORMATION ONLY.  This unit is not planning to support the event with CAP adult supervision.';
	}
	// first block
	let description =
		'<---->Please contact the POC listed below directly with questions or comments.\n\n';
	description +=
		'<---->Event Information Link\n(Page includes event information, POC contact information, and applicable download links):\n';
	description +=
		'https://' + inEvent.accountID + '.capunit.com/eventviewer/' + inEvent.id + '/\n\n';
	description += '<---->Status\nThis event is ' + status + '\n\n';
	// second block
	description += '<---->Times and Location(s)\n';
	description +=
		'--Meet at ' +
		formatGoogleCalendarDate(inEvent.meetDateTime) +
		' at ' +
		inEvent.meetLocation +
		'\n';
	description +=
		'--Start at ' +
		formatGoogleCalendarDate(inEvent.startDateTime) +
		' at ' +
		inEvent.location +
		'\n';
	description += '--End at ' + formatGoogleCalendarDate(inEvent.endDateTime) + '\n';
	description +=
		'--Pickup at ' +
		formatGoogleCalendarDate(inEvent.pickupDateTime) +
		' at ' +
		inEvent.pickupLocation +
		'\n\n';
	// third block
	description += '<---->Logistics\n';
	description +=
		'--Transportation Provided: ' +
		(inEvent.transportationProvided === true ? 'YES' : 'NO') +
		'\n';
	description += '--Uniform: ' + presentMultCheckboxReturn(inEvent.uniform) + '\n';
	description += '--Activity: ' + presentMultCheckboxReturn(inEvent.activity) + '\n';
	const showForms = isOneOfSelected(inEvent.requiredForms);
	if (showForms === true) {
		description +=
			'--Required forms: ' + presentMultCheckboxReturn(inEvent.requiredForms) + '\n';
	}
	const showLodging = isOneOfSelected(inEvent.lodgingArrangments);
	if (showLodging === true) {
		description += '--Lodging: ' + presentMultCheckboxReturn(inEvent.lodgingArrangments) + '\n';
	}
	if (inEvent.requiredEquipment.length > 0) {
		description += '--Required equipment: ' + inEvent.requiredEquipment + '\n';
	}
	if (!!inEvent.registration) {
		description +=
			'--Registration deadline: ' +
			formatGoogleCalendarDate(inEvent.registration.deadline) +
			'\n';
		description += '--Registration information: ' + inEvent.registration.information + '\n';
	}
	if (!!inEvent.participationFee) {
		description += '--Participation fee: ' + inEvent.participationFee.feeAmount + '\n';
		description +=
			'--Participation fee due: ' +
			formatGoogleCalendarDate(inEvent.participationFee.feeDue) +
			'\n';
	}
	const showMeals = isOneOfSelected(inEvent.mealsDescription);
	if (showMeals === true) {
		description += '--Meals: ' + presentMultCheckboxReturn(inEvent.mealsDescription) + '\n';
	}
	description +=
		'--Desired number of participants: ' + inEvent.desiredNumberOfParticipants + '\n';
	if (inEvent.comments.length > 0) {
		description += '--Comments: ' + inEvent.comments + '\n';
	}

	return description;
}

function buildDeadlineDescription(inEvent: RawEventObject, inStatement: string): string {
	// set status message
	let status = 'invalid.  Please contact support@capunit.com to report this.';
	if (inEvent.status === EventStatus.TENTATIVE) {
		status =
			'TENTATIVELY planned.  Please contact the POC directly BEFORE traveling to the event.';
	} else if (inEvent.status === EventStatus.CANCELLED) {
		status = 'CANCELLED!';
	} else if (inEvent.status === EventStatus.CONFIRMED) {
		status = 'CONFIRMED that it is planned as described here.';
	} else if (inEvent.status === EventStatus.COMPLETE) {
		status = 'marked as complete.';
	} else if (inEvent.status === EventStatus.INFORMATIONONLY) {
		status =
			'marked as INFORMATION ONLY.  This unit is not planning to support the event with CAP adult supervision.';
	}
	// first block
	let description = '<---->' + inStatement;
	description +=
		'<---->Please contact the POC listed in the event link directly with questions or comments.\n\n';
	description +=
		'<---->Event Information Link\n(Page includes event information, POC contact information, and applicable download links):\n';
	description +=
		'https://' + inEvent.accountID + '.capunit.com/eventviewer/' + inEvent.id + '/\n\n';
	description += '<---->Status\nThe parent event is ' + status + '\n\n';

	return description;
}

export async function createGoogleCalendarEvents(inEvent: RawEventObject, inAccount: Account) {
	const privatekey = require(config.googleKeysPath + '/' + inAccount.id + '.json');
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar']
	);
	// authenticate request
	const myReg = await inAccount.getRegistry();
	await jwtClient.authorize();
	const myCalendar = google.calendar({ version: 'v3' });

	return Promise.all([
		updateMainEvent(myCalendar, jwtClient, inEvent, inAccount.mainCalendarID, true),
		inEvent.publishToWingCalendar
			? updateWingEvent(
					myCalendar,
					jwtClient,
					inEvent,
					inAccount.wingCalendarID,
					myReg.values.Website.Name
			  )
			: null,
		typeof inEvent.registration !== 'undefined'
			? updateRegEvent(myCalendar, jwtClient, inEvent, inAccount.mainCalendarID)
			: null,
		typeof inEvent.participationFee !== 'undefined'
			? updateFeeEvent(myCalendar, jwtClient, inEvent, inAccount.mainCalendarID)
			: null
	]);
}

export default async function updateGoogleCalendars(inEvent: RawEventObject, inAccount: Account) {
	const privatekey = require(config.googleKeysPath + '/' + inAccount.id + '.json');
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar']
	);
	// authenticate request
	const myReg = await inAccount.getRegistry();
	await jwtClient.authorize();
	const myCalendar = google.calendar('v3');

	// 999999999 is there a guarantee that the function return values will always be in the same order???
	return Promise.all([
		updateMainEvent(myCalendar, jwtClient, inEvent, inAccount.mainCalendarID, false),
		updateWingEvent(
			myCalendar,
			jwtClient,
			inEvent,
			inAccount.wingCalendarID,
			myReg.values.Website.Name
		),
		updateRegEvent(myCalendar, jwtClient, inEvent, inAccount.mainCalendarID),
		updateFeeEvent(myCalendar, jwtClient, inEvent, inAccount.mainCalendarID)
	]);
}

export async function removeGoogleCalendarEvents(
	inEvent: RawEventObject,
	inAccount: RawAccountObject
) {
	const privatekey = require(config.googleKeysPath + '/' + inAccount.id + '.json');
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar']
	);
	// authenticate request
	await jwtClient.authorize();
	const myCalendar = google.calendar('v3');

	// 999999999 need to catch the deleteCalendarEvents return error and provide notification
	await deleteCalendarEvents(myCalendar, jwtClient, inEvent, [
		inAccount.mainCalendarID,
		inAccount.wingCalendarID
	]);
}

export async function deleteAllGoogleCalendarEvents(inAccount: Account) {
	const privatekey = require(config.googleKeysPath + '/' + inAccount.id + '.json');
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar']
	);
	// authenticate request
	await jwtClient.authorize();
	const myCalendar = google.calendar('v3');

	const listResponse = await myCalendar.events.list({
		auth: jwtClient,
		calendarId: inAccount.mainCalendarID
	});
	const events = listResponse?.data.items;
	if (events?.length) {
		for (const event of events) {
			await myCalendar.events.delete({
				auth: jwtClient,
				calendarId: inAccount.mainCalendarID,
				eventId: event.id as string
			});

			await new Promise(res => {
				setTimeout(res, 500);
			});
		}
	}
	const listWingResponse = await myCalendar.events.list({
		auth: jwtClient,
		calendarId: inAccount.wingCalendarID
	});
	const wingevents = listWingResponse?.data.items;
	if (wingevents?.length) {
		for (const event of wingevents) {
			await myCalendar.events.delete({
				auth: jwtClient,
				calendarId: inAccount.wingCalendarID,
				eventId: event.id as string
			});

			await new Promise(res => {
				setTimeout(res, 500);
			});
		}
	}

	// const clearMainResponse = await myCalendar.calendars.clear ({
	// 	auth: jwtClient,
	// 	calendarId: inAccount.mainCalendarID
	// });

	// const clearWingResponse = await myCalendar.calendars.clear ({
	// 	auth: jwtClient,
	// 	calendarId: inAccount.wingCalendarID
	// });
}

type JWTClient = InstanceType<typeof google.auth.JWT>;

async function deleteCalendarEvent(
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	eventUUID: string,
	id: string
) {
	if (eventUUID.length > 0) {
		let deleteResponse;
		try {
			deleteResponse = await myCalendar.events.delete({
				auth: jwtClient,
				calendarId: id,
				eventId: eventUUID
			});
		} catch (error) {
			// 		console.log("delete event error: " + eventUUID);  9999999999 this shouldn't happen.  Should probably log
			// 			this occurrence so that leaks can be plugged.
			return error;
		}
		if (typeof deleteResponse !== 'undefined') {
			if (deleteResponse.status === 200) {
				// 			console.log('Response status ' + deleteResponse.statusText); // 99999999 need to look at possible responses and catch errors
				return 'Success';
			} else {
				return 'Error';
			}
		} else {
			console.log('Delete response undefined');
			return 'Undefined delete response';
		}
	}
}

async function deleteCalendarEvents(
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawEventObject,
	ids: string[]
) {
	let errorFlag = false;
	if (!!inEvent.googleCalendarIds.mainId && inEvent.googleCalendarIds.mainId.length > 0) {
		if (
			(await deleteCalendarEvent(
				myCalendar,
				jwtClient,
				inEvent.googleCalendarIds.mainId,
				ids[0]
			)) !== 'Success'
		) {
			errorFlag = true;
		}
	}
	if (!!inEvent.googleCalendarIds.wingId && inEvent.googleCalendarIds.wingId.length > 0) {
		if (
			(await deleteCalendarEvent(
				myCalendar,
				jwtClient,
				inEvent.googleCalendarIds.wingId,
				ids[1]
			)) !== 'Success'
		) {
			errorFlag = true;
		}
	}
	if (!!inEvent.googleCalendarIds.regId && inEvent.googleCalendarIds.regId.length > 0) {
		if (
			(await deleteCalendarEvent(
				myCalendar,
				jwtClient,
				inEvent.googleCalendarIds.regId,
				ids[0]
			)) !== 'Success'
		) {
			errorFlag = true;
		}
	}
	if (!!inEvent.googleCalendarIds.feeId && inEvent.googleCalendarIds.feeId.length > 0) {
		if (
			(await deleteCalendarEvent(
				myCalendar,
				jwtClient,
				inEvent.googleCalendarIds.feeId,
				ids[0]
			)) !== 'Success'
		) {
			errorFlag = true;
		}
	}
	return errorFlag;
}

function getEventColor(inStatus: EventStatus) {
	let eventColor = 9;
	switch (inStatus) {
		case EventStatus.CANCELLED:
			eventColor = 11;
			break;
		case EventStatus.DRAFT:
			eventColor = 5;
			break;
		case EventStatus.TENTATIVE:
			eventColor = 7;
			break;
		case EventStatus.INFORMATIONONLY:
			eventColor = 1;
			break;
	}
	return eventColor;
}

function buildEvent(inEvent: RawEventObject) {
	const uniqueId = uuid().replace(/-/g, '');
	let eventColor = getEventColor(inEvent.status);
	if (inEvent.teamID !== 0) {
		eventColor = 10;
	}
	const event = {
		summary: inEvent.name,
		location: inEvent.meetLocation,
		description: buildEventDescription(inEvent),
		colorId: eventColor.toString(),
		start: {
			dateTime: new Date(inEvent.meetDateTime).toISOString(),
			timeZone: 'America/New_York'
		},
		end: {
			dateTime: new Date(inEvent.pickupDateTime).toISOString(),
			timeZone: 'America/New_York'
		},
		id: uniqueId
	};
	return event;
}

function buildDeadline(inEvent: RawEventObject, inDate: number, inString: string) {
	const uniqueId = uuid().replace(/-/g, '');
	let eventColor = getEventColor(inEvent.status);
	if (inEvent.teamID !== 0) {
		eventColor = 10;
	}
	const startDate = new Date(inDate).toISOString();
	const endDate = new Date(inDate + 60 * 1000).toISOString();
	const event = {
		summary: inEvent.name,
		location: inEvent.meetLocation,
		description: buildDeadlineDescription(inEvent, inString),
		colorId: eventColor.toString(),
		start: {
			dateTime: startDate,
			timeZone: 'America/New_York'
		},
		end: {
			dateTime: endDate,
			timeZone: 'America/New_York'
		},
		id: uniqueId
	};
	return event;
}

async function updateFeeEvent(
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawEventObject,
	googleId: string
) {
	let response = { status: 200 };
	if (inEvent.participationFee !== null) {
		const deadlineNumber = inEvent.participationFee.feeDue
			? inEvent.participationFee.feeDue
			: 0;
		const deadlineInfo: number = !!inEvent.participationFee
			? inEvent.participationFee.feeAmount
			: 0;
		const deadlineString =
			'This is a fee deadline for event ' +
			inEvent.accountID +
			'-' +
			inEvent.id +
			'\n' +
			(deadlineInfo > 0 ? 'The fee amount is $' + deadlineInfo.toFixed(2) + '\n\n' : '\n');
		const event = buildDeadline(inEvent, deadlineNumber, deadlineString);
		if (inEvent.googleCalendarIds.feeId === null) {
			response = await myCalendar.events.insert({
				auth: jwtClient,
				calendarId: googleId,
				requestBody: event
			});
		} else {
			const inEventId = inEvent.googleCalendarIds.feeId as string;
			event.id = inEventId;
			response = await myCalendar.events.patch({
				auth: jwtClient,
				calendarId: googleId,
				eventId: inEventId,
				requestBody: event
			});
		}

		if (typeof response !== 'undefined') {
			if (response.status === 200) {
				// 			console.log('Response status ' + response.statusText); // 99999999 need to look at possible responses and catch errors
			}
		} else {
			console.log('Response undefined');
		}
		return event.id;
	} else if (inEvent.googleCalendarIds.feeId !== null) {
		response = await myCalendar.events.delete({
			auth: jwtClient,
			calendarId: googleId,
			eventId: inEvent.googleCalendarIds.feeId
		});
		return null;
	} else {
		return null;
	}
}

async function updateRegEvent(
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawEventObject,
	googleId: string
) {
	let response = { status: 200 };
	if (inEvent.registration !== null) {
		const deadlineNumber = !!inEvent.registration ? inEvent.registration.deadline : 0;
		const deadlineInfo: string = !!inEvent.registration ? inEvent.registration.information : '';
		const deadlineString =
			'This is a registration deadline for event ' +
			inEvent.accountID +
			'-' +
			inEvent.id +
			'\n' +
			(deadlineInfo.length > 0 ? deadlineInfo + '\n\n' : '\n');
		const event = buildDeadline(inEvent, deadlineNumber, deadlineString);
		if (inEvent.googleCalendarIds.regId === null) {
			response = await myCalendar.events.insert({
				auth: jwtClient,
				calendarId: googleId,
				requestBody: event
			});
		} else {
			const inEventId = inEvent.googleCalendarIds.regId as string;
			event.id = inEventId;
			response = await myCalendar.events.patch({
				auth: jwtClient,
				calendarId: googleId,
				eventId: inEventId,
				requestBody: event
			});
		}

		if (typeof response !== 'undefined') {
			if (response.status === 200) {
				// 			console.log('Response status ' + response.statusText); // 99999999 need to look at possible responses and catch errors
			}
		} else {
			console.log('Response undefined');
		}
		return event.id;
	} else if (inEvent.googleCalendarIds.regId !== null) {
		response = await myCalendar.events.delete({
			auth: jwtClient,
			calendarId: googleId,
			eventId: inEvent.googleCalendarIds.regId
		});
		return null;
	} else {
		return null;
	}
}

async function updateMainEvent(
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawEventObject,
	googleId: string,
	newEvent: boolean
) {
	const event = buildEvent(inEvent);
	let response = { status: 200 };
	if (newEvent === true) {
		response = await myCalendar.events.insert({
			auth: jwtClient,
			calendarId: googleId,
			requestBody: event
		});
	} else {
		const inEventId = inEvent.googleCalendarIds.mainId;
		event.id = inEventId;
		response = await myCalendar.events.patch({
			auth: jwtClient,
			calendarId: googleId,
			eventId: inEventId,
			requestBody: event
		});
	}

	if (typeof response !== 'undefined') {
		if (response.status === 200) {
			// 			console.log('Response status ' + response.statusText); // 99999999 need to look at possible responses and catch errors
		}
	} else {
		console.log('Response undefined');
	}
	return event.id;
}

async function updateWingEvent(
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawEventObject,
	googleId: string,
	accountName: string
) {
	let response = { status: 200 };
	if (inEvent.publishToWingCalendar) {
		const event = buildEvent(inEvent);
		event.description = 'A ' + accountName + ' Event\n\n' + event.description;

		if (inEvent.googleCalendarIds.wingId === null) {
			response = await myCalendar.events.insert({
				auth: jwtClient,
				calendarId: googleId,
				requestBody: event
			});
		} else {
			const inEventId = inEvent.googleCalendarIds.wingId as string;
			event.id = inEventId;
			response = await myCalendar.events.patch({
				auth: jwtClient,
				calendarId: googleId,
				eventId: inEventId,
				requestBody: event
			});
		}

		if (typeof response !== 'undefined') {
			if (response.status === 200) {
				// 			console.log('Response status ' + response.statusText); // 99999999 need to look at possible responses and catch errors
			}
		} else {
			console.log('Response undefined');
			response = { status: 0 };
		}
		return event.id;
	} else if (inEvent.googleCalendarIds.wingId !== null) {
		response = await myCalendar.events.delete({
			auth: jwtClient,
			calendarId: googleId,
			eventId: inEvent.googleCalendarIds.wingId
		});
		return null;
	} else {
		return null;
	}
}

// export default async function updateCalendarEvent(inEvent: NewEventObject) {
// 	const privatekey = require('/home/grioux/typescript-capunit/server/src/lib/googleapi-key.json');
// 	const jwtClient = new google.auth.JWT(
// 		privatekey.client_email,
// 		undefined,
// 		privatekey.private_key,
// 		[
// 			'https://www.googleapis.com/auth/spreadsheets',
// 			'https://www.googleapis.com/auth/drive',
// 			'https://www.googleapis.com/auth/calendar'
// 		]
// 	);
// 	// authenticate request
// 	const tokens = await jwtClient.authorize();

// 	console.log('Successfully connected!');
// 	console.log('Tokens:', tokens);

// 	/*
// 	// Google Sheets API
// 	const mySpreadsheetId = '1PHxLX6BKNeljggx9EUVtsNQJJFhEeVuoAiNK_15te4s';
// 	const sheetName = 'Sheet1!D4:D7';
// 	const sheets = google.sheets('v4');
// 	const response = await sheets.spreadsheets.values.get({
// 		auth: jwtClient,
// 		spreadsheetId: mySpreadsheetId,
// 		range: sheetName
// 	});

// 	console.log('Spec list from Google Sheets:');
// 	if (!!response?.data?.values) {
// 		// tslint:disable-next-line: prefer-const
// 		for (let row of response.data.values) {
// 			console.log('Spec [%s]', row[0]);
// 		}
// 	} else {
// 		console.log('Spec list response null');
// 	}
// */

// 	/*
// // Google Drive API
// const drive = google.drive('v3');
// drive.files.list({
//    auth: jwtClient,
//    q: "name contains 'USNTPS'"
// }, (err, response) => {
//    if (err) {
//        console.log('The API returned an error: ' + err);
//        return;
//    }
//    if(typeof response !== 'undefined' && !!response) {
// 	   const files = response.data.files;
// 	   if(typeof files !== 'undefined') {
// 		   if (files.length === 0) {
// 		       console.log('No files found.');
// 		   } else {
// 		       console.log('Files from Google Drive:');
// 		       // tslint:disable-next-line: prefer-for-of
// 		       for (let i = 0; i < files.length; i++) {
// 		           // tslint:disable-next-line: prefer-const
// 		           let file = files[i];
// 		           console.log('%s (%s)', file.name, file.id);
// 		       }
// 		   }
// 		} else {
// 			console.log('typeof files undefined');
// 		}
// 	} else {
// 		console.log('Empty Drive API response');
// 	}
// });
// */

// 	// Google Calendar API
// 	const calendar = google.calendar('v3');

// 	const uniqueId = uuid().replace(/-/g,'');
// 	console.log('UUID: ', uniqueId);
// 	const event = {
// 		'summary': 'Event test',
// 		'location': 'Civil Air Patrol St. Mary\'s Composite Squadron',
// 		'description': 'This will be the extensive description of the event',
// 		'colorId': '11',
// 		'start': {
// 			'dateTime': '2020-01-31T15:00:00',
// 			'timeZone': 'America/New_York'
// 		},
// 		'end': {
// 			'dateTime': '2020-01-31T15:45:00',
// 			'timeZone': 'America/New_York'
// 		},
// 		'id': uniqueId
// 	}
// 	console.log('auth: ', jwtClient);

// 	const response = await calendar.events.insert({
// 		auth: jwtClient,
// 		calendarId: 'grioux@gmail.com',
// 		requestBody: event
// 	});
// 	console.log('requestBody: ', event);

// 	if(typeof response !== 'undefined') {
// 		console.log('Response: ', response);
// 		if(response.status === 200) {
// 			console.log('Response status ' + response.statusText);  // 99999999 need to look at possible responses and catch errors
// 		}
// 	} else {
// 		console.log('Response undefined');
// 	}

// 	const myEvent = await calendar.events.get({
// 		auth: jwtClient,
// 		calendarId: 'grioux@gmail.com',
// 		eventId: uniqueId
// 	});
// 	console.log('Retrieved event: ', myEvent.data);

// /*
// 	const response = await calendar.events.list({
// 		auth: jwtClient,
// 		calendarId: 'grioux@gmail.com'
// 	});
// 	if (!!response) {
// 		const events = response.data.items;
// 		if (typeof events !== 'undefined') {
// 			if (events.length === 0) {
// 				console.log('No events found.');
// 			} else {
// 				console.log('Event from Google Calendar:');
// 				if (
// 					typeof response !== 'undefined' &&
// 					!!response &&
// 					typeof response.data.items !== 'undefined'
// 				) {
// 					let counter = 0;
// 					for (const event of response.data.items) {
// 						if (
// 							typeof event.creator !== 'undefined' &&
// 							typeof event.start !== 'undefined'
// 						) {
// 							console.log(
// 								'Event name: %s, Creator name: %s, Create date: %s',
// 								event.summary,
// 								event.creator.displayName,
// 								event.start.date
// 							);
// 						} else {
// 							console.log('Event name: %s', event.summary);
// 						}
// 						counter += 1;
// 						if(counter > 2) { break }
// 					}
// 				} else {
// 					console.log('calendar response undefined');
// 				}
// 			}
// 		} else {
// 			console.log('typeof events undefined');
// 		}
// 	} else {
// 		console.log('Calendar response null');
// 	}
// 	*/

// 	return 'The end';
// }
// */
