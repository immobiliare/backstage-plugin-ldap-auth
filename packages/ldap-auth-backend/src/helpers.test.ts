import {
    COOKIE_FIELD_KEY,
    normalizeTime,
    parseJwtPayload,
    prepareBackstageIdentityResponse,
    defaultSigninResolver,
    defaultAuthHandler,
    defaultLDAPAuthentication,
    defaultCheckUserExists,
    TokenValidator,
    JWTTokenValidator,
    TokenValidatorNoop,
} from './helpers';

import jwt from 'jsonwebtoken';

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

    it('should throw if jwt is expired', () => {
        const payload = { sub: 'username' };
        const j = jwt.sign(payload, 'secret', {
            expiresIn: '-1min',
        });

        expect(() => parseJwtPayload(j)).toThrow();
    });
});

describe('prepareBackstageIdentityResponse', () => {
    it('Should return correctly formated backstage identity', () => {
        const payload = { sub: 'username' };
        const token = jwt.sign(payload, 'secret', {
            expiresIn: '1min',
        });
        const result = prepareBackstageIdentityResponse({ token });
        expect(result.token).toBe(token);
        expect(result?.identity?.type).toBe('user');
        expect(result?.identity?.userEntityRef).toBe(payload.sub);
        expect(result?.identity?.ownershipEntityRefs).toStrictEqual([]);
    });
});
