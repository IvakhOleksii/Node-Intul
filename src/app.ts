import express, { Request, Response, Router } from 'express'
import "reflect-metadata"; 
import dotenv from 'dotenv';
import { useExpressServer } from 'routing-controllers';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import { NextFunction } from 'connect';

dotenv.config();

const handleCors = (router: Router) => router.use(cors({ origin: true }));

const getActualRequestDurationInMs = (start: any) => {
    const NS_PER_SEC = 1e9;
    const NS_TO_MS = 1e6;
    const diff = process.hrtime(start);
    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

const logger = (req: Request, res: Response, next: NextFunction) => {
    let current_datetime = new Date();
    let formatted_date =
        current_datetime.getFullYear() +
        "-" +
        (current_datetime.getMonth() + 1) +
        "-" +
        current_datetime.getDate() +
        " " +
        current_datetime.getHours() +
        ":" +
        current_datetime.getMinutes() +
        ":" +
        current_datetime.getSeconds();
    const method = req.method;
    const url = req.url;
    const status =- res.statusCode;
    const start = process.hrtime();
    const durationInMs = getActualRequestDurationInMs(start);
    const log = `[${formatted_date}] ${method}:${url} ${status} ${durationInMs.toLocaleString()} ms`;
    console.log(log);
    next();
};

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(logger);

handleCors(app);

useExpressServer(app, {
    controllers: [path.join(__dirname + '/controllers/*.ts')]
});

app.listen(port, function () {
    console.log(`App is listening on port ${port} !`)
});