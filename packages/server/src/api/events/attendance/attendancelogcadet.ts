/**
 * Copyright (C) 2020 Glenn Rioux
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

// import { Response } from 'express';
// import { DateTime, Duration } from 'luxon';
// import { join } from 'path';

// export const Uniforms = [
// 	'Dress Blue A',
// 	'Dress Blue B',
// 	'Airman Battle Uniform (ABU) or Operational Camouflage Pattern (OCP)',
// 	'PT Gear',
// 	'Polo Shirts (Senior Members)',
// 	'Blue Utilities (Senior Members)',
// 	'Civilian Attire',
// 	'Flight Suit',
// 	'Not Applicable',
// ];

// export const Activities = [
// 	'Squadron Meeting',
// 	'Classroom/Tour/Light',
// 	'Backcountry',
// 	'Flying',
// 	'Physically Rigorous',
// 	'Recurring Meeting',
// ];

// function expireFlag(dte: DateTime) {
// 	const dateFlag = DateTime.utc();
// 	dateFlag.plus(Duration.fromObject({ days: 30 }));
// 	return dte < dateFlag;
// }

// function expiredFlag(dte: DateTime) {
// 	const dateFlag = DateTime.utc();
// 	return dte < dateFlag;
// }

// export default asyncErrorHandler(async (req: AccountRequest<{ id: string }>, res: Response) => {
// 	// const fonts = {
// 	// 	Roboto: {
// 	// 		normal: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-Regular.ttf'),
// 	// 		bold: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-Medium.ttf'),
// 	// 		italics: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-Italic.ttf'),
// 	// 		bolditalics: join(
// 	// 			req.configuration.path,
// 	// 			'..',
// 	// 			'images',
// 	// 			'fonts',
// 	// 			'Roboto-MediumItalic.ttf'
// 	// 		)
// 	// 	}
// 	// };

// 	let event: Event;
// 	// const maker = new PDFMake(fonts);

// 	try {
// 		event = await Event.Get(req.params.id, req.account, req.mysqlx);
// 	} catch (e) {
// 		res.status(404);
// 		res.end();
// 		return;
// 	}

// 	// replace this with rec.account.Orgid code once Organization import is complete
// 	const myOrg = [
// 		{ Orgid: 916, Region: 'MAR', Wing: 'MD', Unit: '089', Name: 'ST MARYS COMPOSITE SQDN' },
// 		{
// 			Orgid: 2529,
// 			Region: 'MAR',
// 			Wing: 'MD',
// 			Unit: '890',
// 			Name: 'ESPERANZA MIDDLE SCHOOL FLIGHT',
// 		},
// 	];
// 	let sqnNum = myOrg[0].Region + '-' + myOrg[0].Wing + '-';
// 	let sqnName = '';
// 	for (const w of myOrg) {
// 		sqnNum += w.Unit + '/';
// 		sqnName += w.Name + '/';
// 	}
// 	sqnNum = sqnNum.substring(0, sqnNum.length - 1);
// 	sqnName = sqnName.substring(0, sqnName.length - 1);

// 	const memberInformation: Array<Array<{
// 		text: string;
// 		bold?: boolean;
// 		fontSize?: number;
// 		fillColor?: string;
// 		borderColor?: string[];
// 		decoration?: string; // 'underline', 'overline', 'linethrough'
// 		decorationStyle?: string; // 'dashed', 'dotted', 'double', 'wavy'
// 		decorationColor?: string; // 'blue', 'red', 'green', etc.
// 	}>> = [];

// 	const fontSize = 9;
// 	for await (const member of req.account.getMembers()) {
// 		if (!member.seniorMember) {
// 			memberInformation.push([
// 				{
// 					text: member.getNameLFMI(),
// 					decoration:
// 						member instanceof CAPNHQMember
// 							? expiredFlag(member.expirationDateObject)
// 								? 'lineThrough'
// 								: ''
// 							: '',
// 					fontSize,
// 				},
// 				{ text: member.memberRank, fontSize },
// 				{ text: member.id.toString(), fontSize },
// 				{
// 					text:
// 						member instanceof CAPNHQMember
// 							? member.expirationDateObject.toLocaleString({
// 									year: 'numeric',
// 									month: '2-digit',
// 									day: '2-digit',
// 							  })
// 							: 'N/A',
// 					bold:
// 						member instanceof CAPNHQMember
// 							? expireFlag(member.expirationDateObject)
// 								? true
// 								: false
// 							: false,
// 					fontSize,
// 				},
// 				{ text: ' ', fontSize },
// 				{ text: member.flight || 'Unassigned', fontSize },
// 			]);
// 		}
// 	}

// 	memberInformation.sort((a, b) => a[0].text.localeCompare(b[0].text));

// 	// let fc = '';
// 	// const mil = memberInformation.length;
// 	// for (let i = 0; i < mil; i++) {
// 	// 	memberInformation[i][0].fillColor = i % 2 ? 'lightgrey' : 'white';
// 	// 	fc = memberInformation[i][0].fillColor;
// 	// 	memberInformation[i][0].borderColor = [fc, fc, fc];
// 	// 	memberInformation[i][1].fillColor = fc;
// 	// 	memberInformation[i][1].borderColor = [fc, fc, fc];
// 	// 	memberInformation[i][2].fillColor = fc;
// 	// 	memberInformation[i][2].borderColor = [fc, fc, ,];
// 	// 	memberInformation[i][3].fillColor = fc;
// 	// 	memberInformation[i][3].borderColor = memberInformation[i][3].bold
// 	// 		? ['black', 'black', 'black', 'black']
// 	// 		: [fc, fc, fc];
// 	// 	memberInformation[i][4].fillColor = fc;
// 	// 	memberInformation[i][4].borderColor = [fc, fc, fc];
// 	// 	memberInformation[i][5].fillColor = fc;
// 	// 	memberInformation[i][5].borderColor = [fc, fc, fc];
// 	// }

// 	// memberInformation[mil - 1][0].borderColor = [fc, fc, fc, 'white'];
// 	// memberInformation[mil - 1][1].borderColor = [fc, fc, fc, 'white'];
// 	// memberInformation[mil - 1][2].borderColor = [
// 	// 	fc,
// 	// 	fc,
// 	// 	memberInformation[mil - 1][3].bold ? 'black' : fc,
// 	// 	'white'
// 	// ];
// 	// memberInformation[mil - 1][4].borderColor = [fc, fc, fc, 'white'];
// 	// memberInformation[mil - 1][5].borderColor = [fc, fc, fc, 'white'];

// 	const formattedMemberInformation = [
// 		[
// 			{ text: 'Member', bold: true, fontSize: 10, borderColor: ['white', 'white'] },
// 			{ text: 'Grade', bold: true, fontSize: 10, borderColor: ['white', 'white'] },
// 			{ text: 'CAPID', bold: true, fontSize: 10, borderColor: ['white', 'white'] },
// 			{ text: 'Expiration', bold: true, fontSize: 10, borderColor: ['white', 'white'] },
// 			{ text: 'Signature', bold: true, fontSize: 10, borderColor: ['white', 'white'] },
// 			{
// 				text: 'Flight',
// 				bold: true,
// 				fontSize: 10,
// 				borderColor: ['white', 'white', 'white'],
// 			},
// 		],
// 		...memberInformation,
// 	];

// 	// const nowDate = DateTime.utc();
// 	const docDefinition = {
// 		pageSize: 'letter',
// 		pageOrientation: 'portrait',
// 		pageMargins: [36, 36, 36, 54],
// 		// footer:  [
// 		// 		{
// 		// 			layout: 'noBorders',
// 		// 			table: {
// 		// 				widths: [ 612-72 ],
// 		// 				headerRows: 0,
// 		// 				body: [
// 		// 					[	{
// 		// 						layout: 'noBorders',
// 		// 						table: {
// 		// 							widths: ['*', '*'],
// 		// 							headerRows: 0,
// 		// 							body: [
// 		// 								[
// 		// 									{ text: nowDate.toLocaleString({
// 		// 										year: 'numeric',
// 		// 										month: '2-digit',
// 		// 										day: '2-digit'
// 		// 										}), alignment: 'left', fontSize: 10
// 		// 									},
// 		// 									{ text: 'Page ' + currentPage.toString() + ' of ' + pageCount,
// 		// 										alignment: 'right', fontSize: 10
// 		// 									}
// 		// 								]
// 		// 							]
// 		// 						}}
// 		// 					]
// 		// 				]
// 		// 			}, margin: [36, 2, 36, 2]
// 		// 		}
// 		// 	],

// 		content: [
// 			// content array start
// 			{
// 				// title table start
// 				layout: 'noBorders',
// 				table: {
// 					// table def start
// 					headerRows: 0,
// 					widths: [90, '*'],
// 					body: [
// 						// table body start
// 						[
// 							// title section start
// 							//
// 							//

// 							{
// 								// left column start
// 								image: join(req.configuration.path, '..', 'images', 'seal.png'),
// 								width: 90,
// 							}, // left column end

// 							[
// 								// right column start
// 								{
// 									text: 'Cadet Attendance Log',
// 									fontSize: 16,
// 									bold: true,
// 									alignment: 'center',
// 								}, // cell row 1
// 								{
// 									// cell row 2
// 									layout: 'noBorders',
// 									table: {
// 										headerRows: 0,
// 										widths: [28, 80, 50, '*'],
// 										body: [
// 											[
// 												{
// 													text: 'Date:',
// 													fontSize: 12,
// 													bold: true,
// 													alignment: 'left',
// 												},
// 												{
// 													text: DateTime.fromMillis(
// 														event.meetDateTime
// 													).toLocaleString(),
// 													fontSize: 12,
// 													bold: false,
// 													alignment: 'left',
// 												},
// 												{
// 													text: 'Location:',
// 													fontSize: 12,
// 													bold: true,
// 													alignment: 'left',
// 												},
// 												{
// 													text: event.location,
// 													fontSize: 12,
// 													bold: false,
// 													alignment: 'left',
// 												},
// 											], // table element array
// 										], // body
// 									}, // table
// 								}, // cell row 2 end
// 								{
// 									// cell row 3
// 									layout: 'noBorders',
// 									table: {
// 										headerRows: 0,
// 										widths: [48, '*'],
// 										body: [
// 											[
// 												{
// 													text: 'Uniform: ',
// 													fontSize: 12,
// 													bold: true,
// 													alignment: 'left',
// 												},
// 												{
// 													text: presentMultCheckboxReturn(event.uniform),
// 													fontSize: 12,
// 													bold: false,
// 													alignment: 'left',
// 												},
// 											], // table element array row 1
// 											[
// 												{
// 													text: 'Activity: ',
// 													fontSize: 12,
// 													bold: true,
// 													alignment: 'left',
// 												},
// 												{
// 													text: presentMultCheckboxReturn(event.activity),
// 													fontSize: 12,
// 													bold: false,
// 													alignment: 'left',
// 												},
// 											],
// 										], // body
// 									}, // table
// 								}, // cell row 3 end
// 							], // right column end

// 							//
// 						], // title section end
// 					], // table body end
// 				}, // table def end
// 			}, // title table end

// 			{ text: ' ' }, // spacer
// 			{
// 				text: sqnNum + '   ' + sqnName,
// 				bold: true,
// 			},
// 			{
// 				// content table start
// 				// layout: 'noBorders',
// 				table: {
// 					// table def start
// 					headerRows: 1,
// 					widths: [110, 38, 40, 55, '*', 60],
// 					body: formattedMemberInformation,
// 				}, // table def end
// 			}, // content table end

// 			{ text: ' ' }, // spacer
// 			{
// 				// ending table start
// 				layout: 'noBorders',
// 				table: {
// 					// table def start
// 					headerRows: 0,
// 					body: [
// 						// table body start
// 						[
// 							// header row start
// 							//
// 							{
// 								table: {
// 									widths: [120, 120, 120, 120],
// 									body: [
// 										['Name', 'Phone', 'Email', 'Sponsor Name'],
// 										[' ', '', '', ''],
// 										[
// 											{ text: ' ', fillColor: 'lightgrey' },
// 											{ text: ' ', fillColor: 'lightgrey' },
// 											{ text: ' ', fillColor: 'lightgrey' },
// 											{ text: ' ', fillColor: 'lightgrey' },
// 										],
// 										[' ', '', '', ''],
// 										[
// 											{ text: ' ', fillColor: 'lightgrey' },
// 											{ text: ' ', fillColor: 'lightgrey' },
// 											{ text: ' ', fillColor: 'lightgrey' },
// 											{ text: ' ', fillColor: 'lightgrey' },
// 										],
// 										[' ', '', '', ''],
// 										[
// 											{ text: ' ', fillColor: 'lightgrey' },
// 											{ text: ' ', fillColor: 'lightgrey' },
// 											{ text: ' ', fillColor: 'lightgrey' },
// 											{ text: ' ', fillColor: 'lightgrey' },
// 										],
// 										[' ', '', '', ''],
// 									],
// 								},
// 							},
// 						], // header row end
// 					], // table body end
// 				}, // table def end
// 			}, // ending table end
// 		], // content array end
// 	}; // doc def end

// 	res.status(200);
// 	// res.setHeader('Content-Disposition','attachment:filename=log.pdf');

// 	try {
// 		// const doc = maker.createPdfKitDocument(docDefinition);
// 		// doc.pipe(createWriteStream('testing.pdf'));
// 		// doc.pipe(res);
// 		// doc.end();
// 		res.json(docDefinition);
// 	} catch (e) {
// 		res.status(500);
// 		res.end();
// 	}

// 	// json<AttendanceRecord[]>(res, event.attendance);
// });
// // http://localhost:3001/api/event/2/attendance/log
