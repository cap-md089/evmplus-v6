/**
 * Copyright (C) 2020 Andrew Rioux, Glenn Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ServerEither } from 'auto-client-api';
import {
	AccountObject,
	destroy,
	EventStatus,
	isOneOfSelected,
	Maybe,
	presentMultCheckboxReturn,
	RawEventObject,
	RawRegularEventObject,
	RawResolvedEventObject,
	RegistryValues,
	Timezone,
} from 'common-lib';
import { calendar_v3, google } from 'googleapis';
import { markdown } from 'markdown';
import { v4 as uuid } from 'uuid';
import { AccountBackend, BasicAccountRequest } from '.';
import { Backends, notImplementedError } from './backends';
import { RegistryBackend } from './Registry';

export interface GoogleConfiguration {
	GOOGLE_KEYS_PATH: string;
	HOST_NAME: string;
	NODE_ENV: string;
}

// 99999999  these six arrays need to go to a common area between client and server
export const SMUniforms = [
	'Dress Blue A',
	'Dress Blue B',
	'Airman Battle Uniform (ABU) or Operational Camouflage Pattern (OCP)',
	'PT Gear',
	'Polo Shirts',
	'Blue Utilities',
	'Civilian Attire',
	'Flight Suit',
	'Not Applicable',
];
export const CUniforms = [
	'Dress Blue A',
	'Dress Blue B',
	'Airman Battle Uniform (ABU) or Operational Camouflage Pattern (OCP)',
	'PT Gear',
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
	config: GoogleConfiguration,
	registry: RegistryValues,
	inEvent: RawResolvedEventObject,
): string {
	const dateFormatter = formatGoogleCalendarDate(registry);

	// set status message
	let status = 'invalid.  Please contact eventsupport@md.cap.gov to report this.';
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
	let description = `<h2>${inEvent.name}</h2>`;
	if (inEvent.subtitle) {
		description += `<h3>${inEvent.subtitle}</h3>\n`;
	}
	description += `<h3>Event Information Link</h3>`;
	description +=
		'(Page includes event information, POC contact information, and applicable download links):\n';
	description += `https://${inEvent.accountID}.${config.HOST_NAME}/eventviewer/${inEvent.id}/\n\n`;
	description += `<h3>Status</h3>` + 'This event is ' + status + '\n\n';
	// second block
	description += `<h3>Times and Location(s)</h3>`;
	description +=
		'<b>Meet at</b> ' +
		dateFormatter(inEvent.meetDateTime) +
		' at ' +
		inEvent.meetLocation +
		'\n';
	description +=
		'<b>Start at</b> ' +
		dateFormatter(inEvent.startDateTime) +
		' at ' +
		inEvent.location +
		'\n';
	description += '<b>End at</b> ' + dateFormatter(inEvent.endDateTime) + '\n';
	description +=
		'<b>Pickup at</b> ' +
		dateFormatter(inEvent.pickupDateTime) +
		' at ' +
		inEvent.pickupLocation +
		'\n\n';
	// third block
	description += '<h3>Logistics</h3>';
	description +=
		'<b>Transportation Provided:</b> ' +
		(inEvent.transportationProvided === true ? 'YES' : 'NO') +
		'\n';
	description +=
		'<b>SM Uniform:</b> ' + orBlank(presentMultCheckboxReturn(inEvent.smuniform)) + '\n';
	description +=
		'<b>Cadet Uniform:</b> ' + orBlank(presentMultCheckboxReturn(inEvent.cuniform)) + '\n';
	description +=
		'<b>Activity:</b> ' + orBlank(presentMultCheckboxReturn(inEvent.activity)) + '\n';
	const showForms = isOneOfSelected(inEvent.requiredForms);
	if (showForms === true) {
		description +=
			'<b>Required forms:</b> ' +
			orBlank(presentMultCheckboxReturn(inEvent.requiredForms)) +
			'\n';
	}
	const showLodging = isOneOfSelected(inEvent.lodgingArrangments);
	if (showLodging === true) {
		description +=
			'<b>Lodging:</b> ' +
			orBlank(presentMultCheckboxReturn(inEvent.lodgingArrangments)) +
			'\n';
	}
	if (inEvent.requiredEquipment.length > 0) {
		description += `<b>Required equipment:</b> ${inEvent.requiredEquipment.join(', ')}\n`;
	}
	if (!!inEvent.registration) {
		description +=
			'<b>Registration deadline:</b> ' + dateFormatter(inEvent.registration.deadline) + '\n';
		description +=
			'<b>Registration information:</b> ' + inEvent.registration.information + '\n';
	}
	if (!!inEvent.participationFee) {
		description += `<b>Participation fee:</b> ${inEvent.participationFee.feeAmount}\n`;
		description +=
			'<b>Participation fee due:</b> ' +
			dateFormatter(inEvent.participationFee.feeDue) +
			'\n';
	}
	const showMeals = isOneOfSelected(inEvent.mealsDescription);
	if (showMeals === true) {
		description +=
			'<b>Meals:</b> ' + orBlank(presentMultCheckboxReturn(inEvent.mealsDescription)) + '\n';
	}
	description += `<b>Desired number of participants:</b> ${inEvent.desiredNumberOfParticipants}\n`;
	if (inEvent.comments.length > 0) {
		description += `<b>Comments:</b> ${markdown.toHTML(inEvent.comments)}\n`;
	}
	if (inEvent.eventWebsite.length > 0) {
		description += '<b>Website:</b> ' + inEvent.eventWebsite + '\n';
	}

	return description;
}

const getDateFormatter = (timeZone: Timezone): Intl.DateTimeFormat =>
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
	config: GoogleConfiguration,
	inEvent: RawResolvedEventObject,
	inStatement: string,
): string {
	// set status message
	let status = `invalid.  Please contact eventsupport@md.cap.gov to report this.`;
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
	config: GoogleConfiguration,
): Promise<string> {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const privateKey = require(config.GOOGLE_KEYS_PATH + '/md089.json') as {
		client_email: string;
		private_key: string;
	};
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
	config: GoogleConfiguration,
): Promise<string> {
	const name = `${newAccountName} - ${newEventName}`;

	return createGoogleCalendar(accountID, name, config);
}

export async function createGoogleCalendarEvents(
	backend: Backends<[RegistryBackend]>,
	inEvent: RawResolvedEventObject,
	inAccount: AccountObject,
	config: GoogleConfiguration,
	calendarID?: string,
): Promise<[string | null, string | null, string | null]> {
	calendarID ??= inAccount.mainCalendarID;
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const privatekey = require(config.GOOGLE_KEYS_PATH + '/' + inAccount.id + '.json') as {
		client_email: string;
		private_key: string;
	};
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

	const registry = await backend.getRegistryUnsafe(inAccount.id).fullJoin();

	return Promise.all([
		updateMainEvent(config, myCalendar, jwtClient, inEvent, calendarID, registry),
		typeof inEvent.registration !== 'undefined'
			? updateRegEvent(config, myCalendar, jwtClient, inEvent, calendarID)
			: null,
		typeof inEvent.participationFee !== 'undefined'
			? updateFeeEvent(config, myCalendar, jwtClient, inEvent, calendarID)
			: null,
	]);
}

export default async function updateGoogleCalendars(
	backend: Backends<[RegistryBackend]>,
	inEvent: RawRegularEventObject,
	inAccount: AccountObject,
	config: GoogleConfiguration,
): Promise<[string | null, string | null, string | null]> {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const privatekey = require(config.GOOGLE_KEYS_PATH + '/' + inAccount.id + '.json') as {
		client_email: string;
		private_key: string;
	};
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar'],
	);
	// authenticate request
	await jwtClient.authorize();
	const myCalendar = google.calendar('v3');

	const registry = await backend.getRegistryUnsafe(inAccount.id).fullJoin();

	if (inEvent.status === EventStatus.DRAFT) {
		await removeGoogleCalendarEvents(inEvent, inAccount, config)
		return [null, null, null];
	}

	// 999999999 is there a guarantee that the function return values will always be in the same order???
	return Promise.all([
		updateMainEvent(config, myCalendar, jwtClient, inEvent, inAccount.mainCalendarID, registry),
		updateRegEvent(config, myCalendar, jwtClient, inEvent, inAccount.mainCalendarID),
		updateFeeEvent(config, myCalendar, jwtClient, inEvent, inAccount.mainCalendarID),
	]);
}

export async function removeGoogleCalendarEvents(
	inEvent: RawEventObject,
	inAccount: AccountObject,
	config: GoogleConfiguration,
): Promise<void> {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const privatekey = require(config.GOOGLE_KEYS_PATH + '/' + inAccount.id + '.json') as {
		client_email: string;
		private_key: string;
	};
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
	config: GoogleConfiguration,
	calendarID?: string,
): Promise<void> {
	calendarID ??= inAccount.mainCalendarID;
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const privatekey = require(config.GOOGLE_KEYS_PATH + '/' + inAccount.id + '.json') as {
		client_email: string;
		private_key: string;
	};
	const jwtClient = new google.auth.JWT(
		privatekey.client_email,
		undefined,
		privatekey.private_key,
		['https://www.googleapis.com/auth/calendar'],
	);
	// authenticate request
	await jwtClient.authorize();
	const myCalendar = google.calendar('v3');

	console.log(`Deleting events for ${calendarID} (${inAccount.id})`);

	let events = (
		await myCalendar.events.list({
			auth: jwtClient,
			calendarId: calendarID,
		})
	)?.data.items;
	while (events === null || events === undefined || events.length > 0) {
		if (events !== null && events !== undefined) {
			for (const event of events) {
				console.log("deleting event " + calendarID + "-" + event.id);
				try {
				await myCalendar.events.delete({
					auth: jwtClient,
					calendarId: calendarID,
					eventId: event.id as string,
				});
			} catch (error) {
				console.error("Error deleting event: " + event.id);
			}
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
				calendarId: calendarID,
			})
		)?.data.items;
	}
}

type JWTClient = InstanceType<typeof google.auth.JWT>;

async function deleteCalendarEvent(
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	eventUUID: string,
	calendarID: string,
): Promise<void> {
	if (eventUUID.length > 0) {
		let deleteResponse;
		try {
			deleteResponse = await myCalendar.events.delete({
				auth: jwtClient,
				calendarId: calendarID,
				eventId: eventUUID,
			});
		} catch (error) {
					console.error("delete event error: " + eventUUID + " ");
			// 9999999999 this shouldn't happen.  Should probably log
			// 			this occurrence so that leaks can be plugged.
			// this occurs when the event UUID doesn't exist on the Google calendar,
			// such as when the Google event is deleted manually then the web event is Deleted

			// when the Google Calendar event is missing, the code errors out here, stopping
			// exectuion
			// need to catch and handle this error so that when attempting to delete or move
			// events the code succeeds in execution
			// throw error;
			if (error.code === 410) {
				console.log('Google calendar event not found, ignoring');
				return;
			}
		}
		if (typeof deleteResponse !== 'undefined') {
			if (deleteResponse.status >= 400) {
				// console.log('Failure', deleteResponse, eventUUID);
				throw new Error(
					`Error deleting google calendar event: ${deleteResponse.status} ${deleteResponse.statusText}`,
				);
			}
		} else {
			// throw new Error('Delete response was undefined');
			console.error('Delete response was undefined for event: ' + eventUUID);
		}
	}
}

async function deleteCalendarEvents(
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawEventObject,
	calendarID: string,
): Promise<void> {
	// console.log('in deleteCalendarEvents', inEvent);
	if (!!inEvent.googleCalendarIds.mainId && inEvent.googleCalendarIds.mainId.length > 0) {
		await deleteCalendarEvent(
			myCalendar,
			jwtClient,
			inEvent.googleCalendarIds.mainId,
			calendarID,
		);
	}
	if (!!inEvent.googleCalendarIds.regId && inEvent.googleCalendarIds.regId.length > 0) {
		await deleteCalendarEvent(
			myCalendar,
			jwtClient,
			inEvent.googleCalendarIds.regId,
			calendarID,
		);
	}
	if (!!inEvent.googleCalendarIds.feeId && inEvent.googleCalendarIds.feeId.length > 0) {
		await deleteCalendarEvent(
			myCalendar,
			jwtClient,
			inEvent.googleCalendarIds.feeId,
			calendarID,
		);
	}
}

function getEventColor(inStatus: EventStatus): number {
	switch (inStatus) {
		case EventStatus.CANCELLED:
			return 11;
		case EventStatus.DRAFT:
			return 5;
		case EventStatus.TENTATIVE:
			return 7;
		case EventStatus.INFORMATIONONLY:
			return 1;
	}
	return 9;
}

function buildEvent(
	config: GoogleConfiguration,
	registry: RegistryValues,
	inEvent: RawResolvedEventObject,
): calendar_v3.Schema$Event {
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
	config: GoogleConfiguration,
	inEvent: RawResolvedEventObject,
	inDate: number,
	inString: string,
): calendar_v3.Schema$Event {
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
	config: GoogleConfiguration,
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawResolvedEventObject,
	googleId: string,
): Promise<string | null> {
	if(inEvent.googleCalendarIds.feeId && inEvent.googleCalendarIds.feeId.length > 0) {
		deleteCalendarEvent(myCalendar, jwtClient, inEvent.googleCalendarIds.feeId, googleId);
	}

	if (!!inEvent.participationFee) {
		const deadlineNumber = !!inEvent.participationFee ? inEvent.participationFee.feeDue : 0;
		const deadlineInfo: number = !!inEvent.participationFee
			? inEvent.participationFee.feeAmount
			: 0;
		const deadlineString =
			`This is a fee deadline for event ${inEvent.accountID}-${inEvent.id}\n` +
			(deadlineInfo > 0 ? 'The fee amount is $' + deadlineInfo.toFixed(2) + '\n\n' : '\n');
		const event = buildDeadline(config, inEvent, deadlineNumber, deadlineString);
		const response = await myCalendar.events.insert({
			auth: jwtClient,
			calendarId: googleId,
			requestBody: event,
		});
		if (!response.data.id) {
			throw new Error('Could not insert fee deadline event');
		}
		return response.data.id;
	} else {
		return null;
	}
}

async function updateRegEvent(
	config: GoogleConfiguration,
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawResolvedEventObject,
	googleId: string,
): Promise<string | null> {
	if(inEvent.googleCalendarIds.regId && inEvent.googleCalendarIds.regId.length > 0) {
		deleteCalendarEvent(myCalendar, jwtClient, inEvent.googleCalendarIds.regId, googleId);
	}

	if (!!inEvent.registration) {
		const deadlineNumber = !!inEvent.registration ? inEvent.registration.deadline : 0;
		const deadlineInfo: string = !!inEvent.registration
			? inEvent.registration.information || ''
			: '';
		const deadlineString =
			`This is a registration deadline for event ${inEvent.accountID}-${inEvent.id}\n` +
			(deadlineInfo.length > 0 ? deadlineInfo + '\n\n' : '\n');
		const event = buildDeadline(config, inEvent, deadlineNumber, deadlineString);
		const response = await myCalendar.events.insert({
			auth: jwtClient,
			calendarId: googleId,
			requestBody: event,
		});

		if (!response.data.id) {
			throw new Error(
				'Invalid response from Google calendar when creating Google calendar event',
			);
		}

		return response.data.id;
	} else {
		return null;
	}
}

async function updateMainEvent(
	config: GoogleConfiguration,
	myCalendar: calendar_v3.Calendar,
	jwtClient: JWTClient,
	inEvent: RawResolvedEventObject,
	googleId: string,
	registry: RegistryValues,
): Promise<string> {
	const event = buildEvent(config, registry, inEvent);
console.log(`Updating main event for ${inEvent.accountID}-${inEvent.id} with ID ${inEvent.googleCalendarIds.mainId} on calendar ${googleId}`);
	if(inEvent.googleCalendarIds.mainId && inEvent.googleCalendarIds.mainId.length > 0) {
		await deleteCalendarEvent(myCalendar, jwtClient, inEvent.googleCalendarIds.mainId, googleId);
	}


		const response = await myCalendar.events.insert({
			auth: jwtClient,
			calendarId: googleId,
			requestBody: event,
		});

		if (!response.data.id) {
			console.log('Could not insert new main event.  Response data:', response.data);
			throw new Error('Could not insert new main event');
		}
		console.log(
			`Inserted new main event for ${inEvent.accountID}-${inEvent.id} with ID ${response.data.id}`,
		);

		return response.data.id;
	}

export interface GoogleBackend {
	removeGoogleCalendarEvents: (event: RawResolvedEventObject) => ServerEither<void>;
	updateGoogleCalendars: (
		event: RawRegularEventObject,
	) => ServerEither<[string | null, string | null, string | null]>;
	createGoogleCalendarEvents: (
		event: RawResolvedEventObject,
	) => ServerEither<[string | null, string | null, string | null]>;
}

export const getGoogleBackend = (
	req: BasicAccountRequest,
	prevBackend: Backends<[RegistryBackend, AccountBackend]>,
): GoogleBackend => getRequestFreeGoogleBackend(req.configuration, prevBackend);

export const getRequestFreeGoogleBackend = (
	conf: GoogleConfiguration,
	prevBackend: Backends<[RegistryBackend, AccountBackend]>,
): GoogleBackend => ({
	removeGoogleCalendarEvents: event =>
		prevBackend
			.getAccount(event.accountID)
			.map(account => removeGoogleCalendarEvents(event, account, conf))
			.map(destroy),
	updateGoogleCalendars: event =>
		prevBackend
			.getAccount(event.accountID)
			.map(account => updateGoogleCalendars(prevBackend, event, account, conf)),
	createGoogleCalendarEvents: event =>
		prevBackend
			.getAccount(event.accountID)
			.map(account => createGoogleCalendarEvents(prevBackend, event, account, conf)),
});

export const getEmptyGoogleBackend = (): GoogleBackend => ({
	removeGoogleCalendarEvents: () => notImplementedError('removeGoogleCalendarEvents'),
	updateGoogleCalendars: () => notImplementedError('updateGoogleCalendars'),
	createGoogleCalendarEvents: () => notImplementedError('createGoogleCalendarEvents'),
});
