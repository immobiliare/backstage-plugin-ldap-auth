import type {
  BackstageSignInResult,
  BackstageIdentityResponse,
  LDAPUser,
  BackstageJWTPayload,
} from './types';

import { ProfileInfo } from '@backstage/core-plugin-api';
import {
  AuthHandler,
  AuthResolverContext,
  SignInResolver,
} from '@backstage/plugin-auth-backend';

import * as ldap from 'ldapjs';
import { dn } from 'ldap-escape';
import { authenticate, AuthenticationOptions } from 'ldap-authentication';

import {
  JWT_EXPIRED_TOKEN,
  JWT_INVALID_TOKEN,
  LDAP_CONNECT_FAIL,
} from './errors';

export const COOKIE_FIELD_KEY = 'backstage-token';

export function parseJwtPayload(token: string): BackstageJWTPayload | never {
  try {
    const [_header, payload, _signature] = token.split('.');
    const parsed = JSON.parse(Buffer.from(payload, 'base64').toString());
    const { exp } = parsed;
    if (Math.floor(Date.now() / 1000) > parseInt(exp, 10)) {
      // is expired?
      throw new Error(JWT_EXPIRED_TOKEN);
    }
    return parsed;
  } catch (e) {
    throw new Error(JWT_INVALID_TOKEN);
  }
}

export function prepareBackstageIdentityResponse(
  result: BackstageSignInResult,
): BackstageIdentityResponse {
  const { sub, ent } = parseJwtPayload(result.token);

  return {
    ...result,
    identity: {
      type: 'user',
      userEntityRef: sub,
      ownershipEntityRefs: ent ?? [],
    },
  };
}

export const defaultSigninResolver: SignInResolver<LDAPUser> = async (
  { result },
  ctx: AuthResolverContext,
): Promise<BackstageSignInResult> => {
  const backstageIdentity: BackstageSignInResult =
    await ctx.signInWithCatalogUser({
      entityRef: result.uid as string,
    });

  return backstageIdentity;
};

export const defaultAuthHandler: AuthHandler<LDAPUser> = async (
  { uid },
  ctx: AuthResolverContext,
): Promise<{ profile: ProfileInfo }> => {
  const backstageUserData = await ctx.findCatalogUser({
    entityRef: uid as string,
  });
  return { profile: backstageUserData?.entity?.spec?.profile as ProfileInfo };
};

export const defaultLDAPAuthentication = function defaultLDAPAuthentication(
  options: AuthenticationOptions,
): Promise<LDAPUser> {
  return authenticate(options);
};

function ldapClient(
  ldapOpts: ldap.ClientOptions,
): Promise<ldap.Client | Error> {
  return new Promise((resolve, reject) => {
    ldapOpts.connectTimeout = ldapOpts.connectTimeout || 5000;
    const client = ldap.createClient(ldapOpts);

    client.on('connect', () => resolve(client));
    client.on('timeout', reject);
    client.on('connectTimeout', reject);
    client.on('error', reject);
    client.on('connectError', reject);
  });
}

export const defaultCheckUserExists = async (
  ldapOpts: ldap.ClientOptions,
  uid: string,
) => {
  const client = await ldapClient(ldapOpts);
  if (client instanceof Error)
    throw new Error(`${LDAP_CONNECT_FAIL} ${client.message}`);

  return new Promise((resolve, reject) => {
    client.search(dn`uid=${uid},ou=users,dc=ns,dc=farm`, {}, (error, res) => {
      if (error) reject(error);
      let exists = false; // avoids double resolve call if user exists
      res.on('searchEntry', () => (exists = true));
      res.on('error', () => client.unbind());
      res.on('end', () => {
        resolve(exists);
        client.unbind();
      });
    });
  });
};

// TODO: Rework this to use the database for better scalabilities
class JWTTokenCache extends Map {
  // On logout and refresh set the new invalidBeforeDate for the user
  setLastIssuedAtForUser(uid: string, invalidBeforeTimestamp: number) {
    this.set(uid, invalidBeforeTimestamp);
    return this;
  }

  // rejects tokens issued before logouts and refreshs
  isValid(jwt: string) {
    const { sub, iat } = parseJwtPayload(jwt);

    // // check if we have and entry in the cache
    if (this.has(sub)) {
      const invalidBeforeDate = this.get(sub);

      // if user signed off
      if (invalidBeforeDate && iat < invalidBeforeDate) {
        throw new Error(JWT_EXPIRED_TOKEN);
      }
    }

    return true;
  }
}

export const jwtTokenCache = new JWTTokenCache();
