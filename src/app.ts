import express, { Request, Response, Router } from 'express'
import "reflect-metadata"; 
import dotenv from 'dotenv';
import { useExpressServer } from 'routing-controllers';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';

dotenv.config();

const handleCors = (router: Router) => router.use(cors({ origin: true }));

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
handleCors(app);

useExpressServer(app, {
    controllers: [path.join(__dirname + '/controllers/*.ts')]
});

app.listen(port, function () {
    console.log(`App is listening on port ${port} !`)
});