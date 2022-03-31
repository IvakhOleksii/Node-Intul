import express, { Request, Response, Router } from 'express'
import "reflect-metadata"; 
import dotenv from 'dotenv';
import { Action, useExpressServer } from 'routing-controllers';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import { NextFunction } from 'connect';
import setupCronJobs from './cronjobs';
import { VerifyJwtToken } from './utils/jwtUtils';
import { findUserByEmail } from './services/User';
import multer from 'multer';
import { genUUID } from './utils';

dotenv.config();

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname + '/../uploads/resumes');
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, genUUID());
    }
});
const upload = multer({storage: multerStorage, dest: __dirname + '/../uploads/resumes'});

  

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
app.use(express.static('uploads'));
app.use(cors());

app.post('/api/upload', upload.single('file'), (req, res) => {
    if(req.file) {
        res.json({
          result: true,
          file: `/resumes/${req.file.filename}`
        });
        return;
    }
    else {
        res.json({
            result: false
        });
    };
});

useExpressServer(app, {
    controllers: [path.join(__dirname + '/controllers/*.ts')],
    authorizationChecker: async (action: Action) => {
        try {
            const token = action.request.headers.authorization.split(" ")[1];
            const data = VerifyJwtToken(token);
            if (data && data.email) {
                const user = await findUserByEmail(data.email);
                if (user) {
                    action.request.user = user;
                    return true;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    },
    currentUserChecker: (action: Action) => action.request.user,
});

app.listen(port, function () {
    console.log(`App is listening on port ${port} !`)
});

setupCronJobs();