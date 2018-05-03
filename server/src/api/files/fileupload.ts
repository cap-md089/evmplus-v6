import { Configuration as config } from '../../conf';
import * as express from 'express';
import * as fs from 'fs'; 
import { join } from 'path';

const parseHeaders = (lines: string[]) => {
	let headers: {[key: string]: string} = {};
	for (let line of lines) {
		let parts = line.split(': ');
		let header = parts[0].toLowerCase();
		headers[header] = parts[1];
	}
	return headers;
};

const findEnding = (input: Buffer, boundary: string, start: number = 0) => {
	let foundBoundary = false;
	let index = start;
	
	while (!(foundBoundary && index < input.length - boundary.length)) {
		let data = input.slice(index, index + boundary.length).toString();
		if (data === boundary) {
			foundBoundary = true;
		}
		index++;
	}

	if (!foundBoundary) {
		index = input.length;
	}

	return index;
};

export default (req: express.Request & {busboy?: busboy.Busboy}, res: express.Response, next: Function) => {
	// if (typeof req.busboy !== 'undefined') {
	// 	req.busboy.on('file', (___, file, filename, __, _) => {
	// 		let rs = fs.createWriteStream(join(config.path, 'uploads', filename));
	// 		file.pipe(rs);
	// 		rs.on('close', () => {
	// 			res.json({
	// 				id: filename
	// 			});
	// 		});
	// 	});

	// 	req.busboy.on('finish', () => {
	// 		console.log('Finished file upload');
	// 	});

	// 	req.pipe(req.busboy);
	// }

	let data = new Buffer(0);
	let collectingData = false;
	let fileName = '';
	let boundary = '';
	let writeStream: fs.WriteStream;
	
	// If I buffer into the MySQL server, these are values used.
	// However, the MySQL server may not buffer output, so I will have to load the entire
	// value anyway
	// let usedTo = 0;
	// const CHUNK_SIZE = 4096;

	req.on('data', info => {
		console.log('Receiving data');
		if (typeof info === 'string') {
			info = new Buffer(info);
		}	
		if (!collectingData) {
			let headerString = '';
			let i = 0;
			while (!(
				String.fromCharCode(info[i]) === '\r' &&
				String.fromCharCode(info[i + 1]) === '\n' &&
				String.fromCharCode(info[i + 2]) === '\r' &&
				String.fromCharCode(info[i + 3]) === '\n'
				// info.slice(i, i + 3).toString() === '\r\n\r\n'
			)) {
				headerString += String.fromCharCode(info[i++]);
			}
			i += 4;

			// Get headers
			let firstLines = headerString.split('\r\n');
	
			boundary = firstLines[0] + '--';
			
			let headers = parseHeaders(firstLines);

			let query = headers['content-disposition']
				.split(/; ?/)
				.map(str => str.split(/ ?\= ?/))
				.filter(pair => pair[0].match(/filename/))[0][1];
			fileName = JSON.parse(query);

			console.log('Writing', join(config.path, 'uploads', fileName));

			writeStream = fs.createWriteStream(join(config.path, 'uploads', fileName));

			let end = findEnding(info, boundary, i);

			data = info.slice(i, end);

			console.log(data.length);

			writeStream.write(data);

			collectingData = true;

			req.resume();
		} else {
			// data += info;
			let newData = info.slice(
				0,
				findEnding(info, boundary)
			);
			console.log(newData.length);
			// data = Buffer.concat([data, newData]);
			writeStream.write(newData);

			req.resume();
		}
	});

	req.on('end', () => {
		console.log(fileName);
		let file = fs.createWriteStream(join(config.path, 'uploads', fileName));
		file.write(data, () => {
			console.log('Wrote data');
		});
		res.end();
	});
};