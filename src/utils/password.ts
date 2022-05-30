export const clearPassword = (object: any) => {
    delete object?.password;
    return object;
}