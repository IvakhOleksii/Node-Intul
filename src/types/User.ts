export type User = {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    type: string;
    city: string;
    state: string;
    title?: string;
    level?: string;
};

export type LoginInfo = {
    email: string;
    password: string;
}