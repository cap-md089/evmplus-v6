/**
 * Copyright (C) 2020 Andrew Rioux, Glenn Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { DateTime } from 'luxon';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { presentMultCheckboxReturn } from '../../lib/forms';
import { Maybe } from '../../lib/Maybe';
import { FullPointOfContact, Member, RawEventObject } from '../../typings/types';

export function formatPhone(phone: string) {
	// strip spaces and non-numeric characters
	phone.trimLeft().trimRight();
	if (phone) {
		if (phone!.match(/\d+/g)) {
			phone = phone!.match(/\d+/g)!.join('').toString();
			// add formatting
			return (
				'(' +
				phone.substring(0, 3) +
				')' +
				phone.substring(3, 6) +
				'-' +
				phone.substring(6, 10)
			);
		} else {
			return '';
		}
	} else {
		return '';
	}
}

const EventStatus = [
	'Draft',
	'Tentative',
	'Confirmed',
	'Complete',
	'Cancelled',
	'Information Only',
];

const zeroPad = (n: number, a = 2) => ('00' + n).substr(-a);

const formatDate = (date: number) => {
	const dateObject = new Date(date);

	const hour = dateObject.getHours();
	const minute = dateObject.getMinutes();

	const day = dateObject.getDate();
	const month = dateObject.getMonth();
	const year = dateObject.getFullYear();

	return `${zeroPad(month + 1)}/${zeroPad(day)}/${year} at ${zeroPad(hour)}:${zeroPad(minute)}`;
};

const boxChecked = (boxSize: number, vOffset: number) => ({
	canvas: [
		{ type: 'rect', x: 0, y: vOffset, w: boxSize, h: boxSize, lineColor: 'black' },
		{
			type: 'line',
			x1: 0,
			y1: vOffset,
			x2: boxSize,
			y2: boxSize + vOffset,
			lineColor: 'black',
		},
		{
			type: 'line',
			x1: 0,
			y1: boxSize + vOffset,
			x2: boxSize,
			y2: vOffset,
			lineColor: 'black',
		},
	],
});

const boxUnchecked = (boxSize: number, vOffset: number) => ({
	canvas: [{ type: 'rect', x: 0, y: vOffset, w: boxSize, h: boxSize, lineColor: 'black' }],
});

const GetBestPhone = (inMember: Member) => {
	let numbersData = '';

	if (inMember.contact.CELLPHONE.PRIMARY) {
		numbersData += 'CP ' + formatPhone(inMember.contact.CELLPHONE.PRIMARY) + '\n';
	}
	if (inMember.contact.CELLPHONE.SECONDARY) {
		numbersData += 'CS ' + formatPhone(inMember.contact.CELLPHONE.SECONDARY) + '\n';
	}
	if (inMember.contact.CELLPHONE.EMERGENCY) {
		numbersData += 'CE ' + formatPhone(inMember.contact.CELLPHONE.EMERGENCY) + '\n';
	}
	if (inMember.contact.CADETPARENTPHONE.PRIMARY) {
		numbersData += 'PP ' + formatPhone(inMember.contact.CADETPARENTPHONE.PRIMARY) + '\n';
	}
	if (inMember.contact.CADETPARENTPHONE.SECONDARY) {
		numbersData += 'PS ' + formatPhone(inMember.contact.CADETPARENTPHONE.SECONDARY) + '\n';
	}
	if (inMember.contact.CADETPARENTPHONE.EMERGENCY) {
		numbersData += 'PE ' + formatPhone(inMember.contact.CADETPARENTPHONE.EMERGENCY) + '\n';
	}
	if (inMember.contact.HOMEPHONE.PRIMARY) {
		numbersData += 'HP ' + formatPhone(inMember.contact.HOMEPHONE.PRIMARY) + '\n';
	}
	if (inMember.contact.HOMEPHONE.EMERGENCY) {
		numbersData += 'HE ' + formatPhone(inMember.contact.HOMEPHONE.EMERGENCY) + '\n';
	}
	if (numbersData.length > 2) {
		numbersData = numbersData.substring(0, numbersData.length - 1);
		return numbersData;
	} else {
		return '';
	}
};

const GetBestEmail = (inMember: Member) => {
	let numbersData = '';

	if (inMember.contact.EMAIL.PRIMARY) {
		numbersData += 'EP ' + inMember.contact.EMAIL.PRIMARY + '\n';
	}
	if (inMember.contact.EMAIL.SECONDARY) {
		numbersData += 'ES ' + inMember.contact.EMAIL.SECONDARY + '\n';
	}
	if (inMember.contact.EMAIL.EMERGENCY) {
		numbersData += 'EE ' + inMember.contact.EMAIL.EMERGENCY + '\n';
	}
	if (inMember.contact.CADETPARENTEMAIL.PRIMARY) {
		numbersData += 'PP ' + inMember.contact.CADETPARENTEMAIL.PRIMARY + '\n';
	}
	if (inMember.contact.CADETPARENTEMAIL.SECONDARY) {
		numbersData += 'PS ' + inMember.contact.CADETPARENTEMAIL.SECONDARY + '\n';
	}
	if (inMember.contact.CADETPARENTEMAIL.EMERGENCY) {
		numbersData += 'PE ' + inMember.contact.CADETPARENTEMAIL.EMERGENCY + '\n';
	}
	if (numbersData.length > 2) {
		numbersData = numbersData.substring(0, numbersData.length - 1);
		return numbersData;
	} else {
		return '';
	}
};

const GetOtherForms = (inEvent: RawEventObject) => {
	if (inEvent.requiredForms.otherSelected) {
		return inEvent.requiredForms.otherValue;
	} else {
		return '';
	}
};

export const capf6080DocumentDefinition = (
	event: RawEventObject,
	pointsOfContact: FullPointOfContact[],
	member: Member
): TDocumentDefinitions => {
	const MemberPhones = member.seniorMember ? '' : GetBestPhone(member);
	const MemberEmails = member.seniorMember ? '' : GetBestEmail(member);
	const MemberName = member.seniorMember
		? ''
		: member.memberRank + ' ' + member.nameFirst + ' ' + member.nameLast;
	const MemberID = member.seniorMember ? '' : member.id;
	const MemberSquadron = member.seniorMember ? '' : member.squadron;
	const POCText = pointsOfContact
		.map(
			(value, index) =>
				'\n' +
				(index + 1) +
				') ' +
				value.name +
				', Phone: ' +
				formatPhone(value.phone) +
				', Email: ' +
				value.email
		)
		.toString();

	const myTitleFontSize = 10;
	const myTextFontSize = 9;
	const mySmallFontSize = 7;
	const boxSize = 8;
	const vOffset = myTextFontSize - boxSize;
	const getBox = (checked: boolean = false) =>
		(checked ? boxChecked : boxUnchecked)(boxSize, vOffset);

	const myTest = true;
	const uniformLeft = true;
	const eventNumber = myTest
		? [
				{
					text: [
						{ text: 'Event Number: ', bold: true, fontSize: myTextFontSize },
						{
							text: event.accountID + '-' + event.id,
							bold: false,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];
	const eventStatus = myTest
		? [
				{
					text: [
						{ text: 'Event Status: ', bold: true, fontSize: myTextFontSize },
						{ text: EventStatus[event.status], bold: false, fontSize: myTextFontSize },
					],
				},
		  ]
		: [];
	const eventName = myTest
		? [
				{
					text: [
						{ text: 'Event Name: ', bold: true, fontSize: myTextFontSize },
						{ text: event.name, bold: false, fontSize: myTextFontSize },
					],
				},
		  ]
		: [];
	const eventComments = myTest
		? [
				{
					text: [
						{ text: 'Comments: ', bold: true, fontSize: myTextFontSize },
						{
							text: event.comments,
							bold: false,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];
	const meetLocation = myTest
		? [
				{
					text: [
						{ text: 'Meet at: ', bold: true, fontSize: myTextFontSize },
						{ text: event.meetLocation, bold: false, fontSize: myTextFontSize },
					],
				},
		  ]
		: [];
	const eventLocation = myTest
		? [
				{
					text: [
						{ text: 'Event Location: ', bold: true, fontSize: myTextFontSize },
						{ text: event.location, bold: false, fontSize: myTextFontSize },
					],
				},
		  ]
		: [];
	const pickupLocation = myTest
		? [
				{
					text: [
						{ text: 'Pickup at: ', bold: true, fontSize: myTextFontSize },
						{ text: event.pickupLocation, bold: false, fontSize: myTextFontSize },
					],
				},
		  ]
		: [];
	const meetDate = myTest
		? [
				{
					text: [
						{ text: 'Meet Date/Time: \t\t', bold: true, fontSize: myTextFontSize },
						{
							text: formatDate(event.meetDateTime),
							bold: true,
							italics: true,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];
	const startDate = myTest
		? [
				{
					text: [
						{ text: 'Event Start: \t\t\t\t', bold: true, fontSize: myTextFontSize },
						{
							text: formatDate(event.startDateTime),
							bold: true,
							italics: true,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];
	const endDate = myTest
		? [
				{
					text: [
						{ text: 'Event End:  \t\t\t\t', bold: true, fontSize: myTextFontSize },
						{
							text: formatDate(event.endDateTime),
							bold: true,
							italics: true,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];
	const pickupDate = myTest
		? [
				{
					text: [
						{ text: 'Pickup Date/Time: \t', bold: true, fontSize: myTextFontSize },
						{
							text: formatDate(event.pickupDateTime),
							bold: true,
							italics: true,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];
	const uniformleft =
		myTest && uniformLeft
			? [
					{
						text: [
							{ text: 'Uniform: ', bold: true, fontSize: myTextFontSize },
							{
								text: Maybe.orSome('')(
									presentMultCheckboxReturn(event.uniform, ', ')
								),
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const uniformright =
		myTest && !uniformLeft
			? [
					{
						text: [
							{ text: 'Uniform: ', bold: true, fontSize: myTextFontSize },
							{
								text: Maybe.orSome('')(
									presentMultCheckboxReturn(event.uniform, ', ')
								),
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const transportationProvided = myTest
		? [
				{
					text: [
						{ text: 'Transportation Provided: ', bold: true, fontSize: myTextFontSize },
						{
							text: event.transportationProvided ? 'Yes' : 'No',
							bold: false,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];
	const transportationDescription =
		event.transportationDescription && myTest
			? [
					{
						text: [
							{
								text: 'Transportation Description: ',
								bold: true,
								fontSize: myTextFontSize,
							},
							{
								text: event.transportationDescription,
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const registrationDeadline =
		event.registration && myTest
			? [
					{
						text: [
							{
								text: 'Registration Deadline: \t\t',
								bold: true,
								fontSize: myTextFontSize,
							},
							{
								text: formatDate(event.registration.deadline),
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const registrationInformation =
		event.registration && myTest
			? [
					{
						text: [
							{ text: 'Registration Info: ', bold: true, fontSize: myTextFontSize },
							{
								text: event.registration.information,
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const feeDeadline =
		event.participationFee && myTest
			? [
					{
						text: [
							{
								text: 'Fee Deadline:   \t\t\t\t',
								bold: true,
								fontSize: myTextFontSize,
							},
							{
								text: formatDate(event.participationFee.feeDue),
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const feeInformation =
		event.participationFee && myTest
			? [
					{
						text: [
							{ text: 'Fee Amount: ', bold: true, fontSize: myTextFontSize },
							{
								text: event.participationFee.feeAmount,
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const website =
		event.eventWebsite.length > 0 && myTest
			? [
					{
						text: [
							{ text: 'Website: ', bold: true, fontSize: myTextFontSize },
							{ text: event.eventWebsite, bold: false, fontSize: myTextFontSize },
						],
					},
			  ]
			: [];
	const lodging =
		myTest && Maybe.isSome(presentMultCheckboxReturn(event.lodgingArrangments))
			? [
					{
						text: [
							{ text: 'Lodging: ', bold: true, fontSize: myTextFontSize },
							{
								text: Maybe.orSome('')(
									presentMultCheckboxReturn(event.lodgingArrangments)
								),
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const activity = myTest
		? [
				{
					text: [
						{ text: 'Activity: ', bold: true, fontSize: myTextFontSize },
						{
							text: Maybe.orSome('')(presentMultCheckboxReturn(event.activity)),
							bold: false,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];
	const highAdventure =
		myTest && event.highAdventureDescription.length > 0
			? [
					{
						text: [
							{
								text: 'High Adventure Description: ',
								bold: true,
								fontSize: myTextFontSize,
							},
							{
								text: event.highAdventureDescription,
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const requiredEquipment =
		myTest && event.requiredEquipment.length > 0
			? [
					{
						text: [
							{ text: 'Required Equipment: ', bold: true, fontSize: myTextFontSize },
							{
								text: event.requiredEquipment.toString(),
								bold: false,
								fontSize: myTextFontSize,
							},
						],
					},
			  ]
			: [];
	const meals = myTest
		? [
				{
					text: [
						{ text: 'Meals: ', bold: true, fontSize: myTextFontSize },
						{
							text: Maybe.orSome('')(
								presentMultCheckboxReturn(event.mealsDescription)
							),
							bold: false,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];
	const POCs = myTest
		? [
				{
					text: [
						{ text: 'POC Info: ', bold: true, fontSize: myTextFontSize },
						{
							text: POCText,
							bold: false,
							fontSize: myTextFontSize,
						},
					],
				},
		  ]
		: [];

	let codeString = 'Contact information is preceded by two letters.  The first is ';
	codeString += 'the contact type: P = Parent, C = Cell Phone, E = Email, H = Home Phone, ';
	codeString +=
		'or W = Work Phone.  The second letter is the priority: P = Primary, S = Secondary, ';
	codeString += 'or E = Emergency';
	const nowDate = DateTime.utc();
	const docDefinition: TDocumentDefinitions = {
		pageSize: 'LETTER',
		pageOrientation: 'portrait',
		pageMargins: [12, 12, 12, 54],
		footer(currentPage: number, pageCount: number): Content {
			const footerContent: Content = [
				{
					layout: 'noBorders',
					table: {
						widths: [612 - 36],
						headerRows: 0,
						body: [
							[{ text: codeString, fontSize: 9 }],
							[
								{
									layout: 'noBorders',
									table: {
										widths: ['*', 306, '*'],
										headerRows: 0,
										body: [
											[
												{
													text: 'CAP Form 60-80 Feb 2018',
													bold: true,
													fontSize: mySmallFontSize,
												},
												{
													text:
														'(Local version, generated by CAPUnit.com on ' +
														nowDate.toLocaleString({
															year: 'numeric',
															month: '2-digit',
															day: '2-digit',
														}) +
														')',
													bold: false,
													fontSize: mySmallFontSize,
													alignment: 'center',
												},
												{
													text:
														'Page ' +
														currentPage.toString() +
														' of ' +
														pageCount,
													bold: false,
													fontSize: mySmallFontSize,
													alignment: 'right',
												},
											],
										],
									},
								},
							],
						],
					},
					margin: [12, 2, 12, 2],
				},
			];
			return footerContent;
		},

		content: [
			// content array start
			{
				// title table start
				table: {
					// table def start
					headerRows: 0,
					widths: [612 - 36],
					body: [
						[
							// row 1
							[
								{
									text: 'CIVIL AIR PATROL CADET ACTIVITY PERMISSION SLIP',
									fontSize: 15,
									bold: true,
									alignment: 'center',
								},
								{
									text: 'SUGGESTED BEST PRACTICE for LOCAL "WEEKEND" ACTIVITIES:',
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
								{
									text:
										'Announce the activity at least 2 weeks in advance and require participating cadets to provide this completed form prior to the event',
									fontSize: mySmallFontSize,
									bold: false,
									alignment: 'center',
								},
							],
						], // row 1
						[
							// row 2
							[
								{
									text: '1. INFORMATION on the PARTICIPATING CADET',
									bold: true,
									alignment: 'center',
									fontSize: myTitleFontSize,
								},
								{
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [96, '*', 40, 50],
										body: [
											[
												{
													text: 'Cadet Grade & Name:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: MemberName,
													fontSize: myTextFontSize,
												},
												{
													text: 'CAPID:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{ text: MemberID, fontSize: myTextFontSize },
											],
										],
									},
								},
								{
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [96, 60, 32, 80, 28, '*'],
										body: [
											[
												{
													text: 'Unit Charter Number:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{ text: MemberSquadron, fontSize: myTextFontSize },
												{
													text: 'Phone:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: MemberPhones,
													fontSize: myTextFontSize,
												},
												{
													text: 'Email:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: MemberEmails,
													fontSize: myTextFontSize,
												},
											],
										],
									},
								},
							],
						], // row 2
						[
							// row 3
							[
								{
									text: '2. INFORMATION about the ACTIVITY',
									bold: true,
									alignment: 'center',
									fontSize: myTitleFontSize,
								},
								{
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [68, '*', 60, 80],
										body: [
											[
												{
													text: 'Activity Name:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: event.name,
													bold: true,
													fontSize: myTitleFontSize,
													decoration: 'underline',
												},
												{
													text: 'Activity Date:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: formatDate(event.startDateTime),
													fontSize: myTextFontSize,
												},
											],
										],
									},
								},
								{
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [280, '*'],
										body: [
											[
												{
													text: 'For hotel-based activity or conference',
													bold: false,
													fontSize: myTextFontSize,
												},
												{
													text: 'For hotel-based activity or conference',
													bold: false,
													fontSize: myTextFontSize,
												},
											],
										],
									},
								},
								{
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [280, '*'],
										body: [
											[
												{
													text: 'Grade & Name of Supervising Senior:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: 'Grade & Name of Supervising Senior',
													bold: true,
													fontSize: myTextFontSize,
												},
											],
										],
									},
								},
							],
						], // row 3
						[
							// row 4
							[
								{
									text: "3. PARENT's or GUARDIAN's CONTACT INFORMATION",
									bold: true,
									alignment: 'center',
									fontSize: myTitleFontSize,
								},
								{
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [80, 90, 65, '*', 100, 80],
										body: [
											[
												{
													text: 'Parent or Guardian Name:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{ text: '' },
												{
													text: 'Relationship to Cadet:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{ text: '' },
												{
													text: 'Contact Number on Date(s) of Activity:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{ text: '' },
											],
										],
									},
								},
							],
						], // row 4
						[
							// row 5
							[
								{
									text: '4. OTHER DOCUMENTS REQUIRED TO PARTICIPATE',
									bold: true,
									alignment: 'center',
									fontSize: myTitleFontSize,
								},
								{
									text: 'Check those that apply and attach with this form',
									fontSize: mySmallFontSize,
									alignment: 'center',
								},
								{
									layout: 'noBorders',
									table: {
										widths: [myTextFontSize, 45, 215, myTextFontSize, 45, '*'],
										body: [
											[
												getBox(event.requiredForms.values[1]),
												{
													text: 'CAPF 31',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: 'Application for Special Activity',
													fontSize: myTextFontSize,
												},
												getBox(event.requiredForms.values[4]),
												{
													text: 'CAPF 160',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: 'CAP Member Health History Form',
													fontSize: myTextFontSize,
												},
											],
											[
												getBox(event.requiredForms.values[5]), // ...boxVal3,
												{
													text: 'CAPF 161',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: 'Emergency Information',
													fontSize: myTextFontSize,
												},
												{
													text:
														'Other/Special Local Local Forms (specify)\n' +
														GetOtherForms(event),
													fontSize: myTextFontSize,
													colSpan: 3,
													rowSpan: 2,
												},
												{},
												{},
											],
											[
												getBox(event.requiredForms.values[6]), // ...boxVal4,
												{
													text: 'CAPF 163',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text:
														'Provision of Minor Over the Counter Medication',
													fontSize: myTextFontSize,
												},
												{},
												{},
												{},
											],
										],
									},
								},
							],
						], // row 5
						[
							// row 6
							[
								{
									text: "5. PARENT's or GUARDIAN's AUTHORIZATION",
									bold: true,
									alignment: 'center',
									fontSize: myTitleFontSize,
								},
								{
									text:
										'Cadets who have reached the age of majority, write "N/A"',
									alignment: 'center',
									fontSize: mySmallFontSize,
								},
								{
									layout: 'noBorders',
									table: {
										widths: [160, 200, '*'],
										body: [
											[
												{
													text:
														'I authorize my cadet to participate in the activity described above',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: 'Signature:',
													bold: true,
													fontSize: myTextFontSize,
												},
												{
													text: 'Date:',
													bold: true,
													fontSize: myTextFontSize,
												},
											],
										],
									},
								},
								{
									text:
										'Disposition: Units must destroy this form and associated forms when the activity concludes',
									alignment: 'center',
									fontSize: mySmallFontSize,
								},
							],
						], // row 6
						[
							// row 7
							[
								{
									text:
										"Please detach on the dashed line.  The upper portion is for CAP and the lower portion is for the parent's or guardian's reference.",
									bold: true,
									alignment: 'center',
									fontSize: mySmallFontSize,
								},
								{
									canvas: [
										{
											type: 'line',
											x1: 0,
											y1: 3,
											x2: 576,
											y2: 3,
											lineColor: 'black',
											dash: { length: 5 },
										},
										{
											type: 'line',
											x1: 0,
											y1: 0,
											x2: 0,
											y2: 6,
											lineColor: 'white',
										},
									],
								},
								{
									text: '6. HELPFUL INFORMATION FOR PARENTS & GUARDIANS',
									bold: true,
									alignment: 'center',
									fontSize: myTitleFontSize,
								},
								{
									// row 7 inner table
									layout: 'noBorders',
									table: {
										widths: [200, '*', 70],
										body: [
											[
												[
													...eventNumber,
													...eventStatus,
													...eventName,
													...meetDate,
													...meetLocation,
													...startDate,
													...eventLocation,
													...endDate,
													...pickupDate,
													...pickupLocation,
													...uniformleft,
												],
												[
													...uniformright,
													...transportationProvided,
													...transportationDescription,
													...registrationDeadline,
													...registrationInformation,
													...feeDeadline,
													...feeInformation,
													...website,
													...lodging,
													...activity,
													...highAdventure,
													...requiredEquipment,
													...meals,
													...POCs,
												],
												[
													{ text: 'Event Info:' },
													{
														qr:
															'https://' +
															event.accountID +
															'.capunit.com/eventviewer/' +
															event.id,
														fit: '70',
													},
												],
											],
										],
									},
								}, // row 7 inner table
								...eventComments,
							],
						], // row 7
					],
				}, // table def end
			}, // title table end
		], // content array end
		defaultStyle: {
			font: 'FreeSans',
		},
	}; // doc def end

	return docDefinition;
};
// http://localhost:3001/api/event/2/attendance/log
