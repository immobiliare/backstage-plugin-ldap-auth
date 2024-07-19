import { AuthResolverContext } from '@backstage/plugin-auth-node';
import { ProviderLdapAuthProvider } from './provider';
import { defaultCheckUserExists, defaultLDAPAuthentication } from './ldap';
import { defaultAuthHandler, defaultSigninResolver } from './auth';
import { COOKIE_FIELD_KEY, JWTTokenValidator } from './jwt';
import { AuthenticationOptions } from 'ldap-authentication';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '@backstage/errors';
import { AUTH_MISSING_CREDENTIALS, JWT_EXPIRED_TOKEN } from './errors';
import Keyv from 'keyv';

export function createProvider() {
    const sub = 'my-uid-name';
    const token = jwt.sign({ sub }, 'secret', {
        expiresIn: '1min',
    });
    const authHandler = jest.fn(
        defaultAuthHandler
    ) as typeof defaultAuthHandler;
    const checkUserExists = jest.fn(() =>
        Promise.resolve(true)
    ) as typeof defaultCheckUserExists;
    const signInResolver = jest.fn(
        defaultSigninResolver
    ) as typeof defaultSigninResolver;
    const signInWithCatalogUser = jest.fn(async ({}) => ({
        token,
    }));
    const findCatalogUser = jest.fn(async ({}) => ({
        profile: {
            email: 'myemail@mail.com',
            displayName: 'John Doeh',
        },
    }));
    const ldapAuthentication = jest.fn(
        async (
            username: string,
            password: string,
            ldapAuthOptions: AuthenticationOptions
        ) =>
            defaultLDAPAuthentication(
                username,
                password,
                ldapAuthOptions,
                (options: AuthenticationOptions) =>
                    Promise.resolve({
                        [options.usernameAttribute as string]: sub,
                    })
            )
    ) as typeof defaultLDAPAuthentication;
    const provider = new ProviderLdapAuthProvider({
        resolverContext: {
            signInWithCatalogUser,
            findCatalogUser,
        } as unknown as AuthResolverContext,
        authHandler,
        checkUserExists,
        signInResolver,
        ldapAuthentication,
        tokenValidator: new JWTTokenValidator(new Keyv()),
        cookies: {
            field: COOKIE_FIELD_KEY,
            secure: true,
        },
        ldapAuthenticationOptions: { ldapOpts: { url: 'localhost' } },
    });

    return {
        provider,
        sub,
        token,
        authHandler,
        checkUserExists,
        signInResolver,
        ldapAuthentication,
        signInWithCatalogUser,
        findCatalogUser,
    };
}

