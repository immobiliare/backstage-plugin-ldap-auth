import {
    BackstageIdentityResponse,
    ProfileInfo,
} from '@backstage/core-plugin-api';
import { z } from 'zod';

export const ldapSessionSchema = z.object({
    providerInfo: z.object({}).catchall(z.unknown()).optional(),
    profile: z.object({
        email: z.string().optional(),
        displayName: z.string().optional(),
        picture: z.string().optional(),
    }),
    backstageIdentity: z.object({
        token: z.string(),
        identity: z.object({
            type: z.literal('user'),
            userEntityRef: z.string(),
            ownershipEntityRefs: z.array(z.string()),
        }),
    }),
});

/**
 * Generic session information for proxied sign-in providers, e.g. common
 * reverse authenticating proxy implementations.
 *
 * @public
 */
export type LdapSession = {
    providerInfo?: { [key: string]: unknown };
    profile: ProfileInfo;
    backstageIdentity: Omit<BackstageIdentityResponse, 'id'>;
};
