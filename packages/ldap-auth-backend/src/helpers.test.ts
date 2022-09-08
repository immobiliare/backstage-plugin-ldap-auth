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

describe('helpers functions', () => {
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
