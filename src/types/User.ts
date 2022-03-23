export type User = {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    role: string;
    city?: string;
    state?: string;
    resume: string;
    linkedin: string;
    skills: string;
    expertise: string;
};

export type LoginInfo = {
    email: string;
    password: string;
}