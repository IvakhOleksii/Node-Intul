// for start script use
// npm run build && GOOGLE_APPLICATION_CREDENTIALS='./src/config/service-account-file.json' node ./dist/utils/encryptPasswords.js
// change where condition in select for alter script scope

import { encryptPassword } from "./password";
import { User, USERKEYS } from "../types/User";
import { BigQueryService } from "../services/BigQueryService";
import { DATASET_MAIN, Tables } from "../types/Common";

(async () => {
    try {
        console.log('/// START ENCRYPT ALL PASSWORDS');

        const query = `
            SELECT id,email,password FROM \`${DATASET_MAIN}.${Tables.USER}\`
            WHERE email='test9@email.com' or email='v.deserio3@outlook.com' or email='test2@email.com'
        `;
        const options = {
          query: query,
          location: "US",
        };
        const [job] = await BigQueryService.getClient().createQueryJob(options);
        const [users] = await job.getQueryResults();

        if (users && users.length ) {
          for(const user of users){
            if(!user.password){
              console.log(`user ${user.email} password is empty. Skipped.`);
              continue
            }
            if(user.password.length < 152) {
              user.password = encryptPassword(user.password);

              const update_query = `
                UPDATE \`${DATASET_MAIN}.${Tables.USER}\`
                SET password = '${user.password}'
                WHERE email = '${user.email}'
              `;

              const update_options = { query: update_query, location: "US" };
              const [job] = await BigQueryService.getClient().createQueryJob(update_options);
              const res = await job.getQueryResults();
              console.log(`user ${user.email} password is successfully encrypted.`);
            } else {
              console.log(`user ${user.email} password is already encrypted`);
            }
          }
        }
    } catch (error) {
        console.log(error);
    }

    console.log('/// STOP ENCRYPT ALL PASSWORDS');
    process.exit();
})();
