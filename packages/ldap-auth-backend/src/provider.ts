import type { Request, Response } from 'express';
import type { LDAPAuthOpts, UserIdentityId } from './types';

import { dn } from 'ldap-escape';
import {
  AuthProviderRouteHandlers,
  AuthResolverContext,
  createAuthProviderIntegration,
} from '@backstage/plugin-auth-backend';

import {
  defaultAuthHandler,
  defaultSigninResolver,
  defaultCheckUserExists,
  prepareBackstageIdentityResponse,
  parseJwtPayload,
  jwtTokenCache,
  defaultLDAPAuthentication,
  COOKIE_FIELD_KEY,
} from './helpers';

import { AuthenticationError } from '@backstage/errors';
import { AUTH_MISSING_CREDENTIALS, JWT_INVALID_TOKEN } from './errors';

export class ProviderLdapAuthProvider implements AuthProviderRouteHandlers {
  private readonly cookieFieldKey: string;
  private readonly checkUserExists: typeof defaultCheckUserExists;
  private readonly ldapAuthentication: typeof defaultLDAPAuthentication;
  private readonly authHandler: typeof defaultAuthHandler;
  private readonly signInResolver: typeof defaultSigninResolver;
  private readonly resolverContext: AuthResolverContext;
  private readonly LDAPAuthOpts: LDAPAuthOpts;

  constructor(options: {
    cookieFieldKey: string;
    authHandler: typeof defaultAuthHandler;
    signInResolver: typeof defaultSigninResolver;
    checkUserExists: typeof defaultCheckUserExists;
    ldapAuthentication: typeof defaultLDAPAuthentication;
    resolverContext: AuthResolverContext;
    ldapConfings: LDAPAuthOpts;
  }) {
    this.authHandler = options.authHandler;
    this.signInResolver = options.signInResolver;
    this.checkUserExists = options.checkUserExists;
    this.ldapAuthentication = options.ldapAuthentication;
    this.resolverContext = options.resolverContext;
    this.LDAPAuthOpts = options.ldapConfings;
    this.cookieFieldKey = options.cookieFieldKey;
  }

  // must keep this methods for the interface
  async start() {}
  async frameHandler() {}

  async check(uid: string): Promise<void | Error> {
    const exists = await this.checkUserExists(
      {
        url: this.LDAPAuthOpts.url,
        tlsOptions: {
          rejectUnauthorized: this.LDAPAuthOpts.rejectUnauthorized,
        },
      },
      uid,
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
      const token = req.cookies?.[this.cookieFieldKey];

      let result: UserIdentityId;

      if (username && password) {
        const { uid } = await this.ldapAuthentication({
          ldapOpts: {
            url: this.LDAPAuthOpts.url,
            tlsOptions: {
              rejectUnauthorized: this.LDAPAuthOpts.rejectUnauthorized,
            },
          },
          userDn: dn`uid=${username},` + this.LDAPAuthOpts.userDn,
          userSearchBase: this.LDAPAuthOpts.userSearchBase,
          userPassword: password as string,
          usernameAttribute: 'uid',
          username: username as string,
        });
        result = { uid: uid as string };
      } else if (token) {
        // this throws if the token is invalid
        jwtTokenCache.isValid(token as string);

        // throws if invalid/expired
        const { sub } = parseJwtPayload(token as string);

        // user is in format `[<kind>:][<namespace>/]<username>`
        const uid = sub.split(':').at(-1)!.split('/').at(-1);
        await this.check(uid as string);

        result = { uid: uid as string };
      } else {
        throw new AuthenticationError(AUTH_MISSING_CREDENTIALS);
      }

      // This is used to return a backstage formated profile object
      const { profile } = await this.authHandler(
        { uid: result.uid as string },
        ctx,
      );

      // this sign-in the user into backstage and return an object with the token
      const backstageIdentity = await this.signInResolver(
        { profile, result },
        ctx,
      );

      const response = {
        providerInfo: {},
        profile,
        // this backstage user information from the token and formats
        // the reponse in way that's usable by the FE
        backstageIdentity: prepareBackstageIdentityResponse(backstageIdentity),
      };

      // flag all tokens issued before this as invalid for this user
      const { iat, sub, exp } = parseJwtPayload(
        backstageIdentity.token as string,
      );
      jwtTokenCache.setLastIssuedAtForUser(sub, iat);

      // maxAge value should be relative to now()
      // if it's negative it's expired already
      // should not happen but in case it will trigger browser for login page
      const maxAge = Math.ceil(
        new Date(exp * 1000).valueOf() - new Date().valueOf(),
      );

      res.cookie(this.cookieFieldKey, backstageIdentity.token, {
        maxAge,
        httpOnly: true,
      });

      res.json(response);
    } catch (e) {
      res.clearCookie(this.cookieFieldKey);
      throw e;
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.[this.cookieFieldKey];
    // this throws if the token is invalid
    jwtTokenCache.isValid(token as string);
    // flag all tokens issued before this as invalid for this user
    const { sub } = parseJwtPayload(token);
    jwtTokenCache.setLastIssuedAtForUser(sub, Math.floor(Date.now() / 1000));

    res.clearCookie(this.cookieFieldKey);
    res.status(200).end();
  }
}

export const ldap = createAuthProviderIntegration({
  create(options: {
    authHandler?: typeof defaultAuthHandler;
    signIn?: {
      resolver?: typeof defaultSigninResolver;
    };
    resolvers?: any;
    cookieFieldKey?: string;
  }) {
    return ({ config, resolverContext }) => {
      const cnf = config.getConfig(process.env.NODE_ENV || 'development');

      const parsedConf = {
        url: cnf.getStringArray('url'),
        rejectUnauthorized: cnf.getBoolean('rejectUnauthorized'),
        userDn: cnf.getString('userDn'),
        userSearchBase: cnf.getString('userSearchBase'),
      };

      const authHandler = options?.authHandler ?? defaultAuthHandler;
      const signInResolver = options?.signIn?.resolver ?? defaultSigninResolver;

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
        cookieFieldKey: options?.cookieFieldKey ?? COOKIE_FIELD_KEY,
        authHandler,
        signInResolver,
        checkUserExists,
        ldapAuthentication,
        ldapConfings: parsedConf,
        resolverContext,
      });
    };
  },
});
