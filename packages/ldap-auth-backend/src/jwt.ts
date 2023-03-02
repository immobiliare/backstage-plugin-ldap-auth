import type Keyv from 'keyv';

import type { BackstageJWTPayload } from './types';
import { JWT_INVALID_TOKEN, JWT_EXPIRED_TOKEN } from './errors';

export const COOKIE_FIELD_KEY = 'backstage-token';

export const normalizeTime = (date: number) => Math.floor(date / 1000);

export function parseJwtPayload(token: string): BackstageJWTPayload | never {
    try {
        // header, payload, signature
        const [, payload] = token.split('.');
        return JSON.parse(Buffer.from(payload, 'base64').toString());
    } catch (e) {
        throw new Error(JWT_INVALID_TOKEN);
    }
}

export interface TokenValidator {
    logout(jwt: string, ts: number): Promise<void> | void;
    isValid(jwt: string): Promise<boolean> | boolean;
    invalidateToken(jwt: string): Promise<void> | void;
}

export class JWTTokenValidator implements TokenValidator {
    protected readonly store: Keyv;
    readonly increaseTokenExpireMs: number;

    constructor(store: Keyv, increaseTokenExpireMs?: number) {
        this.store = store;
        this.increaseTokenExpireMs = isNaN(increaseTokenExpireMs || 0)
            ? 0
            : increaseTokenExpireMs || 0;
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

    // rejects tokens issued before logouts and refresh
    async isValid(jwt: string) {
        const { sub, iat, exp } = parseJwtPayload(jwt);

        if (
            normalizeTime(Date.now()) >
            exp + normalizeTime(this.increaseTokenExpireMs)
        ) {
            // is expired?
            throw new Error(JWT_EXPIRED_TOKEN);
        }

        // check if we have and entry in the cache
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
