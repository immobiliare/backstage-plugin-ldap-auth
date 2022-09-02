import {
    BackstageIdentityResponse,
    ProfileInfo,
} from '@backstage/core-plugin-api';
import { z } from 'zod';
export declare const ldapSessionSchema: z.ZodObject<
    {
        providerInfo: z.ZodOptional<
            z.ZodObject<
                {},
                'strip',
                z.ZodUnknown,
                {
                    [x: string]: unknown;
                },
                {
                    [x: string]: unknown;
                }
            >
        >;
        profile: z.ZodObject<
            {
                email: z.ZodOptional<z.ZodString>;
                displayName: z.ZodOptional<z.ZodString>;
                picture: z.ZodOptional<z.ZodString>;
            },
            'strip',
            z.ZodTypeAny,
            {
                picture?: string | undefined;
                displayName?: string | undefined;
                email?: string | undefined;
            },
            {
                picture?: string | undefined;
                displayName?: string | undefined;
                email?: string | undefined;
            }
        >;
        backstageIdentity: z.ZodObject<
            {
                token: z.ZodString;
                identity: z.ZodObject<
                    {
                        type: z.ZodLiteral<'user'>;
                        userEntityRef: z.ZodString;
                        ownershipEntityRefs: z.ZodArray<z.ZodString, 'many'>;
                    },
                    'strip',
                    z.ZodTypeAny,
                    {
                        type: 'user';
                        userEntityRef: string;
                        ownershipEntityRefs: string[];
                    },
                    {
                        type: 'user';
                        userEntityRef: string;
                        ownershipEntityRefs: string[];
                    }
                >;
            },
            'strip',
            z.ZodTypeAny,
            {
                token: string;
                identity: {
                    type: 'user';
                    userEntityRef: string;
                    ownershipEntityRefs: string[];
                };
            },
            {
                token: string;
                identity: {
                    type: 'user';
                    userEntityRef: string;
                    ownershipEntityRefs: string[];
                };
            }
        >;
    },
    'strip',
    z.ZodTypeAny,
    {
        providerInfo?:
            | {
                  [x: string]: unknown;
              }
            | undefined;
        profile: {
            picture?: string | undefined;
            displayName?: string | undefined;
            email?: string | undefined;
        };
        backstageIdentity: {
            token: string;
            identity: {
                type: 'user';
                userEntityRef: string;
                ownershipEntityRefs: string[];
            };
        };
    },
    {
        providerInfo?:
            | {
                  [x: string]: unknown;
              }
            | undefined;
        profile: {
            picture?: string | undefined;
            displayName?: string | undefined;
            email?: string | undefined;
        };
        backstageIdentity: {
            token: string;
            identity: {
                type: 'user';
                userEntityRef: string;
                ownershipEntityRefs: string[];
            };
        };
    }
>;
/**
 * Generic session information for proxied sign-in providers, e.g. common
 * reverse authenticating proxy implementations.
 *
 * @public
 */
export declare type LdapSession = {
    providerInfo?: {
        [key: string]: unknown;
    };
    profile: ProfileInfo;
    backstageIdentity: Omit<BackstageIdentityResponse, 'id'>;
};
