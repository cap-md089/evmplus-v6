import { Response } from 'express';
import { DateTime } from 'luxon';
import { join } from 'path';
import * as PDFMake from 'pdfmake';
import {
	AccountRequest,
	asyncErrorHandler,
	CAPNHQMember,
	Event,
	getBestEmail,
	getBestPhone,
	getEmerPhone,
	presentMultCheckboxReturn,
	resolveReference
} from '../../../lib/internals';
import { formatPhone } from '../../../lib/Util';

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

function expiredFlag(dte: DateTime) {
	const dateFlag = DateTime.utc();
	return dte < dateFlag;
}

export default asyncErrorHandler(async (req: AccountRequest<{ id: string }>, res: Response) => {
	const fonts = {
		Roboto: {
			normal: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-Regular.ttf'),
			bold: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-Medium.ttf'),
			italics: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-Italic.ttf'),
			bolditalics: join(
				req.configuration.path,
				'..',
				'images',
				'fonts',
				'Roboto-MediumItalic.ttf'
			)
		}
	};

	let event: Event;
	const maker = new PDFMake(fonts);

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	// replace this with rec.account.Orgid code once Organization import is complete
	const myOrg = [
		{ Orgid: 916, Region: 'MAR', Wing: 'MD', Unit: '089', Name: 'ST MARYS COMPOSITE SQDN' },
		{
			Orgid: 2529,
			Region: 'MAR',
			Wing: 'MD',
			Unit: '890',
			Name: 'ESPERANZA MIDDLE SCHOOL FLIGHT'
		}
	];
	let sqnNum = myOrg[0].Region + '-' + myOrg[0].Wing + '-';
	let sqnName = '';
<<<<<<< HEAD
	for (let w = 0; w < myOrg.length; w++) {
		sqnNum += myOrg[w].Unit + '/';
		sqnName += myOrg[w].Name + '/';
=======
	for (const org of myOrg) {
		sqnNum += org.Unit + '/';
		sqnName += org.Name + '/';
>>>>>>> 9f095bc0fe16b1cf00e816e9770b2d4cc3507480
	}
	sqnNum = sqnNum.substring(0, sqnNum.length - 1);
	sqnName = sqnName.substring(0, sqnName.length - 1);

	const memberInformation: Array<
		Array<{
			text: string;
			bold?: boolean;
			fontSize?: number;
			fillColor?: string;
			borderColor?: string[];
			decoration?: string; // 'underline', 'overline', 'linethrough'
			decorationStyle?: string; // 'dashed', 'dotted', 'double', 'wavy'
			decorationColor?: string; // 'blue', 'red', 'green', etc.
		}>
	> = [];

	const seniorMemberInformation: typeof memberInformation = [];
	const cadetMemberInformation: typeof memberInformation = [];

	const fontSize = 9;
	for await (const memberRecord of event.getAttendance()) {
		const member = await resolveReference(memberRecord.memberID, req.account, req.mysqlx, true); // need to Estimate member here to access member information *****
		(member.seniorMember ? seniorMemberInformation : cadetMemberInformation).push([
			{
				text: member.getNameLFMI(),
				decoration:
					member instanceof CAPNHQMember
						? expiredFlag(member.expirationDateObject)
							? 'lineThrough'
							: ''
						: '',
				fontSize
			},
			{ text: member.memberRank, fontSize },
			{ text: member.id.toString(), fontSize },
			{
				text: member.squadron,
				bold: req.account.orgIDs.includes(member.orgid) ? false : true,
				fontSize
			},
			{
				text:
					getBestPhone(member).source + ' ' + getBestPhone(member).contact == null
						? ''
						: formatPhone(getBestPhone(member).contact!),
				fontSize
			},
			{
				text:
					getEmerPhone(member).source + ' ' + getEmerPhone(member).contact == null
						? ''
						: formatPhone(getEmerPhone(member).contact!),
				fontSize
			},
			{ text: getBestEmail(member).source + ' ' + getBestEmail(member).contact, fontSize }
		]);
	}

	seniorMemberInformation.sort((a, b) => a[0].text.localeCompare(b[0].text));
	cadetMemberInformation.sort((a, b) => a[0].text.localeCompare(b[0].text));

	let fc: string | undefined = '';
	const smil = seniorMemberInformation.length;
	const smils = smil !== 1 ? 's' : '';
	for (let i = 0; i < smil; i++) {
		seniorMemberInformation[i][0].fillColor = i % 2 ? 'lightgrey' : 'white';
		fc = seniorMemberInformation[i][0].fillColor;
		seniorMemberInformation[i][1].fillColor = fc;
		seniorMemberInformation[i][2].fillColor = fc;
		seniorMemberInformation[i][3].fillColor = fc;
		seniorMemberInformation[i][4].fillColor = fc;
		seniorMemberInformation[i][5].fillColor = fc;
		seniorMemberInformation[i][6].fillColor = fc;
	}
	const cmil = cadetMemberInformation.length;
	const cmils = cmil !== 1 ? 's' : '';
	for (let i = 0; i < cmil; i++) {
		cadetMemberInformation[i][0].fillColor = i % 2 ? 'lightgrey' : 'white';
		fc = cadetMemberInformation[i][0].fillColor;
		cadetMemberInformation[i][1].fillColor = fc;
		cadetMemberInformation[i][2].fillColor = fc;
		cadetMemberInformation[i][3].fillColor = fc;
		cadetMemberInformation[i][4].fillColor = fc;
		cadetMemberInformation[i][5].fillColor = fc;
		cadetMemberInformation[i][6].fillColor = fc;
	}

	const formattedSeniorMemberInformation = [
		[
			{ text: 'Member', bold: true, fontSize: 10 },
			{ text: 'Grade', bold: true, fontSize: 10 },
			{ text: 'CAPID', bold: true, fontSize: 10 },
			{ text: 'Unit', bold: true, fontSize: 10 },
			{ text: 'Best Phone', bold: true, fontSize: 10 },
			{ text: 'Emer Phone', bold: true, fontSize: 10 },
			{ text: 'Email', bold: true, fontSize: 10 }
		],
		...seniorMemberInformation
	];

	const formattedCadetMemberInformation = [
		[
			{ text: 'Member', bold: true, fontSize: 10 },
			{ text: 'Grade', bold: true, fontSize: 10 },
			{ text: 'CAPID', bold: true, fontSize: 10 },
			{ text: 'Unit', bold: true, fontSize: 10 },
			{ text: 'Best Phone', bold: true, fontSize: 10 },
			{ text: 'Emer Phone', bold: true, fontSize: 10 },
			{ text: 'Email', bold: true, fontSize: 10 }
		],
		...cadetMemberInformation
	];

	let codeString = 'Contact information is preceded by two letters.  The first is ';
	codeString += 'the contact type: P = Parent, C = Cell Phone, E = Email, H = Home Phone, ';
	codeString +=
		'or W = Work Phone.  The second letter is the priority: P = Primary, S = Secondary, ';
	codeString += 'or E = Emergency';
	const nowDate = DateTime.utc();
	const docDefinition = {
		pageSize: 'letter',
		pageOrientation: 'portrait',
		pageMargins: [36, 36, 36, 54],
<<<<<<< HEAD
		footer: function(currentPage: any, pageCount: any) {
=======
		footer(currentPage: number, pageCount: number) {
>>>>>>> 9f095bc0fe16b1cf00e816e9770b2d4cc3507480
			const footerContent = [
				{
					layout: 'noBorders',
					table: {
						widths: [612 - 72],
						headerRows: 0,
						body: [
<<<<<<< HEAD
							[ {text: codeString, fontSize: 9 } ],
							[	{
								layout: 'noBorders',
								table: {
									widths: ['*', '*'],
									headerRows: 0,
									body: [
										[
											{ text: nowDate.toLocaleString({
												year: 'numeric',
												month: '2-digit',
												day: '2-digit'
												}), alignment: 'left', fontSize: 10
											},
											{ text: 'Page ' + currentPage.toString() + ' of ' + pageCount, 
												alignment: 'right', fontSize: 10
											}
=======
							[{ text: codeString, fontSize: 9 }],
							[
								{
									layout: 'noBorders',
									table: {
										widths: ['*', '*'],
										headerRows: 0,
										body: [
											[
												{
													text: nowDate.toLocaleString({
														year: 'numeric',
														month: '2-digit',
														day: '2-digit'
													}),
													alignment: 'left',
													fontSize: 10
												},
												{
													text:
														currentPage.toString() + ' of ' + pageCount,
													alignment: 'right',
													fontSize: 10
												}
											]
>>>>>>> 9f095bc0fe16b1cf00e816e9770b2d4cc3507480
										]
									}
								}
							]
						]
					},
					margin: [36, 2, 36, 2]
				}
			];
			return footerContent;
		},

		content: [
			// content array start
			{
				// title table start
				layout: 'noBorders',
				table: {
					// table def start
					headerRows: 0,
					widths: [90, '*'],
					body: [
						// table body start
						[
							// title section start
							//
							//

							{
								// left column start
								image: join(req.configuration.path, '..', 'images', 'seal.png'),
								width: 90
							}, // left column end

							[
								// right column start
								{
									text: 'Event Sign-Up Roster',
									fontSize: 16,
									bold: true,
									alignment: 'center'
								}, // cell row 1
								{
									// cell row 2
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [28, 80, 50, '*'],
										body: [
											[
												{
													text: 'Date:',
													fontSize: 12,
													bold: true,
													alignment: 'left'
												},
												{
													text: DateTime.fromMillis(
														event.meetDateTime
													).toLocaleString(),
													fontSize: 12,
													bold: false,
													alignment: 'left'
												},
												{
													text: 'Location:',
													fontSize: 12,
													bold: true,
													alignment: 'left'
												},
												{
													text: event.location,
													fontSize: 12,
													bold: false,
													alignment: 'left'
												}
											] // table element array
										] // body
									} // table
								}, // cell row 2 end
								{
									// cell row 3
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [48, '*'],
										body: [
											[
												{
													text: 'Uniform: ',
													fontSize: 12,
													bold: true,
													alignment: 'left'
												},
												{
													text: presentMultCheckboxReturn(
														event.uniform,
														Uniforms,
														false
													),
													fontSize: 12,
													bold: false,
													alignment: 'left'
												}
											], // table element array row 1
											[
												{
													text: 'Activity: ',
													fontSize: 12,
													bold: true,
													alignment: 'left'
												},
												{
													text: presentMultCheckboxReturn(
														event.activity,
														Activities,
														false
													),
													fontSize: 12,
													bold: false,
													alignment: 'left'
												}
											]
										] // body
									} // table
								} // cell row 3 end
							] // right column end

							//
						] // title section end
					] // table body end
				} // table def end
			}, // title table end

			{ text: ' ' }, // spacer
			{
				text: sqnNum + '   ' + sqnName,
				bold: true
			},

			...(smil > 0
				? [
						{
							text: ' '
						}, // spacer
						{
							text: '[' + smil + '] Senior Member' + smils,
							bold: true,
							alignment: 'center'
						},
						{
							// content table start
							layout: 'noBorders',
							table: {
								// table def start
								headerRows: 1,
								widths: [88, 29, 32, 53, 65, 65, '*'],
								body: formattedSeniorMemberInformation
							} // table def end
						}
				  ]
				: []), // content table end

			...(cmil > 0
				? [
						{
							text: ' '
						}, // spacer
						{
							text: '[' + cmil + '] Cadet Member' + cmils,
							bold: true,
							alignment: 'center'
						},
						{
							// content table start
							layout: 'noBorders',
							table: {
								// table def start
								headerRows: 1,
								widths: [84, 31, 31, 54, 70, 70, '*'],
								body: formattedCadetMemberInformation
							} // table def end
						}
				  ]
				: []), // content table end

			{ text: ' ' }, // spacer
			{
				// ending table start
				layout: 'noBorders',
				table: {
					// table def start
					headerRows: 0,
					body: [
						// table body start
						[
							// header row start
							//
							{
								table: {
									widths: [120, 120, 120, 120],
									body: [
										['Name', 'Phone', 'Email', 'Sponsor Name'],
										[' ', '', '', ''],
										[
											{ text: ' ', fillColor: 'lightgrey' },
											{ text: ' ', fillColor: 'lightgrey' },
											{ text: ' ', fillColor: 'lightgrey' },
											{ text: ' ', fillColor: 'lightgrey' }
										],
										[' ', '', '', ''],
										[
											{ text: ' ', fillColor: 'lightgrey' },
											{ text: ' ', fillColor: 'lightgrey' },
											{ text: ' ', fillColor: 'lightgrey' },
											{ text: ' ', fillColor: 'lightgrey' }
										],
										[' ', '', '', ''],
										[
											{ text: ' ', fillColor: 'lightgrey' },
											{ text: ' ', fillColor: 'lightgrey' },
											{ text: ' ', fillColor: 'lightgrey' },
											{ text: ' ', fillColor: 'lightgrey' }
										],
										[' ', '', '', '']
									]
								}
							}
						] // header row end
					] // table body end
				} // table def end
			} // ending table end
		] // content array end
	}; // doc def end

	res.status(200);
	// res.setHeader('Content-Disposition','attachment:filename=log.pdf');

	try {
		const doc = maker.createPdfKitDocument(docDefinition);
		// doc.pipe(createWriteStream('testing.pdf'));
		doc.pipe(res);
		doc.end();
	} catch (e) {
		res.status(500);
		res.end();
	}

	// json<AttendanceRecord[]>(res, event.attendance);
});
// http://localhost:3001/api/event/2/attendance/log
