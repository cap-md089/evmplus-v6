import * as express from 'express';
import * as fs from 'fs';
import { Configuration as config } from '../../conf';
import { AccountRequest } from '../../lib/Account';
import { MemberRequest } from '../../lib/Member';
import { join } from 'path';

const findEnding = (input: Buffer, boundary: string) => {
	const index = input.length - boundary.length;
	const testBoundary = input.slice(index).toString();

	if (testBoundary === boundary) {
		return index;
	}

	return input.length;
};

export default (req: MemberRequest & AccountRequest, res: express.Response) => {
	if (
		typeof req.account === 'undefined' ||
		typeof req.params.fileid === 'undefined'
	) {
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
			let i = 0;
			let headerString = '';
			while (!(
				info.slice(i, i + 4).toString() === '\r\n\r\n'
			)) {
				headerString += String.fromCharCode(info[i++]);
			}
			i += 4;
			// It has the headers recorded; standards say that the headers are defined as ending
			// when there is a double \r\n
			let firstLines = headerString.split('\r\n');
			boundary = '\r\n' + firstLines[0] + '--\r\n';
			
			writeStream = fs.createWriteStream(join(config.fileStoragePath, req.params.fileid));
			writeStream.write(info.slice(i, findEnding(info, boundary)));

			collectingData = true;

			// Wait until query is finished and data is written before closing file and connection
			req.on('end', () => {
				writeStream.close();
				res.status(204);
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
	});
};