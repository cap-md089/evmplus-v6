import { Response } from 'express';
import * as PDFMake from 'pdfmake';
import { join } from 'path';
import { AccountRequest, asyncErrorHandler, Event, CAPNHQMember } from '../../../lib/internals';
import accountcheck from '../../accountcheck';
import { FileUserAccessControlPermissions } from 'common-lib';

export default asyncErrorHandler(async (req: AccountRequest<{ id: string }>, res: Response) => {
	const fonts = {
		Roboto: {
			normal: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-Regular.ttf'),
			bold: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-Medium.ttf'),
			italics: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-Italic.ttf'),
			bolditalics: join(req.configuration.path, '..', 'images', 'fonts', 'Roboto-MediumItalic.ttf')
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

	const memberInformation: string[][] = [];

	for await (const member of req.account.getMembers()) {
		if (!member.seniorMember) {
			memberInformation.push([
				member.getNameLFMI(),
				member.memberRank,
				member.id.toString(),
				member instanceof CAPNHQMember ? member.expirationDateObject.toLocaleString(
					{ year: "numeric", month: "2-digit", day: "2-digit" }) : 'N/A',
				' ',
				member.flight || 'Unassigned'
			]);
		}
	}
	//{text: 'Benthall, Ashlee', bold: false, fillColor: 'lightgrey'},

	memberInformation.sort((a, b) => a[0].localeCompare(b[0]));

	const formattedMemberInformation = [
		[
			{ text: 'Member', bold: true, fontSize: 11 },
			{ text: 'Grade', bold: true, fontSize: 11 },
			{ text: 'CAPID', bold: true, fontSize: 11 },
			{ text: 'Expiration', bold: true, fontSize: 11 },
			{ text: 'Signature', bold: true, fontSize: 11 },
			{ text: 'Flight', bold: true, fontSize: 11 }
		],
		...memberInformation.map((elem, i) => [
			{ text: elem[0], bold: false, fontSize: 11, fillColor: i % 2 == 0 ? 'lightgrey' : 'white' },
			{ text: elem[1], bold: false, fontSize: 11, fillColor: i % 2 == 0 ? 'lightgrey' : 'white' },
			{ text: elem[2], bold: false, fontSize: 11, fillColor: i % 2 == 0 ? 'lightgrey' : 'white' },
			{ text: elem[3], bold: false, fontSize: 11, fillColor: i % 2 == 0 ? 'lightgrey' : 'white' },
			{ text: elem[4], bold: false, fontSize: 11, fillColor: i % 2 == 0 ? 'lightgrey' : 'white' },
			{ text: elem[5], bold: false, fontSize: 11, fillColor: i % 2 == 0 ? 'lightgrey' : 'white' }
		])
	];

	const docDefinition = {
		content: [ //content array start
			{ //title table start
				layout: 'noBorders',
				table: { //table def start
					headerRows: 0,
					widths: [90, '*'],
					body: [ //table body start
						[ //title section start	
							//
							//

							{ //left column start
								image: join(req.configuration.path, '..', 'images', 'seal.png'),
								width: 90
							}, //left column end

							[ //right column start
								{ text: 'Cadet Attendance Log', fontSize: 14, bold: true, alignment: 'center' }, //cell row 1
								{ //cell row 2
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [26, 100, 48, '*'],
										body: [
											[
												{ text: 'Date: ', fontSize: 12, bold: true, alignment: 'left' },
												{ text: 'Wed Sep 11 2019', fontSize: 12, bold: false, alignment: 'left' },
												{ text: 'Location: ', fontSize: 12, bold: true, alignment: 'left' },
												{ text: 'Civil Air Patrol St. Mary\'s Composite Squadron', fontSize: 12, bold: false, alignment: 'left' }
											] //table element array
										] //body
									} //table
								}, //cell row 2 end
								{ //cell row 3
									layout: 'noBorders',
									table: {
										headerRows: 0,
										widths: [48, '*'],
										body: [
											[
												{ text: 'Uniform: ', fontSize: 12, bold: true, alignment: 'left' },
												{ text: 'Battle Dress Uniform', fontSize: 12, bold: false, alignment: 'left' }
											], //table element array row 1
											[
												{ text: 'Activity: ', fontSize: 12, bold: true, alignment: 'left' },
												{ text: 'Squadron Meeting, Classroom/Tour/Light', fontSize: 12, bold: false, alignment: 'left' }
											]
										] //body
									} //table
								} //cell row 3 end
							] //right column end

							//
						] //title section end
					] //table body end
				} //table def end
			}, //title table end

			{ text: ' ' }, //spacer
			{ text: 'MAR-MD-089/890   ST MARYS COMPOSITE SQDN/ESPERANZA MIDDLE SCHOOL FLIGHT', bold: true },
			{ //content table start
				layout: 'noBorders',
				table: { //table def start
					headerRows: 1,
					widths: [130, 52, 45, 70, '*', 70],
					body: formattedMemberInformation

					/*					body: [ //table body start
											[ //header row start
												{text: 'Member', bold: true},
												{text: 'Grade', bold: true},
												{text: 'CAPID', bold: true},
												{text: 'Expiration', bold: true},
												{text: 'Signature', bold: true},
												{text: 'Flight', bold: true}
											], //header row end
											[ //content odd row start	
												{text: 'Baldauff, Isaac W', bold: false},
												{text: 'C/SSgt', bold: false},
												{text: '456123', bold: false},
												{text: '2020-01-31', bold: false},
												{text: '', bold: false},
												{text: 'XRay', bold: false}
											], //content odd row end
											[ //content even row start	
												{text: 'Baldauff, Samuel P', bold: false, fillColor: 'lightgrey'},
												{text: 'C/A1C', bold: false, fillColor: 'lightgrey'},
												{text: '456123', bold: false, fillColor: 'lightgrey'},
												{text: '2020-01-31', bold: false, fillColor: 'lightgrey'},
												{text: '', bold: false, fillColor: 'lightgrey'},
												{text: 'XRay', bold: false, fillColor: 'lightgrey'}
											], //content even row end
											[ //content odd row start	
												{text: 'Barrett, Amelia A', bold: false},
												{text: 'C/Amn', bold: false},
												{text: '456123', bold: false},
												{text: '2020-01-31', bold: false},
												{text: '', bold: false},
												{text: 'XRay', bold: false}
											], //content odd row end
											[ //content even row start	
												{text: 'Benthall, Ashlee', bold: false, fillColor: 'lightgrey'},
												{text: 'C/AB', bold: false, fillColor: 'lightgrey'},
												{text: '456123', bold: false, fillColor: 'lightgrey'},
												{text: '2020-01-31', bold: false, fillColor: 'lightgrey'},
												{text: '', bold: false, fillColor: 'lightgrey'},
												{text: 'XRay', bold: false, fillColor: 'lightgrey'}
											] //content even row end
										] //table body end
					*/
				} //table def end
			}, //content table end


			{ text: ' ' }, //spacer
			{ //ending table start
				layout: 'noBorders',
				table: { //table def start
					headerRows: 0,
					body: [ //table body start
						[ //header row start	
							//
							{
								table: {
									widths: [120, 120, 120, 120],
									body: [
										['Name', 'Phone', 'Email', 'Sponsor Name'],
										[' ', '', '', ''],
										[{ text: ' ', fillColor: 'lightgrey' }, { text: ' ', fillColor: 'lightgrey' },
										{ text: ' ', fillColor: 'lightgrey' }, { text: ' ', fillColor: 'lightgrey' }],
										[' ', '', '', ''],
										[{ text: ' ', fillColor: 'lightgrey' }, { text: ' ', fillColor: 'lightgrey' },
										{ text: ' ', fillColor: 'lightgrey' }, { text: ' ', fillColor: 'lightgrey' }],
										[' ', '', '', ''],
										[{ text: ' ', fillColor: 'lightgrey' }, { text: ' ', fillColor: 'lightgrey' },
										{ text: ' ', fillColor: 'lightgrey' }, { text: ' ', fillColor: 'lightgrey' }],
										[' ', '', '', '']
									]
								}
							}
						] //header row end
					] //table body end
				} //table def end
			} //ending table end



		] //content array end
	}; //doc def end

	res.status(200);
	// res.setHeader('Content-Disposition','attachment:filename=log.pdf');

	try {
		const doc = maker.createPdfKitDocument(docDefinition);
		//doc.pipe(createWriteStream('testing.pdf'));
		doc.pipe(res);
		doc.end();
	} catch (e) {
		res.status(500);
		res.end();
	}

	//json<AttendanceRecord[]>(res, event.attendance);
});
//http://localhost:3001/api/event/2/attendance/log