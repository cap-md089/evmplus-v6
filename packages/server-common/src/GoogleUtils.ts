/**
 * Copyright (C) 2020 Andrew Rioux, Glenn Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Schema } from '@mysql/xdevapi';
import {
	AccountObject,
	EventStatus,
	isOneOfSelected,
	Maybe,
	presentMultCheckboxReturn,
	RawEventObject,
	RegistryValues,
	ServerConfiguration,
	Timezone,
} from 'common-lib';
import { calendar_v3, google } from 'googleapis';
import { v4 as uuid } from 'uuid';
import { getRegistryById } from './Registry';

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
	'Not Applicable',
];
export const Activities = [
	'Squadron Meeting',
	'Classroom/Tour/Light',
	'Backcountry',
	'Flying',
	'Physically Rigorous',
	'Recurring Meeting',
];
export const RequiredForms = [
	'CAP Identification Card',
	'CAPF 31 Application For CAP Encampment Or Special Activity',
	'CAPF 60-80 Civil Air Patrol Cadet Activity Permission Slip',
	'CAPF 101 Specialty Qualification Card',
	'CAPF 160 CAP Member Health History Form',
	'CAPF 161 Emergency Information',
	'CAPF 163 Permission For Provision Of Minor Cadet Over-The-Counter Medication',
];
export const Meals = ['No meals provided', 'Meals provided', 'Bring own food', 'Bring money'];
export const LodgingArrangments = [
	'Hotel or individual room',
	'Open bay building',
	'Large tent',
	'Individual tent',
];

function buildEventDescription(
	config: ServerConfiguration,
	registry: RegistryValues,
	inEvent: RawEventObject,
): string {
	const dateFormatter = formatGoogleCalendarDate(registry);

	// set status message
	let status = 'invalid.  Please contact support@evmplus.org to report this.';
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

	const orBlank = Maybe.orSome('');

	// first block
	let description =
		'<---->Event Information Link\n(Page includes event information, POC contact information, and applicable download links):\n';
	description += `https://${inEvent.accountID}.${config.HOST_NAME}/eventviewer/${inEvent.id}/\n\n`;
	description += '<---->Status\nThis event is ' + status + '\n\n';
	// second block
	description += '<---->Times and Location(s)\n';
	description +=
		'--Meet at ' + dateFormatter(inEvent.meetDateTime) + ' at ' + inEvent.meetLocation + '\n';
	description +=
		'--Start at ' + dateFormatter(inEvent.startDateTime) + ' at ' + inEvent.location + '\n';
	description += '--End at ' + dateFormatter(inEvent.endDateTime) + '\n';
	description +=
		'--Pickup at ' +
		dateFormatter(inEvent.pickupDateTime) +
		' at ' +
		inEvent.pickupLocation +
		'\n\n';
	// third block
	description += '<---->Logistics\n';
	description +=
		'--Transportation Provided: ' +
		(inEvent.transportationProvided === true ? 'YES' : 'NO') +
		'\n';
	description += '--Uniform: ' + orBlank(presentMultCheckboxReturn(inEvent.uniform)) + '\n';
	description += '--Activity: ' + orBlank(presentMultCheckboxReturn(inEvent.activity)) + '\n';
	const showForms = isOneOfSelected(inEvent.requiredForms);
	if (showForms === true) {
		description +=
			'--Required forms: ' + orBlank(presentMultCheckboxReturn(inEvent.requiredForms)) + '\n';
	}
	const showLodging = isOneOfSelected(inEvent.lodgingArrangments);
	if (showLodging === true) {
		description +=
			'--Lodging: ' + orBlank(presentMultCheckboxReturn(inEvent.lodgingArrangments)) + '\n';
	}
	if (inEvent.requiredEquipment.length > 0) {
		description += '--Required equipment: ' + inEvent.requiredEquipment + '\n';
	}
	if (!!inEvent.registration) {
		description +=
			'--Registration deadline: ' + dateFormatter(inEvent.registration.deadline) + '\n';
		description += '--Registration information: ' + inEvent.registration.information + '\n';
	}
	if (!!inEvent.participationFee) {
		description += '--Participation fee: ' + inEvent.participationFee.feeAmount + '\n';
		description +=
			'--Participation fee due: ' + dateFormatter(inEvent.participationFee.feeDue) + '\n';
	}
	const showMeals = isOneOfSelected(inEvent.mealsDescription);
	if (showMeals === true) {
		description +=
			'--Meals: ' + orBlank(presentMultCheckboxReturn(inEvent.mealsDescription)) + '\n';
	}
	description +=
		'--Desired number of participants: ' + inEvent.desiredNumberOfParticipants + '\n';
	if (inEvent.comments.length > 0) {
		description += '--Comments: ' + inEvent.comments + '\n';
	}
	if (inEvent.eventWebsite.length > 0) {
		description += '--Website: ' + inEvent.eventWebsite + '\n';
	}

	return description;
}

const getDateFormatter = (timeZone: Timezone) =>
	new Intl.DateTimeFormat('en-US', {
		timeZone,
		timeZoneName: 'short',
		hour: 'numeric',
		minute: 'numeric',
		day: 'numeric',
		month: 'numeric',
		year: 'numeric',
	});

const formatGoogleCalendarDate = (registry: RegistryValues) => (indate: number): string =>
	getDateFormatter(registry.Website.Timezone).format(new Date(indate));

function buildDeadlineDescription(
	config: ServerConfiguration,
	inEvent: RawEventObject,
	inStatement: string,
): string {
	// set status message
	let status = `invalid.  Please contact support@evmplus.org to report this.`;
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
		'<---->Event Information Link\n(Page includes event information, POC contact information, and applicable download links):\n';
	description += `https://${inEvent.accountID}.${config.HOST_NAME}/eventviewer/${inEvent.id}/\n\n`;
	description += '<---->Status\nThe parent event is ' + status + '\n\n';

	return description;
}

export async function createGoogleCalendar(
	accountID: string,
	name: string,
	config: ServerConfiguration,
) {
	const privateKey = require(config.GOOGLE_KEYS_PATH + '/md089.json');
	const jwtClient = new google.auth.JWT(
		privateKey.client_email,
		undefined,
		privateKey.private_key,
		['https://www.googleapis.com/auth/calendar'],
	);

	await jwtClient.authorize();

	const calendar = google.calendar({ version: 'v3' });

	const requestBody = {
		summary: name,
	};

	const newCalendar = await calendar.calendars.insert({
		requestBody,
		auth: jwtClient,
	});

	if (!newCalendar.data.id) {
		throw new Error('Could not create new calendar');
	}

	await calendar.acl.insert({
		auth: jwtClient,
		requestBody: {
			role: 'reader',
			scope: {
				type: 'default',
			},
		},
		calendarId: newCalendar.data.id,
	});

	return newCalendar.data.id;
}

export async function createGoogleCalendarForEvent(
	newEventName: string,
	newAccountName: string,
	accountID: string,
	config: ServerConfiguration,
) {
	const name = `${newAccountName} - ${newEventName}`;

	return createGoogleCalendar(accountID, name, config);
}

export async function createGoogleCalendarEvents(
	schema: Schema,
	inEvent: RawEventObject,
	inAccount: AccountObject,
	config: ServerConfiguration,
): Promise<[string | null, string | null, string | null]> {
	const privatekey = require(config.GOOGLE_KEYS_PATH + '/' + inAccount.id + '.json');
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar'],
	);
	// authenticate request
	await jwtClient.authorize();
	const myCalendar = google.calendar({ version: 'v3' });

	if (inEvent.status === EventStatus.DRAFT) {
		return [null, null, null];
	}

	const registry = await getRegistryById(schema)(inAccount.id).fullJoin();

	return Promise.all([
		updateMainEvent(config, myCalendar, jwtClient, inEvent, inAccount.mainCalendarID, registry),
		typeof inEvent.registration !== 'undefined'
			? updateRegEvent(config, myCalendar, jwtClient, inEvent, inAccount.mainCalendarID)
			: null,
		typeof inEvent.participationFee !== 'undefined'
			? updateFeeEvent(config, myCalendar, jwtClient, inEvent, inAccount.mainCalendarID)
			: null,
	]) as Promise<[string, string | null, string | null]>;
}

export default async function updateGoogleCalendars(
	schema: Schema,
	inEvent: RawEventObject,
	inAccount: AccountObject,
	config: ServerConfiguration,
) {
	const privatekey = require(config.GOOGLE_KEYS_PATH + '/' + inAccount.id + '.json');
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar'],
	);
	// authenticate request
	await jwtClient.authorize();
	const myCalendar = google.calendar('v3');

	const registry = await getRegistryById(schema)(inAccount.id).fullJoin();

	if (inEvent.status === EventStatus.DRAFT) {
		return [null, null, null];
	}

	// 999999999 is there a guarantee that the function return values will always be in the same order???
	return Promise.all([
		updateMainEvent(config, myCalendar, jwtClient, inEvent, inAccount.mainCalendarID, registry),
		updateRegEvent(config, myCalendar, jwtClient, inEvent, inAccount.mainCalendarID),
		updateFeeEvent(config, myCalendar, jwtClient, inEvent, inAccount.mainCalendarID),
	]) as Promise<[string, string | null, string | null]>;
}

export async function removeGoogleCalendarEvents(
	inEvent: RawEventObject,
	inAccount: AccountObject,
	config: ServerConfiguration,
) {
	const privatekey = require(config.GOOGLE_KEYS_PATH + '/' + inAccount.id + '.json');
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar'],
	);
	// authenticate request
	await jwtClient.authorize();
	const myCalendar = google.calendar('v3');

	// 999999999 need to catch the deleteCalendarEvents return error and provide notification
	await deleteCalendarEvents(myCalendar, jwtClient, inEvent, inAccount.mainCalendarID);
}

export async function deleteAllGoogleCalendarEvents(
	inAccount: AccountObject,
	config: ServerConfiguration,
) {
	const privatekey = require(config.GOOGLE_KEYS_PATH + '/' + inAccount.id + '.json');
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar'],
	);
	// authenticate request
	await jwtClient.authorize();
	const myCalendar = google.calendar('v3');

	console.log(`Deleting events for ${inAccount.mainCalendarID} (${inAccount.id})`);

	let events = (
		await myCalendar.events.list({
			auth: jwtClient,
			calendarId: inAccount.mainCalendarID,
		})
	)?.data.items;
	while (events === null || events === undefined || events.length > 0) {
		if (events !== null && events !== undefined) {
			for (const event of events) {
				await myCalendar.events.delete({
					auth: jwtClient,
					calendarId: inAccount.mainCalendarID,
					eventId: event.id as string,
				});

				await new Promise(res => {
					setTimeout(res, 500);
				});
			}
		} else {
			console.log('Received null list!');
		}
		events = (
			await myCalendar.events.list({
				auth: jwtClient,
				calendarId: inAccount.mainCalendarID,
			})
		)?.data.items;
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
	id: string,
) {
	if (eventUUID.length > 0) {
		let deleteResponse;
		try {
			deleteResponse = await myCalendar.events.delete({
				auth: jwtClient,
				calendarId: id,
				eventId: eventUUID,
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
	ids: string,
) {
	let errorFlag = false;
	if (!!inEvent.googleCalendarIds.mainId && inEvent.googleCalendarIds.mainId.length > 0) {
		if (
			(await deleteCalendarEvent(
				myCalendar,
				jwtClient,
				inEvent.googleCalendarIds.mainId,
				ids[0],
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
				ids[0],
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
				ids[0],
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

function buildEvent(
	config: ServerConfiguration,
	registry: RegistryValues,
	inEvent: RawEventObject,
) {
	const uniqueId = uuid().replace(/-/g, '');
	let eventColor = getEventColor(inEvent.status);
	if (inEvent.teamID !== 0) {
		eventColor = 10;
	}
	const endDateTime = Math.max(inEvent.meetDateTime + 60 * 1000, inEvent.pickupDateTime);
	if (endDateTime !== inEvent.pickupDateTime) {
		console.log(
			`Using different pickup date time (${new Date(endDateTime).toISOString()} vs ${new Date(
				inEvent.pickupDateTime,
			).toISOString()})`,
		);
	}
	const event = {
		summary: inEvent.name,
		location: inEvent.meetLocation,
		description: buildEventDescription(config, registry, inEvent),
		colorId: eventColor.toString(),
		start: {
			dateTime: new Date(inEvent.meetDateTime).toISOString(),
			timeZone: 'America/New_York',
		},
		end: {
			dateTime: new Date(endDateTime).toISOString(),
			timeZone: 'America/New_York',
		},
		id: uniqueId,
	};
	return event;
}

function buildDeadline(
	config: ServerConfiguration,
	inEvent: RawEventObject,
	inDate: number,
	inString: string,
) {
	const uniqueId = uuid().replace(/-/g, '');
	let eventColor = getEventColor(inEvent.status);
	if (inEvent.teamID !== 0) {
		eventColor = 10;
	}
	const startDate = new Date(inDate).toISOString();
	const endDate = new Date(inDate + 60 * 1000).toISOString();
	console.log(startDate);
	console.log(endDate);
	const event = {
		summary: inEvent.name,
		location: inEvent.meetLocation,
		description: buildDeadlineDescription(config, inEvent, inString),
		colorId: eventColor.toString(),
		start: {
			dateTime: startDate,
			timeZone: 'America/New_York',
		},
		end: {
			dateTime: endDate,
			timeZone: 'America/New_York',
		},
		id: uniqueId,
	};
	return event;
}

async function updateFeeEvent(
	config: ServerConfiguration,
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawEventObject,
	googleId: string,
) {
	let response = { status: 200 };
	if (inEvent.participationFee !== null) {
		const deadlineNumber = inEvent.participationFee?.feeDue ?? 0;
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
		const event = buildDeadline(config, inEvent, deadlineNumber, deadlineString);
		if (!!inEvent.googleCalendarIds.feeId) {
			response = await myCalendar.events.insert({
				auth: jwtClient,
				calendarId: googleId,
				requestBody: event,
			});
		} else {
			const inEventId = inEvent.googleCalendarIds.feeId as string;
			event.id = inEventId;
			response = await myCalendar.events.patch({
				auth: jwtClient,
				calendarId: googleId,
				eventId: inEventId,
				requestBody: event,
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
	} else if (!!inEvent.googleCalendarIds.feeId) {
		response = await myCalendar.events.delete({
			auth: jwtClient,
			calendarId: googleId,
			eventId: inEvent.googleCalendarIds.feeId,
		});
		return null;
	} else {
		return null;
	}
}

async function updateRegEvent(
	config: ServerConfiguration,
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawEventObject,
	googleId: string,
) {
	let response = { status: 200 };
	if (!!inEvent.registration) {
		const deadlineNumber = !!inEvent.registration ? inEvent.registration.deadline : 0;
		const deadlineInfo: string = !!inEvent.registration
			? inEvent.registration.information || ''
			: '';
		const deadlineString =
			'This is a registration deadline for event ' +
			inEvent.accountID +
			'-' +
			inEvent.id +
			'\n' +
			(deadlineInfo.length > 0 ? deadlineInfo + '\n\n' : '\n');
		const event = buildDeadline(config, inEvent, deadlineNumber, deadlineString);
		if (!inEvent.googleCalendarIds.regId) {
			response = await myCalendar.events.insert({
				auth: jwtClient,
				calendarId: googleId,
				requestBody: event,
			});
		} else {
			const inEventId = inEvent.googleCalendarIds.regId;
			event.id = inEventId;
			response = await myCalendar.events.patch({
				auth: jwtClient,
				calendarId: googleId,
				eventId: inEventId,
				requestBody: event,
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
	} else if (!!inEvent.googleCalendarIds.regId) {
		response = await myCalendar.events.delete({
			auth: jwtClient,
			calendarId: googleId,
			eventId: inEvent.googleCalendarIds.regId,
		});
		return null;
	} else {
		return null;
	}
}

async function updateMainEvent(
	config: ServerConfiguration,
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawEventObject,
	googleId: string,
	registry: RegistryValues,
) {
	const event = buildEvent(config, registry, inEvent);
	let response = { status: 200 };

	if (!inEvent.googleCalendarIds.mainId) {
		response = await myCalendar.events.insert({
			auth: jwtClient,
			calendarId: googleId,
			requestBody: event,
		});
	} else {
		try {
			const inEventId = inEvent.googleCalendarIds.mainId;
			event.id = inEventId;
			response = await myCalendar.events.patch({
				auth: jwtClient,
				calendarId: googleId,
				eventId: inEventId,
				requestBody: event,
			});
		} catch (e) {
			console.error(e);

			if (e.code === 404) {
				const { id, ...rest } = event;

				response = await myCalendar.events.insert({
					auth: jwtClient,
					calendarId: googleId,
					requestBody: rest,
				});
			}
		}
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
