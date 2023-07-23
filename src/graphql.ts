
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

export class FollowInput {
    userId?: Nullable<string>;
    targetUserId: string;
}

export class UnfollowInput {
    userId?: Nullable<string>;
    targetUserId: string;
}

export class CreateUserInput {
    firstname?: Nullable<string>;
    lastname?: Nullable<string>;
    email?: Nullable<EmailAddress>;
    password?: Nullable<string>;
    username?: Nullable<string>;
    dateOfBirth?: Nullable<DateTime>;
    sex?: Nullable<string>;
    permissions?: Nullable<Nullable<string>[]>;
    createdAt?: Nullable<DateTime>;
}

export class UpdateUserInput {
    firstname?: Nullable<string>;
    lastname?: Nullable<string>;
    email?: Nullable<EmailAddress>;
    dateOfBirth?: Nullable<DateTime>;
    sex?: Nullable<string>;
    password?: Nullable<string>;
    username?: Nullable<string>;
    permissions?: Nullable<Nullable<string>[]>;
    updatedAt?: Nullable<DateTime>;
}

export abstract class IQuery {
    abstract refreshToken(): string | Promise<string>;

    abstract users(): Nullable<User>[] | Promise<Nullable<User>[]>;

    abstract user(id: string): Nullable<User> | Promise<Nullable<User>>;

    abstract findByUsername(username: string): Nullable<User> | Promise<Nullable<User>>;

    abstract me(): Nullable<User> | Promise<Nullable<User>>;
}

export abstract class IMutation {
    abstract login(user: LoginUserInput): LoginResult | Promise<LoginResult>;

    abstract logout(): Nullable<boolean> | Promise<Nullable<boolean>>;

    abstract follow(followInput: FollowInput): string | Promise<string>;

    abstract unfollow(unfollowInput: UnfollowInput): string | Promise<string>;

    abstract signup(createUserInput: CreateUserInput): User | Promise<User>;

    abstract activateUserAccount(activationToken: string): User | Promise<User>;

    abstract forgotPassword(email: string): User | Promise<User>;

    abstract resetPassword(token: string, password: string): User | Promise<User>;

    abstract updateUser(id: string, updateUserInput: UpdateUserInput): User | Promise<User>;

    abstract removeUser(id: string): Nullable<User> | Promise<Nullable<User>>;
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
    dateOfBirth?: Nullable<DateTime>;
    sex?: Nullable<string>;
    permissions?: Nullable<Nullable<string>[]>;
    isActive?: Nullable<boolean>;
    passwordReset?: Nullable<string>;
    passwordResetExp?: Nullable<DateTime>;
    activationToken?: Nullable<string>;
    activationTokenExp?: Nullable<DateTime>;
    followers?: Nullable<Nullable<User>[]>;
    following?: Nullable<Nullable<User>[]>;
    createdAt?: Nullable<DateTime>;
    updatedAt?: Nullable<DateTime>;
}

export type EmailAddress = any;
export type DateTime = any;
type Nullable<T> = T | null;
