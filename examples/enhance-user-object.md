```ts
import { createRouter, ProfileInfo } from '@backstage/plugin-auth-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

import { ldap } from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';

import crypto from 'crypto';

const md5 = crypto.createHash('md5');

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    providerFactories: {
      ldap: ldap.create({
        // this adds our Gitlab profile picture
        async authHandler({ uid }, ctx) {
          const backstageUserData = await ctx.findCatalogUser({
            entityRef: uid as string,
          });

          const profile = backstageUserData?.entity?.spec
            ?.profile as ProfileInfo;

          if (profile?.email) {
            const hash = md5.update(profile.email).digest('hex');
            profile.picture = `https://www.gravatar.com/avatar/${hash}`;
          }

          return {
            profile,
          };
        },
      }),
    },
  });
}

```
