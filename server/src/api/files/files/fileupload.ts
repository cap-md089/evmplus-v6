import { FullFileObject, MemberReference, RawFileObject } from 'common-lib';
import { FileUserAccessControlPermissions, FileUserAccessControlType } from 'common-lib/index';
import * as express from 'express';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import { lookup } from 'mime-types';
import { basename, join } from 'path';
import { v4 as uuid } from 'uuid';
import { Configuration as config } from '../../../conf';
import { File, json, MemberRequest } from '../../../lib/internals';
import { validRawToken } from '../../formtoken';

const parseHeaders = (lines: string[]) => {
	const headers: { [key: string]: string } = {};
	for (const line of lines) {
		const parts = line.split(': ');
		const header = parts[0].toLowerCase();
		headers[header] = parts[1];
	}
	return headers;
};

const endingToMime = (ending: string): string => lookup(ending) || 'application/octet-stream';

export const isImage = (ending: string): boolean =>
	['png', 'jpg', 'jpeg', 'gif', 'bmp'].indexOf(ending) > -1;

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

export default async (req: MemberRequest, res: express.Response) => {
	let collectingData = false;
	let fileName = '';
	let boundary = '';
	let writeStream: fs.WriteStream;

	if (typeof req.headers !== 'undefined' && typeof req.headers.token === 'string') {
		if (!(await validRawToken(req.mysqlx, req.member, req.headers.token))) {
			res.status(403);
			res.end();
			return;
		}
	} else {
		res.status(403);
		res.end();
		return;
	}

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

			const id = uuid().replace(/-/g, '');

			// Start to write to disk
			const realFilename = `${req.account.id}-${id}`;
			writeStream = fs.createWriteStream(join(config.fileStoragePath, realFilename));
			writeStream.write(info.slice(i, findEnding(info, boundary)));

			collectingData = true;

			const created = +DateTime.utc();

			const filesCollection = req.mysqlx.getCollection<RawFileObject>('Files');

			const reference: MemberReference = req.member.getReference();

			const uploadedFile: RawFileObject = {
				kind: 'drive#file',
				id,
				accountID: req.account.id,
				comments: '',
				contentType,
				created,
				fileName,
				forDisplay: false,
				forSlideshow: false,
				permissions: [
					{
						type: FileUserAccessControlType.OTHER,
						permission: FileUserAccessControlPermissions.READ
					}
				],
				owner: reference,
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
				.then(async () => {
					const fullFileObject = await File.Get(id, req.account, req.mysqlx);
					// Return results
					json<FullFileObject>(res, {
						...fullFileObject.toRaw(),
						uploader: req.member.toRaw()
					});
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
