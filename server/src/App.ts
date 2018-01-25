import * as path from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as logger from 'morgan';

class App {
    public express: express.Application;

    constructor() {
        this.express = express();
        this.middleware();
        this.routes();
    }

    private middleware(): void {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(cookieParser());
    }

    private routes(): void {
        let router = express.Router();

        router.get('/api', (req, res, next) => {
            res.json({
                message: "Hello world!"
            })
        });

        this.express.use('/', router);
    }
}

export default new App().express;