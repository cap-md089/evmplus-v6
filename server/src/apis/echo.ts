import { IMyConfiguration } from '../conf';
import * as express from 'express';

export default (config: IMyConfiguration) => {
    return (req: express.Request, res: express.Response, next: Function) => {
        console.log(req.body);
        res.json(req.body);
    }
}