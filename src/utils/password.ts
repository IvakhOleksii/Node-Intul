const crypto = require('crypto');

export const clearPassword = (object: any) => {
    delete object?.password;
    return object;
}

export const encryptPassword = (password: string) => {
    const sr = crypto.randomBytes(12).toString('hex');
    const encrypted_password_hash = crypto.createHash('sha512');

    encrypted_password_hash.update(sr + password);

    return `${sr}${encrypted_password_hash.digest('hex')}`;
}

export const checkPassword = (encryptedPassword:string, password: string) => {
    const sr = encryptedPassword.substring(0,24);
    const hash_in_db = encryptedPassword.substring(24);

    const hash = crypto.createHash('sha512');
    hash.update(sr + password);
    const calculated_hash = hash.digest('hex')

    return hash_in_db == calculated_hash;
}