describe('LdapAuthProvider login tests', () => {
    it('Test refresh for login with username and password', async () => {
        const {
            provider,
            sub,
            token,
            ldapAuthentication,
            authHandler,
            checkUserExists,
        } = createProvider();
        const reqMock = {
            body: { username: sub, password: 'hello-world' },
            // [COOKIE_FIELD_KEY]: 'token-for-user:my-uid-name',
            method: 'POST',
        };
        const resMock = {
            cookie: jest.fn(),
            json: jest.fn(),
            clearCookie: jest.fn(),
        };
        await provider.refresh(reqMock as any, resMock as any);
        expect(resMock.json).toHaveBeenCalledWith({
            backstageIdentity: {
                identity: {
                    ownershipEntityRefs: [],
                    type: 'user',
                    userEntityRef: sub,
                },
                token,
            },
            profile: undefined,
            providerInfo: {},
        });
        expect(authHandler).toHaveBeenCalledTimes(1);
        expect(ldapAuthentication).toHaveBeenCalledTimes(1);
        expect(checkUserExists).not.toHaveBeenCalled();
        expect(resMock.cookie).toHaveBeenCalled();
        expect(resMock.clearCookie).not.toHaveBeenCalled();
    });

    it('Test refresh with token', async () => {
        const {
            provider,
            sub,
            token,
            ldapAuthentication,
            authHandler,
            checkUserExists,
        } = createProvider();
        const oldToken = jwt.sign({ sub }, 'secret', {
            expiresIn: '1min',
        });
        const reqMock = {
            body: {},
            cookies: { [COOKIE_FIELD_KEY]: oldToken },
            method: 'POST',
        };
        const resMock = {
            cookie: jest.fn(),
            json: jest.fn(),
            clearCookie: jest.fn(),
        };
        await provider.refresh(reqMock as any, resMock as any);
        expect(resMock.json).toHaveBeenCalledWith({
            backstageIdentity: {
                identity: {
                    ownershipEntityRefs: [],
                    type: 'user',
                    userEntityRef: sub,
                },
                token,
            },
            profile: undefined,
            providerInfo: {},
        });
        expect(authHandler).toHaveBeenCalledTimes(1);
        expect(ldapAuthentication).not.toHaveBeenCalled();
        expect(checkUserExists).toHaveBeenCalledTimes(1);
        expect(resMock.cookie).toHaveBeenCalled();
        expect(resMock.clearCookie).not.toHaveBeenCalled();
    });

    it('Test refresh should not accept GET', async () => {
        const {
            provider,
            sub,
            ldapAuthentication,
            authHandler,
            checkUserExists,
        } = createProvider();
        const oldToken = jwt.sign({ sub }, 'secret', {
            expiresIn: '1min',
        });
        const reqMock = {
            body: {},
            cookies: { [COOKIE_FIELD_KEY]: oldToken },
            method: 'GET',
        };
        const resMock = {
            cookie: jest.fn(),
            json: jest.fn(),
            clearCookie: jest.fn(),
        };
        await expect(
            provider.refresh(reqMock as any, resMock as any)
        ).rejects.toEqual(new AuthenticationError('Method not allowed'));
        expect(resMock.json).not.toHaveBeenCalled();
        expect(authHandler).not.toHaveBeenCalled();
        expect(ldapAuthentication).not.toHaveBeenCalled();
        expect(checkUserExists).not.toHaveBeenCalled();
        expect(resMock.cookie).not.toHaveBeenCalled();
        expect(resMock.clearCookie).toHaveBeenCalledWith(COOKIE_FIELD_KEY);
    });

    it('Test refresh should throw right error if missing credentials or token', async () => {
        const { provider, ldapAuthentication, authHandler, checkUserExists } =
            createProvider();
        const reqMock = {
            body: {},
            cookies: {},
            method: 'POST',
        };
        const resMock = {
            cookie: jest.fn(),
            json: jest.fn(),
            clearCookie: jest.fn(),
        };
        await expect(
            provider.refresh(reqMock as any, resMock as any)
        ).rejects.toEqual(new AuthenticationError(AUTH_MISSING_CREDENTIALS));
        expect(resMock.json).not.toHaveBeenCalled();
        expect(authHandler).not.toHaveBeenCalled();
        expect(ldapAuthentication).not.toHaveBeenCalled();
        expect(checkUserExists).not.toHaveBeenCalled();
        expect(resMock.cookie).not.toHaveBeenCalled();
        expect(resMock.clearCookie).toHaveBeenCalledWith(COOKIE_FIELD_KEY);
    });
});

