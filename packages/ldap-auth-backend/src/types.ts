/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A representation of a successful Backstage sign-in.
 *
 * Compared to the {@link BackstageIdentityResponse} this type omits
 * the decoded identity information embedded in the token.
 *
 * @public
 */
export interface BackstageSignInResult {
    /**
     * The token used to authenticate the user within Backstage.
     */
    token: string;
}

/**
 * Response object containing the {@link BackstageUserIdentity} and the token
 * from the authentication provider.
 *
 * @public
 */
export interface BackstageIdentityResponse extends BackstageSignInResult {
    /**
     * A plaintext description of the identity that is encapsulated within the token.
     */
    identity: BackstageUserIdentity;
}

/**
 * User identity information within Backstage.
 *
 * @public
 */
export type BackstageUserIdentity = {
    /**
     * The type of identity that this structure represents. In the frontend app
     * this will currently always be 'user'.
     */
    type: 'user';

    /**
     * The entityRef of the user in the catalog.
     * For example User:default/sandra
     */
    userEntityRef: string;

    /**
     * The user and group entities that the user claims ownership through
     */
    ownershipEntityRefs: string[];
};

export type LDAPResponse = {
    dn: string;
    controls?: [];
    uid: string;
    givenName: string;
    cn: string;
    uidNumber: string;
    gidNumber: string;
    homeDirectory: string;
    mail: string;
    sn: string;
    objectClass: string[];
};

export type LDAPUser = Partial<LDAPResponse>;

export type UserIdentityId = Pick<LDAPResponse, 'uid'>;

export type BackstageJWTPayload = {
    iss: string;
    sub: string;
    ent: string[];
    aud: string;
    iat: number;
    exp: number;
};

import type { TokenValidator } from './jwt';
import type { AuthResolverContext } from '@backstage/plugin-auth-node';
import type { AuthenticationOptions } from 'ldap-authentication';
import { defaultAuthHandler, defaultSigninResolver } from './auth';
import { defaultCheckUserExists, defaultLDAPAuthentication } from './ldap';

export type CookiesOptions = {
    field: string;
    secure: boolean;
};

export type BackstageLdapAuthConfiguration = {
    cookies?: Partial<CookiesOptions>;
    ldapAuthenticationOptions: AuthenticationOptions;
};

export type ProviderCreateOptions = {
    // Backstage Provider AuthHandler
    authHandler?: typeof defaultAuthHandler;
    // Backstage Provider SignInResolver
    signIn?: {
        resolver?: typeof defaultSigninResolver;
    };

    // Custom resolvers
    resolvers?: {
        checkUserExists?: typeof defaultCheckUserExists;
        ldapAuthentication?: typeof defaultLDAPAuthentication;
    };
    // Custom validator function for the JWT token if needed
    tokenValidator?: TokenValidator;
};

export type ProviderConstructor = {
    cookies: BackstageLdapAuthConfiguration['cookies'];
    ldapAuthenticationOptions: AuthenticationOptions;
    authHandler: typeof defaultAuthHandler;
    signInResolver: typeof defaultSigninResolver;
    checkUserExists: typeof defaultCheckUserExists;
    ldapAuthentication: typeof defaultLDAPAuthentication;
    resolverContext: AuthResolverContext;
    tokenValidator?: TokenValidator;
};
