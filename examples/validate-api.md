# Validate API

If you want to validate Backstage API you have follow this steps:

1. Install `keyv`:

```bash
yarn add --cwd packages/backend keyv
```

2. Create the file tokenValidator

`packages/backend/src/tokenValidator.ts`

```ts
import { getRootLogger } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import {
    JWTTokenValidator,
    TokenValidator,
} from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';
import Keyv from 'keyv';

const CONNECTION_STRING = 'backend.database.connection';

export default function getTokenValidator(
    config: Config
): TokenValidator | undefined {
    const logger = getRootLogger();
    const connection = config.getOptional(CONNECTION_STRING);

    // Here we use postgres to store the tokens
    let tokenValidator: TokenValidator | undefined;
    if (
        typeof connection === 'object' &&
        config.getOptional('backend.database.client') === 'pg'
    ) {
        const host = config.getOptionalString(`${CONNECTION_STRING}.host`);
        const port = config.getOptionalString(`${CONNECTION_STRING}.port`);
        const user = config.getOptionalString(`${CONNECTION_STRING}.user`);
        const password = config.getOptionalString(
            `${CONNECTION_STRING}.password`
        );

        const url = `postgresql://${user}:${password}@${host}:${port}/postgres-db`;

        tokenValidator = new JWTTokenValidator(
            new Keyv(url, { table: 'token' })
        );
        logger.info('Saving tokens on postgres.');
    } else {
        // If postgres is not configured we store tokens in memory
        tokenValidator = new JWTTokenValidator(new Keyv());
        logger.warn('The tokens are saved in memory!');
    }

    return tokenValidator;
}
```

3. Add `TokenValidator` in the plugin env.

`packages/backend/src/types.ts`

```diff
  import { Logger } from 'winston';
  import { Config } from '@backstage/config';
  import {
    PluginCacheManager,
    PluginDatabaseManager,
    PluginEndpointDiscovery,
    TokenManager,
    UrlReader,
  } from '@backstage/backend-common';
  import { PluginTaskScheduler } from '@backstage/backend-tasks';
  import { PermissionEvaluator } from '@backstage/plugin-permission-common';
  import { IdentityApi } from '@backstage/plugin-auth-node';
+ import { TokenValidator } from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';

  export type PluginEnvironment = {
    logger: Logger;
    cache: PluginCacheManager;
    database: PluginDatabaseManager;
    config: Config;
    reader: UrlReader;
    discovery: PluginEndpointDiscovery;
    tokenManager: TokenManager;
    permissions: PermissionEvaluator;
    scheduler: PluginTaskScheduler;
    identity: IdentityApi;
+   tokenValidator?: TokenValidator;
  };
```

`packages/backend/src/index.ts`

```diff
+ import getTokenValidator from './tokenValidator';
...
function makeCreateEnv(config: Config) {
  ...
+ const tokenValidator = getTokenValidator(config);

  return (plugin: string): PluginEnvironment => {
    const logger = root.child({ type: 'plugin', plugin });
    const database = databaseManager.forPlugin(plugin);
    const cache = cacheManager.forPlugin(plugin);

    return {
      logger,
      cache,
      database,
      ...
+     tokenValidator,
    };
  };
}
...
```

4. Create the function `createAuthMiddleware`

`packages/backend/src/authMiddleware.ts`

```ts
import { getBearerTokenFromAuthorizationHeader } from '@backstage/plugin-auth-node';
import { NextFunction, Request, Response, RequestHandler } from 'express';
import { PluginEnvironment } from './types';

export const createAuthMiddleware = async (appEnv: PluginEnvironment) => {
    const authMiddleware: RequestHandler = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            // Here the cookie token is used by ldap-auth-plugin "backstage-token"
            const token =
                getBearerTokenFromAuthorizationHeader(
                    req.headers.authorization
                ) || (req.cookies?.['backstage-token'] as string | undefined);
            if (!token) {
                res.status(401).send('Unauthorized');
                return;
            }
            // If token validator is undefined we do not check
            await appEnv.tokenValidator?.isValid(token);

            try {
                req.user = await appEnv.identity.getIdentity({ request: req });
            } catch {
                // Nope
            }
            if (!req.headers.authorization) {
                // Authorization header may be forwarded by plugin requests
                req.headers.authorization = `Bearer ${token}`;
            }
            next();
        } catch (error) {
            res.status(401).send(`Unauthorized ${error}`);
        }
    };
    return authMiddleware;
};
```
5. Create the `authMiddleware` and add it to the APIs you want to authenticate.

`packages/backend/src/index.ts`
```diff
+ import { createAuthMiddleware } from './authMiddleware';

async function main() {
  ...
+ const authMiddleware = await createAuthMiddleware(appEnv);

  const apiRouter = Router();
  apiRouter.use(cookieParser());
+ apiRouter.use('/catalog', authMiddleware, await catalog(catalogEnv));
+ apiRouter.use('/scaffolder', authMiddleware, await scaffolder(scaffolderEnv));
  apiRouter.use('/tech-insights', await techInsights(techInsightsEnv));
  apiRouter.use('/auth', await auth(authEnv));
+ apiRouter.use('/search', authMiddleware, await search(searchEnv));
+ apiRouter.use('/techdocs', authMiddleware, await techdocs(techdocsEnv));
  apiRouter.use('/todo', await todo(todoEnv));
  apiRouter.use('/kubernetes', await kubernetes(kubernetesEnv));
  apiRouter.use('/kafka', await kafka(kafkaEnv));
+ apiRouter.use('/proxy', authMiddleware, await proxy(proxyEnv));
  apiRouter.use('/badges', await badges(badgesEnv));
  apiRouter.use('/permission', await permission(permissionEnv));
+ apiRouter.use('/gitlab', authMiddleware, await gitlab(gitlabEnv));
  apiRouter.use('/entity-feedback', await entityFeedback(entityFeedbackEnv));
  apiRouter.use(notFoundHandler());
...
}
```
