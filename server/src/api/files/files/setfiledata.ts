import { FileUserAccessControlPermissions } from 'common-lib/index';
import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { Configuration as config } from '../../../conf';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';
import { validRawToken } from '../../formtoken';

const findEnding = (input: Buffer, boundary: string) => {
	const index = input.length - boundary.length;
	const testBoundary = input.slice(index).toString();

	if (testBoundary === boundary) {
		return index;
	}

	return input.length;
};

export default async (req: MemberRequest, res: express.Response) => {
	if (typeof req.headers !== 'undefined' && typeof req.headers.token === 'string') {
		if (!validRawToken(req.headers.token, req.member)) {
			res.status(403);
			res.end();
			return;
		}
	} else {
		res.status(403);
		res.end();
		return;
	}

	if (typeof req.params.fileid === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

	let file: File;

	try {
		file = await File.Get(req.params.fileid, req.account, req.mysqlx, false);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	if (
		!file.hasPermission(
			req.member,
			// tslint:disable-next-line:no-bitwise
			FileUserAccessControlPermissions.MODIFY | FileUserAccessControlPermissions.WRITE
		)
	) {
		res.status(403);
		res.end();
		return;
	}

	// Don't write data to a file that doesn't exist,
	// as during creation folders are not assigned a file
	if (file.contentType === 'application/folder') {
		res.status(400);
		res.end();
		return;
	}

	let collectingData = false;
	let boundary = '';
	let writeStream: fs.WriteStream;

	/*
		File data plan:

		1. Store FILE on disk
		2. Stored filename will be a UUID (there already happens to be a UUID library for tokens...)
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
			let i = 0;
			let headerString = '';
			while (!(info.slice(i, i + 4).toString() === '\r\n\r\n')) {
				headerString += String.fromCharCode(info[i++]);
			}
			i += 4;
			// It has the headers recorded; standards say that the headers are defined as ending
			// when there is a double \r\n
			const firstLines = headerString.split('\r\n');
			boundary = '\r\n' + firstLines[0] + '--\r\n';

			writeStream = fs.createWriteStream(join(config.fileStoragePath, req.params.fileid));
			writeStream.write(info.slice(i, findEnding(info, boundary)));

			collectingData = true;

			// Wait until data is written before closing file and connection
			req.on('end', () => {
				writeStream.close();
				res.status(204);
				res.end();
			});
		} else {
			// Adds more data to file. If it finds the ending, it will not get to this section again
			const newData = info.slice(0, findEnding(info, boundary));
			writeStream.write(newData);
		}
	});
};
