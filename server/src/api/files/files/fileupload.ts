import * as express from 'express';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import { lookup } from 'mime-types';
import { basename, join } from 'path';
import { v4 as uuid } from 'uuid';
import { Configuration as config } from '../../../conf';
import { MemberRequest } from '../../../lib/MemberBase';
import { json } from '../../../lib/Util';

const parseHeaders = (lines: string[]) => {
	const headers: { [key: string]: string } = {};
	for (const line of lines) {
		const parts = line.split(': ');
		const header = parts[0].toLowerCase();
		headers[header] = parts[1];
	}
	return headers;
};

const endingToMime = (ending: string): string =>
	lookup(ending) || 'application/octet-stream';

export const isImage = (ending: string): boolean => {
	return ['png', 'jpg', 'jpeg', 'gif', 'bmp'].indexOf(ending) > -1;
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

export default (req: MemberRequest, res: express.Response) => {
	if (typeof req.member === 'undefined') {
		res.status(403);
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
			while (!(info.slice(i, i + 4).toString() === '\r\n\r\n')) {
				headerString += String.fromCharCode(info[i++]);
			}
			i += 4;
			// It has the headers recorded; standards say that the headers are defined as ending
			// when there is a double \r\n

			// Get headers
			const firstLines = headerString.split('\r\n');

			boundary = '\r\n' + firstLines[0] + '--\r\n';

			const headers = parseHeaders(firstLines);

			// Get file name
			const query = headers['content-disposition']
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

			const id = uuid();

			// Start to write to disk
			const realFilename = `${req.account.id}-${id}`;
			writeStream = fs.createWriteStream(
				join(config.fileStoragePath, realFilename)
			);
			writeStream.write(info.slice(i, findEnding(info, boundary)));

			collectingData = true;

			const created = Math.floor(+DateTime.utc() / 1000);

			const filesCollection = req.mysqlx.getCollection<FileObject>(
				'Files'
			);

			const uploadedFile: FileObject = {
				kind: 'drive#file',
				id,
				accountID: req.account.id,
				comments: '',
				contentType,
				created,
				fileName,
				forDisplay: isImage(ending),
				forSlideshow: false,
				memberOnly: false,
				uploaderID: req.member.id,
				fileChildren: [],
				parentID: 'root'
			};

			// Wait until query is finished and data is written before closing connection
			Promise.all([
				new Promise(resolve => {
					req.on('end', () => {
						writeStream.close();
						resolve();
					});
				}),
				// Insert into the database metadata
				filesCollection.add(uploadedFile).execute()
			])
				.then(() => {
					// Return results
					json<FileObject>(res, uploadedFile);
				})
				.catch(err => {
					// tslint:disable-next-line:no-console
					console.log(err);
					res.status(500);
					res.end();
				});
		} else {
			// Adds more data to file. If it finds the ending, it will not get to this section again
			const newData = info.slice(0, findEnding(info, boundary));
			writeStream.write(newData);
		}
		req.resume();
	});
};
