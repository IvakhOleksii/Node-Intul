import 'dotenv/config';

const config = {
    port: process.env.PORT,
    projectId: process.env.PROJECT_ID,
    authSecret: process.env.AUTH_SECRET,

    getroEmail: process.env.GETRO_EMAIL,
    getroPassword: process.env.GETRO_PASSWORD,

    bullhornClientID: process.env.BULLHORN_CLIENT_ID,
    bullhornClientSecret: process.env.BULLHORN_CLIENT_SECRET,
    bullhornApiUsername: process.env.BULLHORN_API_USERNAME,
    bullhornApiPassword: process.env.BULLHORN_API_PASSWORD,

    getroDatasetID: process.env.DATASET_GETRO,
    bullhornDatasetID: process.env.DATASET_BULLHORN,
    mainDatasetID: process.env.DATASET_MAIN
};

export default config;