import type {
    BackstageSignInResult,
    BackstageIdentityResponse,
    LDAPUser,
    BackstageJWTPayload,
} from './types';

import { ProfileInfo } from '@backstage/core-plugin-api';
import {
    AuthHandler,
    AuthResolverContext,
    SignInResolver,
} from '@backstage/plugin-auth-backend';

import * as ldap from 'ldapjs';
import { dn } from 'ldap-escape';
import { authenticate, AuthenticationOptions } from 'ldap-authentication';

import {
    JWT_EXPIRED_TOKEN,
    JWT_INVALID_TOKEN,
    LDAP_CONNECT_FAIL,
} from './errors';
import Keyv from 'keyv';

export const COOKIE_FIELD_KEY = 'backstage-token';

export const normalizeTime = (date: number) => Math.floor(date / 1000);

export function parseJwtPayload(token: string): BackstageJWTPayload | never {
    try {
        const [_header, payload, _signature] = token.split('.');
        const output = JSON.parse(Buffer.from(payload, 'base64').toString());
        console.log(output);
        return output;
    } catch (e) {
        throw new Error(JWT_INVALID_TOKEN);
    }
}

export function prepareBackstageIdentityResponse(
    result: BackstageSignInResult
): BackstageIdentityResponse {
    const { sub, ent } = parseJwtPayload(result.token);

    return {
        ...result,
        identity: {
            type: 'user',
            userEntityRef: sub,
            ownershipEntityRefs: ent ?? [],
        },
    };
}

// TODO: this may have changed: https://backstage.io/docs/auth/identity-resolver
// https://github.com/immobiliare/backstage-plugin-ldap-auth/pull/31
export const defaultSigninResolver: SignInResolver<LDAPUser> = async (
    { result },
    ctx: AuthResolverContext
): Promise<BackstageSignInResult> => {
    const backstageIdentity: BackstageSignInResult =
        await ctx.signInWithCatalogUser({
            entityRef: result.uid as string,
        });

    return backstageIdentity;
};

export const defaultAuthHandler: AuthHandler<LDAPUser> = async (
    { uid },
    ctx: AuthResolverContext
): Promise<{ profile: ProfileInfo }> => {
    const backstageUserData = await ctx.findCatalogUser({
        entityRef: uid as string,
    });
    return { profile: backstageUserData?.entity?.spec?.profile as ProfileInfo };
};

export const defaultLDAPAuthentication = function defaultLDAPAuthentication(
    options: AuthenticationOptions
): Promise<LDAPUser> {
    return authenticate(options);
};

function ldapClient(
    ldapOpts: ldap.ClientOptions
): Promise<ldap.Client | Error> {
    return new Promise((resolve, reject) => {
        ldapOpts.connectTimeout = ldapOpts.connectTimeout || 5000;
        const client = ldap.createClient(ldapOpts);

        client.on('connect', () => resolve(client));
        client.on('timeout', reject);
        client.on('connectTimeout', reject);
        client.on('error', reject);
        client.on('connectError', reject);
    });
}

export const defaultCheckUserExists = async (
    ldapOpts: ldap.ClientOptions,
    uid: string
) => {
    const client = await ldapClient(ldapOpts);
    if (client instanceof Error)
        throw new Error(`${LDAP_CONNECT_FAIL} ${client.message}`);

    return new Promise((resolve, reject) => {
        client.search(
            dn`uid=${uid},ou=users,dc=ns,dc=farm`,
            {},
            (error, res) => {
                if (error) reject(error);
                let exists = false; // avoids double resolve call if user exists
                res.on('searchEntry', () => (exists = true));
                res.on('error', () => client.unbind());
                res.on('end', () => {
                    resolve(exists);
                    client.unbind();
                });
            }
        );
    });
};

export interface TokenValidator {
    logout(jwt: string, ts: number): Promise<void> | void;
    isValid(jwt: string): Promise<boolean> | boolean;
    invalidateToken(jwt: string): Promise<void> | void;
}

// TODO: Rework this to use the database for better scalabilities
export class JWTTokenValidator implements TokenValidator {
    protected readonly store: Keyv;
    readonly increaseTokenExpireMs: number | undefined;

    constructor(store: Keyv, increaseTokenExpireMs?: number) {
        this.store = store;
        this.increaseTokenExpireMs = increaseTokenExpireMs;
    }

    async logout(jwt: string, ts: number): Promise<void> {
        await this.isValid(jwt);
        const { sub } = parseJwtPayload(jwt);
        await this.store.set(sub, ts);
    }

    // On logout and refresh set the new invalidBeforeDate for the user
    async invalidateToken(jwt: string) {
        await this.isValid(jwt);
        const { sub } = parseJwtPayload(jwt);
        await this.store.set(sub, normalizeTime(Date.now()));
    }

    // rejects tokens issued before logouts and refreshs
    async isValid(jwt: string) {
        const { sub, iat, exp } = parseJwtPayload(jwt);

        if (
            normalizeTime(Date.now()) >
            exp + normalizeTime(this.increaseTokenExpireMs ?? 0)
        ) {
            // is expired?
            throw new Error(JWT_EXPIRED_TOKEN);
        }

        // // check if we have and entry in the cache
        if (await this.store.has(sub)) {
            const invalidBeforeDate = await this.store.get(sub);

            // if user signed off
            if (invalidBeforeDate && iat < invalidBeforeDate) {
                throw new Error(JWT_EXPIRED_TOKEN);
            }
        }

        return true;
    }
}

export class TokenValidatorNoop implements TokenValidator {
    // On logout and refresh set the new invalidBeforeDate for the user
    async invalidateToken(_jwt: string) {
        return;
    }

    async logout(_jwt: string, _ts: number) {
        return;
    }
    // rejects tokens issued before logouts and refreshs
    async isValid(_jwt: string) {
        return true;
    }
}
