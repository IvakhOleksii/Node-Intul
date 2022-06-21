// Replace password string on line 6
// Run script
import { encryptPassword } from "./password";

(async () => {
  console.log('/// START ENCRYPT PASSWORD');
  try {
        console.log(encryptPassword('123456'));
    } catch (error) {
        console.log(error);
    }

    console.log('/// STOP ENCRYPT PASSWORD');
    process.exit();
})();
