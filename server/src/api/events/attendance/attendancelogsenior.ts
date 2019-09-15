import { Response } from 'express';
import { DateTime, Duration } from 'luxon';
import { join } from 'path';
import * as PDFMake from 'pdfmake';
import {
	AccountRequest,
	asyncErrorHandler,
	CAPNHQMember,
	Event,
	presentMultCheckboxReturn
} from '../../../lib/internals';

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

	const memberInformation: Array<
		Array<{
			text: string;
			bold?: boolean;
			fontSize?: number;
			fillColor?: string;
			borderColor?: string[];
		}>
	> = [];

	const fontSize = 9;
	let isGray = true;
	for await (const member of req.account.getMembers()) {
		if (member.seniorMember) {
			memberInformation.push([
				{ text: member.getNameLFMI(), fontSize },
				{ text: member.memberRank, fontSize },
				{ text: member.id.toString(), fontSize },
				{
					text:
						member instanceof CAPNHQMember
							? member.expirationDateObject.toLocaleString({
									year: 'numeric',
									month: '2-digit',
									day: '2-digit'
							  })
							: 'N/A',
					bold:
						member instanceof CAPNHQMember
							? expireFlag(member.expirationDateObject)
								? true
								: false
							: false,
					fontSize
				},
				{ text: ' ', fontSize }
			]);

			isGray = !isGray;
		}
	}

	memberInformation.sort((a, b) => a[0].text.localeCompare(b[0].text));

	for (let i = 0; i < memberInformation.length; i++) {
		memberInformation[i][0].fillColor = i % 2 ? 'lightgrey' : 'white';
		memberInformation[i][0].borderColor = [
			memberInformation[i][0].fillColor,
			memberInformation[i][0].fillColor,
			memberInformation[i][0].fillColor
		];
		memberInformation[i][1].fillColor = i % 2 ? 'lightgrey' : 'white';
		memberInformation[i][1].borderColor = [
			memberInformation[i][0].fillColor,
			memberInformation[i][0].fillColor,
			memberInformation[i][0].fillColor
		];
		memberInformation[i][2].fillColor = i % 2 ? 'lightgrey' : 'white';
		memberInformation[i][2].borderColor = [
			memberInformation[i][0].fillColor,
			memberInformation[i][0].fillColor,
			,
		];
		memberInformation[i][3].fillColor = i % 2 ? 'lightgrey' : 'white';
		memberInformation[i][3].borderColor = memberInformation[i][3].bold
			? ['black', 'black', 'black', 'black']
			: [
					memberInformation[i][3].fillColor,
					memberInformation[i][3].fillColor,
					memberInformation[i][3].fillColor
			  ];
		memberInformation[i][4].fillColor = i % 2 ? 'lightgrey' : 'white';
		memberInformation[i][4].borderColor = [
			memberInformation[i][0].fillColor,
			memberInformation[i][0].fillColor,
			memberInformation[i][0].fillColor
		];
	}
	memberInformation[memberInformation.length - 1][0].borderColor = [
		memberInformation[memberInformation.length - 1][0].fillColor,
		memberInformation[memberInformation.length - 1][0].fillColor,
		memberInformation[memberInformation.length - 1][0].fillColor,
		'white'
	];
	memberInformation[memberInformation.length - 1][1].borderColor = [
		memberInformation[memberInformation.length - 1][0].fillColor,
		memberInformation[memberInformation.length - 1][0].fillColor,
		memberInformation[memberInformation.length - 1][0].fillColor,
		'white'
	];
	memberInformation[memberInformation.length - 1][2].borderColor = [
		memberInformation[memberInformation.length - 1][0].fillColor,
		memberInformation[memberInformation.length - 1][0].fillColor,
		memberInformation[memberInformation.length - 1][3].bold
			? 'black'
			: memberInformation[memberInformation.length - 1][0].fillColor,
		'white'
	];
	memberInformation[memberInformation.length - 1][4].borderColor = [
		memberInformation[memberInformation.length - 1][0].fillColor,
		memberInformation[memberInformation.length - 1][0].fillColor,
		memberInformation[memberInformation.length - 1][0].fillColor,
		'white'
	];

	const formattedMemberInformation = [
		[
			{ text: 'Member', bold: true, fontSize: 10, borderColor: ['white', 'white'] },
			{ text: 'Grade', bold: true, fontSize: 10, borderColor: ['white', 'white'] },
			{ text: 'CAPID', bold: true, fontSize: 10, borderColor: ['white', 'white'] },
			{ text: 'Expiration', bold: true, fontSize: 10, borderColor: ['white', 'white'] },
			{
				text: 'Signature',
				bold: true,
				fontSize: 10,
				borderColor: ['white', 'white', 'white']
			}
		],
		...memberInformation
	];

	const docDefinition = {
		pageSize: 'letter',
		pageOrientation: 'portrait',
		pageMargins: [36, 36, 36, 54],
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
							}, //         left column end

							[
								// right column start
								{
									text: 'Senior Attendance Log',
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
				text:
					req.account.mainOrg + 'ST MARYS COMPOSITE SQDN/ESPERANZA MIDDLE SCHOOL FLIGHT',
				bold: true
			},
			{
				// content table start
				// layout: 'noBorders',
				table: {
					// table def start
					headerRows: 1,
					widths: [110, 38, 40, 55, '*'],
					body: formattedMemberInformation
				} // table def end
			}, // content table end

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
