# Use a database to store JWT tokens for revalidation

Since tokens are not stored in any way by Backstage we may want to do so to manually expire (eg: bans or deleted users).

This examples uses Keyv with the same PostgreSQL db used internally by backstage, saving tokens in another table.

```ts
import { createRouter, ProfileInfo } from '@backstage/plugin-auth-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

import {
    ldap,
    JWTTokenValidator,
    TokenValidator,
} from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';
import Keyv from 'keyv';
import { getRootLogger } from '@backstage/backend-common';

const CONNECTION_STRING = 'backend.database.connection';

export default async function createPlugin(
    env: PluginEnvironment
): Promise<Router> {
    const logger = getRootLogger();

    const connection = env.config.getOptional(CONNECTION_STRING);

    const host = env.config.getOptionalString(`${CONNECTION_STRING}.host`);
    const port = env.config.getOptionalString(`${CONNECTION_STRING}.port`);
    const user = env.config.getOptionalString(`${CONNECTION_STRING}.user`);
    const password = env.config.getOptionalString(
        `${CONNECTION_STRING}.password`
    );

    const tokenValidator: TokenValidator | undefined = new JWTTokenValidator(
        new Keyv(
            `postgresql://${user}:${password}@${host}:${port}/bs_jwt_tokens`,
            { table: 'token' }
        )
    );

    return await createRouter({
        logger: env.logger,
        config: env.config,
        database: env.database,
        discovery: env.discovery,
        tokenManager: env.tokenManager,
        providerFactories: {
            ldap: ldap.create({
                tokenValidator,
            }),
        },
    });
}
```
