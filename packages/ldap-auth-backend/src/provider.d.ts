import type { Request, Response } from 'express';
import type { LDAPAuthOpts } from './types';
import { AuthProviderRouteHandlers, AuthResolverContext } from '@backstage/plugin-auth-backend';
import { defaultAuthHandler, defaultSigninResolver, defaultCheckUserExists, defaultLDAPAuthentication } from './helpers';
export declare class ProviderLdapAuthProvider implements AuthProviderRouteHandlers {
    private readonly cookieFieldKey;
    private readonly checkUserExists;
    private readonly ldapAuthentication;
    private readonly authHandler;
    private readonly signInResolver;
    private readonly resolverContext;
    private readonly LDAPAuthOpts;
    constructor(options: {
        cookieFieldKey: string;
        authHandler: typeof defaultAuthHandler;
        signInResolver: typeof defaultSigninResolver;
        checkUserExists: typeof defaultCheckUserExists;
        ldapAuthentication: typeof defaultLDAPAuthentication;
        resolverContext: AuthResolverContext;
        ldapConfings: LDAPAuthOpts;
    });
    start(): Promise<void>;
    frameHandler(): Promise<void>;
    check(uid: string): Promise<void | Error>;
    refresh(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
}
export declare const ldap: Readonly<{
    create: (options: {
        authHandler?: import("@backstage/plugin-auth-backend").AuthHandler<Partial<import("./types").LDAPResponse>> | undefined;
        signIn?: {
            resolver?: import("@backstage/plugin-auth-backend").SignInResolver<Partial<import("./types").LDAPResponse>> | undefined;
        } | undefined;
        resolvers?: any;
        cookieFieldKey?: string | undefined;
    }) => import("@backstage/plugin-auth-backend").AuthProviderFactory;
    resolvers: never;
}>;
