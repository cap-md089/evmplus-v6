import { Configuration as config } from '../../conf';
import * as express from 'express';
import * as fs from 'fs'; 
import { join, basename } from 'path';

const parseHeaders = (lines: string[]) => {
	let headers: {[key: string]: string} = {};
	for (let line of lines) {
		let parts = line.split(': ');
		let header = parts[0].toLowerCase();
		headers[header] = parts[1];
	}
	return headers;
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

export default (req: express.Request & {busboy?: busboy.Busboy}, res: express.Response, next: Function) => {
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
			info = new Buffer(info);
		}	
		if (!collectingData) {
			let headerString = '';
			let i = 0;
			while (!(
				// String.fromCharCode(info[i]) === '\r' &&
				// String.fromCharCode(info[i + 1]) === '\n' &&
				// String.fromCharCode(info[i + 2]) === '\r' &&
				// String.fromCharCode(info[i + 3]) === '\n'
				info.slice(i, i + 4).toString() === '\r\n\r\n'
			)) {
				headerString += String.fromCharCode(info[i++]);
			}
			i += 4;

			// Get headers
			let firstLines = headerString.split('\r\n');
	
			boundary = '\r\n' + firstLines[0] + '--\r\n';
			
			let headers = parseHeaders(firstLines);

			let query = headers['content-disposition']
				.split(/; ?/)
				.map(str => str.split(/ ?\= ?/))
				.filter(pair => pair[0].match(/filename/))[0][1];
			fileName = basename(JSON.parse(query));

			writeStream = fs.createWriteStream(join(config.fileStoragePath, fileName));

			writeStream.write(info.slice(i, findEnding(info, boundary)));

			collectingData = true;
		} else {
			let newData = info.slice(
				0,
				findEnding(info, boundary)
			);
			writeStream.write(newData);
		}
		req.resume();
	});

	req.on('end', () => {
		writeStream.close();
		res.end();
	});
};