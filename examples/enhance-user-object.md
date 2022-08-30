```ts
import { createRouter, ProfileInfo } from '@backstage/plugin-auth-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

import {
  ldap,
  JWTTokenValidator,
  TokenValidator,
} from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';
import { getProfilePictureByMail } from './gitlab';
import Keyv from 'keyv';
import { getRootLogger } from '@backstage/backend-common';

const CONNECTION_STRING = 'backend.database.connection';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const logger = getRootLogger();

  const connection = env.config.getOptional(CONNECTION_STRING);

  let tokenValidator: TokenValidator | undefined;
  if (connection === ':memory:') {
    const cacheClient = env.cache.getClient() as any;
    cacheClient.has = (key: string) => Boolean(cacheClient.get(key));

    tokenValidator = new JWTTokenValidator(cacheClient);
  } else if (
    typeof connection === 'object' &&
    env.config.getOptional('backend.database.client') === 'pg'
  ) {
    const host = env.config.getOptionalString(`${CONNECTION_STRING}.host`);
    const port = env.config.getOptionalString(`${CONNECTION_STRING}.port`);
    const user = env.config.getOptionalString(`${CONNECTION_STRING}.user`);
    const password = env.config.getOptionalString(
      `${CONNECTION_STRING}.password`,
    );

    const url = `postgresql://${user}:${password}@${host}:${port}/pepitadb`;

    tokenValidator = new JWTTokenValidator(new Keyv(url, { table: 'token' }));
    logger.info('Saving tokens on postgres.');
  }

  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    providerFactories: {
      ldap: ldap.create({
        tokenValidator: tokenValidator,
        // this adds our Gitlab profile picture
        async authHandler({ uid }, ctx) {
          const { apiBaseUrl, token } = (env.config.get('integrations') as any)
            ?.gitlab?.[0];

          const backstageUserData = await ctx.findCatalogUser({
            entityRef: uid as string,
          });

          const profile = backstageUserData?.entity?.spec
            ?.profile as ProfileInfo;

          try {
            const picture = await getProfilePictureByMail(
              profile.email || '',
              apiBaseUrl,
              token,
            );
            if (picture) {
              profile.picture = picture;
            }
          } catch (e) {
            console.log(e);
            // silence
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
