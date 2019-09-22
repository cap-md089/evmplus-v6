import { Response } from 'express';
import { DateTime, Duration } from 'luxon';
import { join } from 'path';
import { formatPhone } from '../../lib/Util';
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
} from '../../lib/internals';
import accountcheck from '../accountcheck';
import { Recoverable } from 'repl';

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

function expireFlag(dte: DateTime) {
	const dateFlag = DateTime.utc();
	dateFlag.plus(Duration.fromObject({ days: 30 }));
	return dte < dateFlag;
}

function expiredFlag(dte: DateTime) {
	const dateFlag = DateTime.utc();
	return dte < dateFlag;
}

const boxChecked = (boxSize: number, vOffset: number) => ({
	canvas: [
		{type: 'rect', x: 0, y: vOffset, w: boxSize, h: boxSize, lineColor: 'black' },
		{type: 'line', x1: 0, y1: vOffset, x2: boxSize, y2: boxSize + vOffset, lineColor: 'black'},
		{type: 'line', x1: 0, y1: boxSize + vOffset, x2: boxSize, y2: vOffset, lineColor: 'black'}
	]
});

const boxUnchecked = (boxSize: number, vOffset: number) => ({
	canvas: [
		{type: 'rect', x: 0, y: vOffset, w: boxSize, h: boxSize, lineColor: 'black' },
	]
});

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
		{ Orgid: 2529, Region: 'MAR', Wing: 'MD', Unit: '890', Name: 'ESPERANZA MIDDLE SCHOOL FLIGHT' }
	];
	let sqnNum = myOrg[0].Region + '-' + myOrg[0].Wing + '-';
	let sqnName = '';
	for (let w = 0; w < myOrg.length; w++) {
		sqnNum += myOrg[w].Unit + '/';
		sqnName += myOrg[w].Name + '/';
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
		const member = await resolveReference(memberRecord.memberID, req.account, req.mysqlx); // need to Estimate member here to access member information *****
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
				text:
					member.squadron,
				bold:
					req.account.orgIDs.includes(member.orgid) ? false : true,
				fontSize
			},
			{ text: getBestPhone(member).source + ' ' + formatPhone(getBestPhone(member).contact), fontSize },
			{ text: getEmerPhone(member).source + ' ' + formatPhone(getEmerPhone(member).contact), fontSize },
			{ text: getBestEmail(member).source + ' ' + getBestEmail(member).contact, fontSize }
		]);
	}

	seniorMemberInformation.sort((a, b) => a[0].text.localeCompare(b[0].text));
	cadetMemberInformation.sort((a, b) => a[0].text.localeCompare(b[0].text));

	let fc = '';
	const smil = seniorMemberInformation.length;
	const smils = smil !== 1 ? "s" : "";
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
	const cmils = cmil !== 1 ? "s" : "";
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

	const myTitleFontSize = 10;
	const myTextFontSize = 9;
	const mySmallFontSize = 7;
	const boxSize = 8;
	const vOffset = myTextFontSize - boxSize;
	const getBox = (checked: boolean = false) => (checked ? boxChecked : boxUnchecked)(boxSize, vOffset);

	const myTest = true;
	const eventNumber = myTest ? [
		{ 
			text: [
				{ text: 'Event Number: ', bold: true, fontSize: myTextFontSize },
				{ 
					text: myOrg[0].Region + '-' + myOrg[0].Wing + '-' + myOrg[0].Unit + '-' + event.id, 
					bold: false, fontSize: myTextFontSize 
				}
			]
		}
	] : [];
	const eventName = myTest ? [
		{
			text: [
				{ text: 'Event Name: ', bold: true, fontSize: myTextFontSize },
				{ text: event.name, bold: false, fontSize: myTextFontSize }
			]
		}
	] : [];
	const eventComments = myTest ? [
		{
			text: [
				{ text: 'Comments: ', bold: true, fontSize: myTextFontSize },
				{ text: event.comments, bold: false, fontSize: myTextFontSize }
			]
		}
	] : [];
	const eventStatus = [
		{ text: event.status, bold: false, fontSize: myTextFontSize }
	]
	const meetLocation = [
		{ text: event.meetLocation, bold: false, fontSize: myTextFontSize }
	]
	const eventLocation = [
		{ text: event.location, bold: false, fontSize: myTextFontSize }
	]
	const pickupLocation = [
		{ text: event.pickupLocation, bold: false, fontSize: myTextFontSize }
	]
	
	let codeString = 'Contact information is preceded by two letters.  The first is ';
	codeString += 'the contact type: P = Parent, C = Cell Phone, E = Email, H = Home Phone, ';
	codeString += 'or W = Work Phone.  The second letter is the priority: P = Primary, S = Secondary, ';
	codeString += 'or E = Emergency';
	const nowDate = DateTime.utc();
	const docDefinition = {
		pageSize: 'letter',
		pageOrientation: 'portrait',
		pageMargins: [12, 12, 12, 54],
		footer(currentPage: any, pageCount: any) {
			const footerContent = [ 
				{ 
					layout: 'noBorders',
					table: {
						widths: [ 612-36 ],
						headerRows: 0,
						body: [
							[ {text: codeString, fontSize: 9 } ],
							[	{
								layout: 'noBorders',
								table: {
									widths: [ '*', 306, '*' ],
									headerRows: 0,
									body: [
										[	
				                        	{
				                                text: 'CAP Form 60-80 Feb 2018',
				                                bold: true,
				                                fontSize: mySmallFontSize
				                            },
				                            {
				                                text: '(Local version) -- ' + nowDate.toLocaleString({
													year: 'numeric',
													month: '2-digit',
													day: '2-digit'
													}),
												bold: false,
												fontSize: mySmallFontSize
				                            },
				                            {
				                                text: 'Page ' + currentPage.toString() + ' of ' + pageCount,
												bold: false,
												fontSize: mySmallFontSize,
				                                alignment: 'right'
				                            }
										]
									]
								}
							}
						]
					]
					}, margin: [12, 2, 12, 2]
				}
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
					widths: [ 612-36 ],
					body: [
						[ // row 1
							[{ text: 'CIVIL AIR PATROL CADET ACTIVITY PERMISSION SLIP', fontSize: 15, bold: true, alignment: 'center' },
							{ text: 'SUGGESTED BEST PRACTICE for LOCAL \"WEEKEND\" ACTIVITIES:', fontSize: mySmallFontSize, bold: false, alignment: 'center' },
							{ text: 'Announce the activity at least 2 weeks in advance and require participating cadets to sign up via this form 1 week prior to the event', fontSize: mySmallFontSize, bold: false, alignment: 'center' }]
						], // row 1
						[ // row 2 
							[{text: '1. INFORMATION on the PARTICIPATING CADET', bold: true, alignment: 'center', fontSize: myTitleFontSize},
							{
								layout: 'noBorders',
								table: {
									headerRows: 0,
									widths: [ 96, '*', 40, 50 ],
									body: [
										[{ text: 'Cadet Grade & Name:', bold: true, fontSize: myTextFontSize },
										{ text: 'C/CMSgt Claudia Gemmel', fontSize: myTextFontSize },
										{ text: 'CAPID:', bold: true, fontSize: myTextFontSize },
										{ text: '123456', fontSize: myTextFontSize }]
									]
								}
							},
							{
								layout: 'noBorders',
								table: {
									headerRows: 0,
									widths: [ 96, 60, 32, 80, 28, '*' ],
									body: [
										[{ text: 'Unit Charter Number:', bold: true, fontSize: myTextFontSize },
										{ text: 'MAR-MD-089', fontSize: myTextFontSize },
										{ text: 'Phone:', bold: true, fontSize: myTextFontSize },
										{ text: 'CP 123.456.7890\nPE 123.456.7890', fontSize: myTextFontSize },
										{ text: 'Email:', bold: true, fontSize: myTextFontSize },
	                                	{ text: 'EP my.email.address@google.mail.com', fontSize: myTextFontSize}]
									]
								}
							}]
						], // row 2
						[ // row 3
							[{text: '2. INFORMATION about the ACTIVITY', bold: true, alignment: 'center', fontSize: myTitleFontSize},
							{
								layout: 'noBorders',
								table: {
									headerRows: 0,
									widths: [ 68, '*', 60, 58 ],
									body: [
										[{ text: 'Activity Name:', bold: true, fontSize: myTextFontSize },
										{ text: 'TAG Change of Command', bold: true, fontSize: myTitleFontSize,
											decoration: 'underline' },
										{ text: 'Activity Date:', bold: true, fontSize: myTextFontSize },
										{ text: 
											nowDate.toLocaleString({
												year: 'numeric',
												month: '2-digit',
												day: '2-digit'
												})
											, fontSize: myTextFontSize}]
									]
								}
							},
							{
								layout: 'noBorders',
								table: {
									headerRows: 0,
									widths: [ 280, '*' ],
									body: [
										[{ text: 'For hotel-based activity or conference', bold: false, fontSize: myTextFontSize },
										{ text: 'For hotel-based activity or conference', bold: false, fontSize: myTextFontSize }]
									]
								}
							},
							{
								layout: 'noBorders',
								table: {
									headerRows: 0,
									widths: [ 280, '*' ],
									body: [
										[{ text: 'Grade & Name of Supervising Senior:', bold: true, fontSize: myTextFontSize },
										{ text: 'Grade & Name of Supervising Senior', bold: true, fontSize: myTextFontSize }]
									]
								}
							}
							]
						], // row 3
						[ // row 4 
							[
								{text: '3. PARENT\'s or GUARDIAN\'s CONTACT INFORMATION', bold: true, alignment: 'center', fontSize: myTitleFontSize},
								{
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [ 80, 90, 65, '*', 100, 80 ],
										body: [
											[
												{ text: 'Parent or Guardian Name:', bold: true, fontSize: myTextFontSize },
												{ text: '' },
												{ text: 'Relationship to Cadet:', bold: true, fontSize: myTextFontSize },
												{ text: '' },
												{ text: 'Contact Number on Date(s) of Activity:', bold: true, fontSize: myTextFontSize },
												{ text: '' }
											]
										]
									}
								}
							]
						], // row 4
						[ // row 5 
							[
								{text: '4. OTHER DOCUMENTS REQUIRED TO PARTICIPATE', bold: true, alignment: 'center', fontSize: myTitleFontSize},
								{text: 'Check those that apply and attach with this form', fontSize: mySmallFontSize, alignment: 'center'},
								{
									layout: 'noBorders',
									table: {
										widths: [ myTextFontSize, 45, 215, myTextFontSize, 45, '*' ],
										body: [
											[
												getBox(true), 
												{ text: 'CAPF 31', bold: true, fontSize: myTextFontSize },
												{ text: 'Application for Special Activity', fontSize: myTextFontSize },
												getBox(false), 
												{ text: 'CAPF 160', bold: true, fontSize: myTextFontSize },
												{ text: 'CAP Member Health History Form', fontSize: myTextFontSize }
											],
											[
												getBox(false), // ...boxVal3,
												{ text: 'CAPF 161', bold: true, fontSize: myTextFontSize },
												{ text: 'Emergency Information', fontSize: myTextFontSize },
												{ text: 'Other/Special Local Local Forms (specify)', fontSize: myTextFontSize, colSpan: 3, rowSpan: 2 },
												{},
												{}
											],
											[
												getBox(false), // ...boxVal4,
												{ text: 'CAPF 163', bold: true, fontSize: myTextFontSize },
												{ text: 'Provision of Minor Over the Counter Medication', fontSize: myTextFontSize },
												{},
												{},
												{}
											]
										]
									}
								} 

							]
						], // row 5
						[ // row 6
							[
								{text: '5. PARENT\'s or GUARDIAN\'s AUTHORIZATION', bold: true, alignment: 'center', fontSize: myTitleFontSize},
								{text: 'Cadets who have reached the age of majority, write \"N/A\"', alignment: 'center', fontSize: mySmallFontSize},
								{
									layout: 'noBorders',
									table: {
										widths: [ 160, 200, '*' ],
										body: [
											[
												{text: 'I authorize my cadet to participate in the activity described above', bold: true, fontSize: myTextFontSize},
												{text: 'Signature:', bold: true, fontSize: myTextFontSize},
												{text: 'Date:', bold: true, fontSize: myTextFontSize}
											]
										]
									}
								}, 
								{text: 'Disposition: Units must destroy this form and associated forms when the activity concludes', alignment: 'center', fontSize: mySmallFontSize},
							]
						], // row 6
						[ // row 7
							[
								{text: 'Please detach on the dashed line.  The upper portion is for CAP and the lower portion is for the parent\'s or guardian\'s reference.', 
									bold: true, alignment: 'center', fontSize: mySmallFontSize },
								{canvas: [
									{ type: 'line', x1: 0, y1: 3, x2: 576, y2: 3, lineColor: 'black', dash: { length: 5 } },
									{ type: 'line', x1: 0, y1: 0, x2: 0, y2: 6, lineColor: 'white'}
								]},
								{text: '6. HELPFUL INFORMATION FOR PARENTS & GUARDIANS', bold: true, alignment: 'center', fontSize: myTitleFontSize},
								{ // row 7 inner table
									layout: 'noBorders',
									table: {
										widths: [ 273, '*' ],
										body: [
											[
												[
													...eventNumber,
													...eventName,
													// ...eventComments
												],
												[
													{ text: [
															{ text: 'Meet Loc: ', bold: true, fontSize: myTextFontSize },
															...meetLocation
														]
													},
													{ text: [
															{ text: 'Event Loc: ', bold: true, fontSize: myTextFontSize },
															...eventLocation
														]
													},
													{ text: [
															{ text: 'Pickup Loc: ', bold: true, fontSize: myTextFontSize },
															...pickupLocation
														]
													},
												]
											]
										]
									}
								}, // row 7 inner table
								...eventComments,
								{ text: 'mywidetext that spans across the two paltry columns located above', fontSize: myTextFontSize }
							]
						] // row 7
					]
				} // table def end
			}, // title table end

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
