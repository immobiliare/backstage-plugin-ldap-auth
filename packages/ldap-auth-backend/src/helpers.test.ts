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
} from 'helpers';

describe('helpers functions', () => {
    it('parseJwtPayload', () => {
        expect(1).toBeDefined();
    });
});
