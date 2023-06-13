
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export class LoginUserInput {
    username?: Nullable<string>;
    email?: Nullable<EmailAddress>;
    password: string;
}

export class CreateUserInput {
    firstname?: Nullable<string>;
    lastname?: Nullable<string>;
    email?: Nullable<EmailAddress>;
    password?: Nullable<string>;
    username?: Nullable<string>;
    permissions?: Nullable<Nullable<string>[]>;
    createdAt?: Nullable<DateTime>;
}

export class UpdateUserInput {
    firstname?: Nullable<string>;
    lastname?: Nullable<string>;
    email?: Nullable<EmailAddress>;
    password?: Nullable<string>;
    username?: Nullable<string>;
    permissions?: Nullable<Nullable<string>[]>;
    updatedAt?: Nullable<DateTime>;
}

export abstract class IQuery {
    abstract login(user: LoginUserInput): LoginResult | Promise<LoginResult>;

    abstract refreshToken(): string | Promise<string>;

    abstract users(): Nullable<User>[] | Promise<Nullable<User>[]>;

    abstract user(id: string): Nullable<User> | Promise<Nullable<User>>;
}

export class LoginResult {
    user: User;
    token: string;
}

export class User {
    id: string;
    firstname?: Nullable<string>;
    lastname?: Nullable<string>;
    email?: Nullable<EmailAddress>;
    password?: Nullable<string>;
    username?: Nullable<string>;
    permissions?: Nullable<Nullable<string>[]>;
    passwordReset?: Nullable<string>;
    isActive?: Nullable<boolean>;
    activationToken?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    updatedAt?: Nullable<DateTime>;
}

export abstract class IMutation {
    abstract signup(createUserInput: CreateUserInput): User | Promise<User>;

    abstract activateUserAccount(activationToken: string): User | Promise<User>;

    abstract updateUser(id: string, updateUserInput: UpdateUserInput): User | Promise<User>;

    abstract removeUser(id: string): Nullable<User> | Promise<Nullable<User>>;
}

export type EmailAddress = any;
export type DateTime = any;
type Nullable<T> = T | null;
