import type {
  AuthResolverContext,
  ProfileInfo,
  SignInResolver,
} from "@backstage/plugin-auth-node";
import type {
  BackstageIdentityResponse,
  BackstageSignInResult,
  LDAPUser,
} from "./types";

/** @internal Replaces the removed AuthHandler type from \@backstage/plugin-auth-backend */
type AuthHandler<T> = (
  input: T,
  ctx: AuthResolverContext,
) => Promise<{ profile: ProfileInfo }>;

import { parseJwtPayload } from "./jwt";

export function prepareBackstageIdentityResponse(
  result: BackstageSignInResult,
): BackstageIdentityResponse {
  const { sub, ent } = parseJwtPayload(result.token);

  return {
    ...result,
    identity: {
      type: "user",
      userEntityRef: sub,
      ownershipEntityRefs: ent || [],
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
