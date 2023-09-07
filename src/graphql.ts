
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

export class DiscoverInput {
    userId?: Nullable<string>;
    limit?: Nullable<number>;
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
    profilePictureUrl?: Nullable<string>;
    city?: Nullable<string>;
    nationality?: Nullable<string>;
    address?: Nullable<string>;
    phone?: Nullable<PhoneNumber>;
    password?: Nullable<string>;
    username?: Nullable<string>;
    permissions?: Nullable<Nullable<string>[]>;
    updatedAt?: Nullable<DateTime>;
}

export class UpdatePasswordInput {
    oldPassword: string;
    password: string;
}

export abstract class IQuery {
    abstract refreshToken(): string | Promise<string>;

    abstract getFollowingIds(userId?: Nullable<string>): Nullable<string>[] | Promise<Nullable<string>[]>;

    abstract discoverUsers(discoverInput?: Nullable<DiscoverInput>): Nullable<Nullable<User>[]> | Promise<Nullable<Nullable<User>[]>>;

    abstract users(): Nullable<User>[] | Promise<Nullable<User>[]>;

    abstract user(id: string): Nullable<User> | Promise<Nullable<User>>;

    abstract findByUsername(username: string): Nullable<User> | Promise<Nullable<User>>;

    abstract findPageByUsername(username: string): Nullable<User> | Promise<Nullable<User>>;

    abstract experts(): Nullable<User>[] | Promise<Nullable<User>[]>;

    abstract me(): Nullable<User> | Promise<Nullable<User>>;

    abstract searchForUsers(text?: Nullable<string>): Nullable<User>[] | Promise<Nullable<User>[]>;
}

export abstract class IMutation {
    abstract login(user: LoginUserInput): LoginResult | Promise<LoginResult>;

    abstract switchAccount(targetId?: Nullable<string>): SwitchResult | Promise<SwitchResult>;

    abstract switchBack(): Nullable<boolean> | Promise<Nullable<boolean>>;

    abstract logout(): Nullable<boolean> | Promise<Nullable<boolean>>;

    abstract follow(followInput: FollowInput): string | Promise<string>;

    abstract unfollow(unfollowInput: UnfollowInput): string | Promise<string>;

    abstract signup(createUserInput: CreateUserInput): User | Promise<User>;

    abstract createPage(createUserInput: CreateUserInput): Nullable<User> | Promise<Nullable<User>>;

    abstract activateUserAccount(activationToken: string): User | Promise<User>;

    abstract forgotPassword(email: string): User | Promise<User>;

    abstract resetPassword(token: string, password: string): User | Promise<User>;

    abstract updatePassword(updatePasswordInput?: Nullable<UpdatePasswordInput>): string | Promise<string>;

    abstract updateBalance(amount?: Nullable<number>): string | Promise<string>;

    abstract blockUnblockUser(userId?: Nullable<string>): Nullable<User> | Promise<Nullable<User>>;

    abstract addExpertPermission(userId?: Nullable<string>): Nullable<User> | Promise<Nullable<User>>;

    abstract removeExpertPermission(userId?: Nullable<string>): Nullable<User> | Promise<Nullable<User>>;

    abstract updateUser(id: string, updateUserInput: UpdateUserInput): User | Promise<User>;

    abstract removeUser(id: string): Nullable<User> | Promise<Nullable<User>>;
}

export class LoginResult {
    user: User;
    token: string;
}

export class SwitchResult {
    user: User;
    token: string;
    old_token: string;
}

export class User {
    id: string;
    firstname?: Nullable<string>;
    lastname?: Nullable<string>;
    balance?: Nullable<number>;
    email?: Nullable<EmailAddress>;
    password?: Nullable<string>;
    username?: Nullable<string>;
    dateOfBirth?: Nullable<DateTime>;
    sex?: Nullable<string>;
    profilePictureUrl?: Nullable<string>;
    city?: Nullable<string>;
    nationality?: Nullable<string>;
    address?: Nullable<string>;
    phone?: Nullable<string>;
    permissions?: Nullable<Nullable<string>[]>;
    isActive?: Nullable<boolean>;
    passwordReset?: Nullable<string>;
    passwordResetExp?: Nullable<DateTime>;
    activationToken?: Nullable<string>;
    activationTokenExp?: Nullable<DateTime>;
    followers?: Nullable<Nullable<User>[]>;
    following?: Nullable<Nullable<User>[]>;
    pages?: Nullable<Nullable<User>[]>;
    managers?: Nullable<Nullable<User>[]>;
    ownerId?: Nullable<string>;
    owner?: Nullable<User>;
    createdAt?: Nullable<DateTime>;
    updatedAt?: Nullable<DateTime>;
}

export type EmailAddress = any;
export type DateTime = any;
export type PhoneNumber = any;
type Nullable<T> = T | null;
