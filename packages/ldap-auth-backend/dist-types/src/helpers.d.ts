import type { BackstageSignInResult, BackstageIdentityResponse, LDAPUser, BackstageJWTPayload } from './types';
import { AuthHandler, SignInResolver } from '@backstage/plugin-auth-backend';
import * as ldap from 'ldapjs';
import { AuthenticationOptions } from 'ldap-authentication';
import Keyv from 'keyv';
export declare const COOKIE_FIELD_KEY = "backstage-token";
export declare const normalizeTime: (date: number) => number;
export declare function parseJwtPayload(token: string): BackstageJWTPayload | never;
export declare function prepareBackstageIdentityResponse(result: BackstageSignInResult): BackstageIdentityResponse;
export declare const defaultSigninResolver: SignInResolver<LDAPUser>;
export declare const defaultAuthHandler: AuthHandler<LDAPUser>;
export declare const defaultLDAPAuthentication: (options: AuthenticationOptions) => Promise<LDAPUser>;
export declare const defaultCheckUserExists: (ldapOpts: ldap.ClientOptions, uid: string) => Promise<unknown>;
export interface TokenValidator {
    logout(jwt: string, ts: number): Promise<void> | void;
    isValid(jwt: string): Promise<boolean> | boolean;
    invalidateToken(jwt: string): Promise<void> | void;
}
export declare class JWTTokenValidator implements TokenValidator {
    private readonly store;
    constructor(store: Keyv);
    logout(jwt: string, ts: number): Promise<void>;
    invalidateToken(jwt: string): Promise<void>;
    isValid(jwt: string): Promise<boolean>;
}
export declare class TokenValidatorNoop implements TokenValidator {
    invalidateToken(_jwt: string): Promise<void>;
    logout(_jwt: string, _ts: number): Promise<void>;
    isValid(_jwt: string): Promise<boolean>;
}
