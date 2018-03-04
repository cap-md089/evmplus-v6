import { IMyConfiguration } from '../conf';
import * as express from 'express';
import * as fs from 'fs'; 
import { join } from 'path';

export default (config: IMyConfiguration) => {
    return (req: express.Request & {busboy?: busboy.Busboy}, res: express.Response, next: Function) => {
        console.log('File upload');
        if (typeof req.busboy !== 'undefined') {
            console.log('File parse');

            req.busboy.on('file', (___, file, filename, __, _) => {
                console.log(config.path, filename);
                let rs = fs.createWriteStream(join(config.path, 'uploads', filename));
                file.pipe(rs);
                rs.on('close', () => {
                    res.send('{"fileID": "' + filename + '"}');
                });
            });

            req.busboy.on('finish', () => {
                console.log('Finished');
            });
            
            req.busboy.on('field', console.log);

            req.pipe(req.busboy);
        }
    }
}