describe('LdapAuthProvider token invalidation tests', () => {
    afterEach(() => {
        jest.useRealTimers();
    });
    it('Test refresh the old token should be invalid', async () => {
        const timer = jest.useFakeTimers();

        const oldToken = jwt.sign({ sub: 'my-uid-name' }, 'secret', {
            expiresIn: '1min',
        });
        timer.advanceTimersByTime(2000);
        const { provider, sub, token } = createProvider();

        const reqMock = {
            body: {},
            cookies: { [COOKIE_FIELD_KEY]: oldToken },
            method: 'POST',
        };
        const resMock = {
            cookie: jest.fn(),
            json: jest.fn(),
            clearCookie: jest.fn(),
        };
        await provider.refresh(reqMock as any, resMock as any);
        expect(resMock.json).toHaveBeenCalledWith({
            backstageIdentity: {
                identity: {
                    ownershipEntityRefs: [],
                    type: 'user',
                    userEntityRef: sub,
                },
                token,
            },
            profile: undefined,
            providerInfo: {},
        });
        // Not I redo the request with the old token
        timer.advanceTimersByTime(2000);
        expect(
            provider.refresh(reqMock as any, resMock as any)
        ).rejects.toEqual(new Error(JWT_EXPIRED_TOKEN));
    });

    it('Test refresh the new token should be valid', async () => {
        const timer = jest.useFakeTimers();

        const oldToken = jwt.sign({ sub: 'my-uid-name' }, 'secret', {
            expiresIn: '1min',
        });
        timer.advanceTimersByTime(2000);
        const { provider, sub, token, signInWithCatalogUser } =
            createProvider();

        const reqMock = {
            body: {},
            cookies: { [COOKIE_FIELD_KEY]: oldToken },
            method: 'POST',
        };
        const resMock = {
            cookie: jest.fn(),
            json: jest.fn(),
            clearCookie: jest.fn(),
        };
        await provider.refresh(reqMock as any, resMock as any);
        expect(resMock.json).toHaveBeenCalledWith({
            backstageIdentity: {
                identity: {
                    ownershipEntityRefs: [],
                    type: 'user',
                    userEntityRef: sub,
                },
                token,
            },
            profile: undefined,
            providerInfo: {},
        });

        // Not I redo the request with the new token
        timer.advanceTimersByTime(2000);
        const newToken = jwt.sign({ sub: 'my-uid-name' }, 'secret', {
            expiresIn: '1min',
        });
        signInWithCatalogUser.mockReturnValue(
            Promise.resolve({
                token: newToken,
            })
        );
        reqMock.cookies[COOKIE_FIELD_KEY] = token;
        await expect(
            provider.refresh(reqMock as any, resMock as any)
        ).resolves.toEqual(undefined);
        expect(resMock.json).lastCalledWith({
            backstageIdentity: {
                identity: {
                    ownershipEntityRefs: [],
                    type: 'user',
                    userEntityRef: sub,
                },
                token: newToken,
            },
            profile: undefined,
            providerInfo: {},
        });
    });
});

describe('LdapAuthProvider token logout', () => {
    afterEach(() => {
        jest.useRealTimers();
    });
    it('Logout should works', async () => {
        const timer = jest.useFakeTimers();

        const oldToken = jwt.sign({ sub: 'my-uid-name' }, 'secret', {
            expiresIn: '1min',
        });
        timer.advanceTimersByTime(2000);

        const { provider, token } = createProvider();
        const reqMock = {
            body: {},
            cookies: { [COOKIE_FIELD_KEY]: oldToken },
            method: 'POST',
        };

        const resMock: any = {
            cookie: jest.fn(),
            status: jest.fn(() => resMock),
            json: jest.fn(),
            clearCookie: jest.fn(),
            end: jest.fn(),
        };

        await provider.refresh(reqMock as any, resMock as any);
        // here we have that "token" is a valid token

        reqMock.cookies[COOKIE_FIELD_KEY] = token;
        timer.advanceTimersByTime(2000);
        await expect(
            provider.logout(reqMock as any, resMock as any)
        ).resolves.toEqual(undefined);

        expect(resMock.status).toHaveBeenCalledWith(200);
        expect(resMock.clearCookie).toHaveBeenCalledWith(COOKIE_FIELD_KEY);
        expect(resMock.end).toHaveBeenCalled();
        timer.advanceTimersByTime(2000);
        expect(
            provider.refresh(reqMock as any, resMock as any)
        ).rejects.toEqual(new Error(JWT_EXPIRED_TOKEN));
    });
});
