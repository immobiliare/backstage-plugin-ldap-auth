import type { BackstageSignInResult, BackstageIdentityResponse, LDAPUser, BackstageJWTPayload } from './types';
import { AuthHandler, SignInResolver } from '@backstage/plugin-auth-backend';
import * as ldap from 'ldapjs';
import { AuthenticationOptions } from 'ldap-authentication';
export declare const COOKIE_FIELD_KEY = "backstage-token";
export declare function parseJwtPayload(token: string): BackstageJWTPayload | never;
export declare function prepareBackstageIdentityResponse(result: BackstageSignInResult): BackstageIdentityResponse;
export declare const defaultSigninResolver: SignInResolver<LDAPUser>;
export declare const defaultAuthHandler: AuthHandler<LDAPUser>;
export declare const defaultLDAPAuthentication: (options: AuthenticationOptions) => Promise<LDAPUser>;
export declare const defaultCheckUserExists: (ldapOpts: ldap.ClientOptions, uid: string) => Promise<unknown>;
declare class JWTTokenCache extends Map {
    setLastIssuedAtForUser(uid: string, invalidBeforeTimestamp: number): this;
    isValid(jwt: string): boolean;
}
export declare const jwtTokenCache: JWTTokenCache;
export {};
