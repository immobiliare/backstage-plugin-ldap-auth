import type { Request, Response } from 'express';
import { authenticate, AuthenticationOptions } from 'ldap-authentication';
import type {
    BackstageLdapAuthConfiguration,
    CookiesOptions,
    ProviderConstructor,
    ProviderCreateOptions,
    UserIdentityId,
} from './types';

import { createAuthProviderIntegration } from '@backstage/plugin-auth-backend';

import {
    AuthProviderRouteHandlers,
    AuthResolverContext,
} from '@backstage/plugin-auth-node';

import { AuthenticationError } from '@backstage/errors';
import { AUTH_MISSING_CREDENTIALS, JWT_INVALID_TOKEN } from './errors';

import {
    parseJwtPayload,
    COOKIE_FIELD_KEY,
    TokenValidator,
    TokenValidatorNoop,
    normalizeTime,
    JWTTokenValidator,
} from './jwt';
import {
    defaultAuthHandler,
    defaultSigninResolver,
    prepareBackstageIdentityResponse,
} from './auth';

import { defaultCheckUserExists, defaultLDAPAuthentication } from './ldap';

export class ProviderLdapAuthProvider implements AuthProviderRouteHandlers {
    private readonly checkUserExists: typeof defaultCheckUserExists;
    private readonly ldapAuthentication: typeof defaultLDAPAuthentication;
    private readonly authHandler: typeof defaultAuthHandler;
    private readonly signInResolver: typeof defaultSigninResolver;
    private readonly resolverContext: AuthResolverContext;
    private readonly jwtValidator: TokenValidator;
    private readonly ldapAuthenticationOptions: AuthenticationOptions;
    private readonly cookies: CookiesOptions;

    constructor(options: ProviderConstructor) {
        this.authHandler = options.authHandler;
        this.signInResolver = options.signInResolver;
        this.checkUserExists = options.checkUserExists;
        this.ldapAuthentication = options.ldapAuthentication;
        this.resolverContext = options.resolverContext;
        this.ldapAuthenticationOptions = options.ldapAuthenticationOptions;
        this.cookies = options.cookies as CookiesOptions;
        this.jwtValidator = options.tokenValidator || new TokenValidatorNoop();
    }

    // must keep this methods for the interface
    async start() {
        return;
    }
    async frameHandler() {
        return;
    }

    async check(uid: string): Promise<void | Error> {
        const exists = await this.checkUserExists(
            {
                ...this.ldapAuthenticationOptions,
                username: uid,
            },
            authenticate
        );
        if (!exists) throw new Error(JWT_INVALID_TOKEN);
    }

    async refresh(req: Request, res: Response): Promise<void> {
        try {
            if (req.method !== 'POST') {
                throw new AuthenticationError('Method not allowed');
            }
            const { username, password } = req.body;
            const ctx = this.resolverContext;
            const token = req.cookies?.[this.cookies.field];

            let result: UserIdentityId;

            if (username && password) {
                const { uid } = await this.ldapAuthentication(
                    username,
                    password,
                    this.ldapAuthenticationOptions,
                    authenticate
                );
                result = { uid: uid as string };
            } else if (token) {
                // this throws if the token is invalid or expired
                await this.jwtValidator.isValid(token as string);

                const { sub } = parseJwtPayload(token as string);

                // user is in format `[<kind>:][<namespace>/]<username>`
                const uid = sub.split(':').at(-1)!.split('/').at(-1);
                await this.check(uid as string);

                result = { uid: uid as string };
            } else {
                throw new AuthenticationError(AUTH_MISSING_CREDENTIALS);
            }

            // invalidate old token
            if (token) await this.jwtValidator.invalidateToken(token);

            // This is used to return a backstage formated profile object
            const { profile } = await this.authHandler(
                { uid: result.uid as string },
                ctx
            );

            // this sign-in the user into backstage and return an object with the token
            const backstageIdentity = await this.signInResolver(
                { profile, result },
                ctx
            );

            const response = {
                providerInfo: {},
                profile,
                // this backstage user information from the token and formats
                // the reponse in way that's usable by the FE
                backstageIdentity:
                    prepareBackstageIdentityResponse(backstageIdentity),
            };

            const { exp } = parseJwtPayload(backstageIdentity.token as string);
            // maxAge value should be relative to now()
            // if it's negative it's expired already
            // should not happen but in case it will trigger browser for login page
            const maxAge = Math.ceil(
                new Date(exp * 1000).valueOf() -
                    new Date().valueOf() +
                    ((this.jwtValidator as JWTTokenValidator)
                        ?.increaseTokenExpireMs || 0)
            );

            res.cookie(this.cookies.field, backstageIdentity.token, {
                maxAge,
                httpOnly: true,
                secure: this.cookies.secure,
            });

            res.json(response);
        } catch (e) {
            res.clearCookie(this.cookies.field);
            throw e;
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        const token = req.cookies?.[this.cookies.field];
        // this throws if the token is invalid
        await this.jwtValidator.isValid(token as string);

        this.jwtValidator.logout(token, normalizeTime(Date.now()));

        res.clearCookie(this.cookies.field);
        res.status(200).end();
    }
}

export const ldap = createAuthProviderIntegration({
    create(options: ProviderCreateOptions) {
        return ({ config, resolverContext }) => {
            const cnf = config.get(
                process.env.NODE_ENV || 'development'
            ) as BackstageLdapAuthConfiguration;

            cnf.cookies = {
                field: cnf?.cookies?.field || COOKIE_FIELD_KEY,
                secure: cnf?.cookies?.secure || false,
            };

            const authHandler =
                typeof options?.authHandler === 'function'
                    ? options?.authHandler
                    : defaultAuthHandler;

            const signInResolver =
                typeof options?.signIn?.resolver === 'function'
                    ? options?.signIn?.resolver
                    : defaultSigninResolver;

            // this is LDAP specific
            const ldapAuthentication =
                typeof options?.resolvers?.ldapAuthentication === 'function'
                    ? options?.resolvers?.ldapAuthentication
                    : defaultLDAPAuthentication;

            const checkUserExists =
                typeof options?.resolvers?.checkUserExists === 'function'
                    ? options?.resolvers?.checkUserExists
                    : defaultCheckUserExists;

            return new ProviderLdapAuthProvider({
                ldapAuthenticationOptions: cnf.ldapAuthenticationOptions,
                cookies: cnf.cookies,
                authHandler,
                signInResolver,
                checkUserExists,
                ldapAuthentication,
                resolverContext,
                tokenValidator: options.tokenValidator,
            });
        };
    },
});
