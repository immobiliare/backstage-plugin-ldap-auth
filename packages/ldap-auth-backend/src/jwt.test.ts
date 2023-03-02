import { parseJwtPayload, JWTTokenValidator, normalizeTime } from './jwt';

import jwt from 'jsonwebtoken';
import Keyv from 'keyv';
import { JWT_EXPIRED_TOKEN } from './errors';

describe('parseJwtPayload', () => {
    it('should parse jwt', () => {
        const payload = { sub: 'username' };
        const j = jwt.sign(payload, 'secret', {
            expiresIn: '1min',
        });

        const decoded = parseJwtPayload(j);

        expect(decoded?.sub).toBe(payload.sub);
        expect(decoded?.iat).toBeDefined();
        expect(decoded?.exp).toBeDefined();
    });
});

describe('Token Validator', () => {
    afterEach(() => {
        jest.useRealTimers();
    });
    const payload = { sub: 'username' };
    it('should validate', async () => {
        const j = jwt.sign(payload, 'secret', {
            expiresIn: '1min',
        });

        const validator = new JWTTokenValidator(new Keyv());
        const out = await validator.isValid(j);
        expect(out).toBe(true);
    });

    it('should invalidate old token', async () => {
        const timer = jest.useFakeTimers();
        const validator = new JWTTokenValidator(new Keyv());
        // Create token
        const j = jwt.sign(payload, 'secret', {
            expiresIn: '1min',
        });
        timer.advanceTimersByTime(1500);

        const out = await validator.isValid(j);
        await expect(out).toBe(true);

        await validator.invalidateToken(j);
        timer.advanceTimersByTime(1500);

        await expect(validator.isValid(j)).rejects.toEqual(
            new Error(JWT_EXPIRED_TOKEN)
        );
    });

    it('invalidating the last tokens should invalidate all tokens', async () => {
        const timer = jest.useFakeTimers();
        const validator = new JWTTokenValidator(new Keyv());
        // Create token
        const tokens = new Array(10).fill(null).map((_) => {
            const out = jwt.sign(payload, 'secret', {
                expiresIn: '1min',
            });
            timer.advanceTimersByTime(1500);
            return out;
        });
        const lastToken = jwt.sign(payload, 'secret', {
            expiresIn: '1min',
        });
        timer.advanceTimersByTime(1500);

        for (const promiseOut of [...tokens, lastToken].map(
            validator.isValid.bind(validator)
        )) {
            await expect(promiseOut).resolves.toEqual(true);
        }
        timer.advanceTimersByTime(1500);
        // Invalidate only last token
        await validator.invalidateToken(lastToken);
        timer.advanceTimersByTime(1500);

        for (const promiseOut of [...tokens, lastToken].map(
            validator.isValid.bind(validator)
        )) {
            await expect(promiseOut).rejects.toEqual(
                new Error(JWT_EXPIRED_TOKEN)
            );
        }
    });

    it('tokens should expire', async () => {
        const timer = jest.useFakeTimers();
        const validator = new JWTTokenValidator(new Keyv());
        // Create token
        const tokens = new Array(10).fill(null).map((_) => {
            const out = jwt.sign(payload, 'secret', {
                expiresIn: '1min',
            });
            timer.advanceTimersByTime(1500);
            return out;
        });
        timer.advanceTimersByTime(1500);

        for (const promiseOut of tokens.map(
            validator.isValid.bind(validator)
        )) {
            await expect(promiseOut).resolves.toEqual(true);
        }

        // tokens should invalid after 1 hour and 1 second
        timer.advanceTimersByTime(60 * 60 * 10e3 + 1500);

        for (const promiseOut of tokens.map(
            validator.isValid.bind(validator)
        )) {
            await expect(promiseOut).rejects.toEqual(
                new Error(JWT_EXPIRED_TOKEN)
            );
        }
    });

    it('should increase token expire time', async () => {
        const timer = jest.useFakeTimers();
        const validator = new JWTTokenValidator(new Keyv(), 60 * 60 * 10e3);
        // Create token
        const tokens = new Array(10).fill(null).map((_) => {
            const out = jwt.sign(payload, 'secret', {
                expiresIn: '1min',
            });
            timer.advanceTimersByTime(1500);
            return out;
        });
        timer.advanceTimersByTime(1500);

        for (const promiseOut of tokens.map(
            validator.isValid.bind(validator)
        )) {
            await expect(promiseOut).resolves.toEqual(true);
        }

        // tokens should invalid after 1 hour and 1 second
        timer.advanceTimersByTime(60 * 60 * 10e3 + 1500);

        for (const promiseOut of tokens.map(
            validator.isValid.bind(validator)
        )) {
            await expect(promiseOut).resolves.toEqual(true);
        }

        // tokens should invalid after 1 hour and 1 second
        timer.advanceTimersByTime(60 * 60 * 10e3 + 1500);

        for (const promiseOut of tokens.map(
            validator.isValid.bind(validator)
        )) {
            await expect(promiseOut).rejects.toEqual(
                new Error(JWT_EXPIRED_TOKEN)
            );
        }
    });

    it('should logout', async () => {
        const timer = jest.useFakeTimers();
        const validator = new JWTTokenValidator(new Keyv());

        const token = jwt.sign(payload, 'secret', {
            expiresIn: '1min',
        });
        timer.advanceTimersByTime(1500);

        await expect(validator.isValid(token)).resolves.toEqual(true);

        timer.advanceTimersByTime(1500);
        await validator.logout(token, normalizeTime(Date.now()));

        timer.advanceTimersByTime(1500);

        await expect(validator.isValid(token)).rejects.toEqual(
            new Error(JWT_EXPIRED_TOKEN)
        );
    });
});
