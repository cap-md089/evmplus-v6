import * as express from 'express';
import * as fs from 'fs';
import * as moment from 'moment';
import { basename, join } from 'path';
import { v4 as uuid } from 'uuid';
import { Configuration as config } from '../../../conf';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/Member';
import { prettySQL } from '../../../lib/MySQLUtil';

const parseHeaders = (lines: string[]) => {
	let headers: {[key: string]: string} = {};
	for (let line of lines) {
		let parts = line.split(': ');
		let header = parts[0].toLowerCase();
		headers[header] = parts[1];
	}
	return headers;
};

const endingToMime = (ending: string): string => {
	let mimes: {[key: string]: string} = {
		'png': 'image/png',
		'jpg': 'image/jpg',
		'jpeg': 'image/jpeg',
		'gif': 'image/gif',
		'txt': 'text/plain',
		'text': 'text/plain'
	};

	if (typeof mimes[ending] === 'undefined') {
		return 'application/octet-stream';
	}

	return mimes[ending];
};

const isImage = (ending: string): boolean => {
	return [
		'png',
		'jpg',
		'jpeg',
		'gif',
		'bmp'
	].indexOf(ending) > -1;
};

const findEnding = (input: Buffer, boundary: string) => {
	const index = input.length - boundary.length;
	const testBoundary = input.slice(index).toString();

	if (testBoundary === boundary) {
		return index;
	}

	return input.length;
};

fs.exists(config.fileStoragePath, exists => {
	if (!exists) {
		fs.mkdirSync(config.fileStoragePath, 0o755);
	}
});

export default (req: MemberRequest & AccountRequest, res: express.Response) => {
	if (
		typeof req.account === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	let collectingData = false;
	let fileName = '';
	let boundary = '';
	let writeStream: fs.WriteStream;
	
	/*
		File data plan:

		1. Store FILE on disk
		2. Filename will be a UUID (there already happens to be a UUID library for tokens...)
		3. MySQL database will store METADATA (Author, filename, etc)
	*/
	req.on('data', info => {
		if (typeof info === 'string') {
			// Handle binary data
			info = new Buffer(info);
		}	
		// Start looking for headers
		if (!collectingData) {
			// Record headers
			let headerString = '';
			let i = 0;
			while (!(
				info.slice(i, i + 4).toString() === '\r\n\r\n'
			)) {
				headerString += String.fromCharCode(info[i++]);
			}
			i += 4;
			// It has the headers recorded; standards say that the headers are defined as ending
			// when there is a double \r\n

			// Get headers
			let firstLines = headerString.split('\r\n');
	
			boundary = '\r\n' + firstLines[0] + '--\r\n';
			
			let headers = parseHeaders(firstLines);

			// Get file name
			let query = headers['content-disposition']
				.split(/; ?/)
				.map(str => str.split(/ ?\= ?/))
				.filter(pair => pair[0].match(/filename/))[0][1];
			fileName = basename(JSON.parse(query));
		
			// Get file ending and mime type
			const endingArray = fileName.split('.');
			const ending = endingArray[endingArray.length - 1];
			let contentType = headers['content-type'];
			if (!contentType) {
				contentType = endingToMime(ending);
			}

			// Start to write to disk
			let realFilename = `${req.account.id}-${uuid()}`;
			writeStream = fs.createWriteStream(join(config.fileStoragePath, realFilename));
			writeStream.write(info.slice(i, findEnding(info, boundary)));

			collectingData = true;

			const created = Math.floor(moment().valueOf() / 1000);

			// Wait until query is finished and data is written before closing file and connection
			Promise.all([
				new Promise((resolve, rej) => {
					req.on('end', () => {
						writeStream.close();
						resolve();
					});
				}),
				// Insert into the database metadata
				req.connectionPool.query(
					prettySQL`
						INSERT INTO
							FileInfo (
								id, 
								uploaderID, 
								fileName, 
								comments, 
								contentType, 
								created, 
								memberOnly, 
								forDisplay, 
								forSlideshow, 
								accountID
							)
						VALUES
							(
								?,
								?,
								?,
								?,
								?,
								?,
								?,
								?,
								?,
								?
							)
					`,
					[
						realFilename,
						0,
						fileName,
						'',
						contentType,
						created,
						0,
						isImage(ending) ? 1 : 0,
						0,
						req.account.id
					]
				)
			]).then(result => {
				// Return results
				res.json({
					id: realFilename,
					uploaderID: 0,
					fileName,
					comments: '',
					contentType,
					created,
					memberOnly: 0,
					forDisplay: 1,
					forSlideshow: 0,
					accountID: req.account.id
				});
			}).catch(err => {
				console.log(err);
				res.status(500);
				res.end();	
			});
		} else {
			// Adds more data to file. If it finds the ending, it will not get to this section again
			let newData = info.slice(
				0,
				findEnding(info, boundary)
			);
			writeStream.write(newData);
		}
		req.resume();
	});
};
