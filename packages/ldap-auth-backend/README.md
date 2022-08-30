# @immobiliarelabs/backstage-plugin-ldap-auth-backend

> Customizable LDAP Backend Authentication provider for Backstage

This plugin helps you add authentication to your ldap server to your Backstage deployment easily out of the box!

It works both on simple single process installation and on scaled infrastracture spanning multiple processes/deployments using the shared PostgreSQL instance that Backstage already uses!

This plugin is not meant to be used alone but with in pair with:

-   The official [@backstage/plugin-catalog-backend-module-ldap](https://www.npmjs.com/package/@backstage/plugin-catalog-backend-module-ldap) which keeps in sync your LDAP users with Backstage user catalogs!
-   Its sibling frontend package [@immobiliarelabs/backstage-plugin-ldap-auth](https://www.npmjs.com/package/@immobiliarelabs/backstage-plugin-ldap-auth)

Supports Node.js `>=14.0.0`

## Table of Content

<!-- toc -->

<!-- tocstop -->

## Installation

The package is available at [npm](https://www.npmjs.com/package/@immobiliarelabs/backstage-plugin-ldap-auth-backend).

You can install it with `npm`

```bash
# lastest stable version
$ npm i -S @immobiliarelabs/backstage-plugin-ldap-auth-backend @immobiliarelabs/backstage-plugin-ldap-auth
```

or `yarn`

```bash
# lastest stable version
$ yarn add @immobiliarelabs/backstage-plugin-ldap-auth-backend @immobiliarelabs/backstage-plugin-ldap-auth
```

## Configurations

This documentation assumes that you scaffolded your Backstage instance from the official `@backstage/create-app`, all files that we're going to customize here are the one already created by the CLI!

### Connection Configuration

> Add this at the root level of your Backstage `app-config.yaml`

```yml
auth:
    environment: ENV_NAME
    providers:
        ldap:
            ENV_NAME:
                url:
                    - 'ldaps://123.123.123.123'
                rejectUnauthorized: false
                userDn: 'ou=usr,dc=ns,dc=frm'
                userSearchBase: 'dc=ns,dc=frm'
```

### Setup Backstage official LDAP plugin

> Import and keep in sync your LDAP users

```ts
// `packages/backend/src/plugins/catalog.ts`
import type { Router } from 'express';
import type { PluginEnvironment } from '../types';

import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-scaffolder-backend';
import {
  LdapOrgEntityProvider,
} from '@backstage/plugin-catalog-backend-module-ldap';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);

  builder.addEntityProvider(
    LdapOrgEntityProvider.fromConfig(env.config, {
      id: '<YOUR-ID>',
      target: 'ldaps://<YOUR-ADDRESS>',
      logger: env.logger,
      schedule: env.scheduler.createScheduledTaskRunner({
        frequency: // whatever
        timeout: // whatever
      }),
    }),
  );

  builder.addProcessor(new ScaffolderEntitiesProcessor());
  const { processingEngine, router } = await builder.build();
  await processingEngine.start();
  return router;
}
```

### Add authentication backend

> This assumes a basic usage: single process without custom auth function or user object customization and in-memory token storage

```ts
import { createRouter } from '@backstage/plugin-auth-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { ldap } from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';

export default async function createPlugin(
    env: PluginEnvironment
): Promise<Router> {
    return await createRouter({
        logger: env.logger,
        config: env.config,
        database: env.database,
        discovery: env.discovery,
        tokenManager: env.tokenManager,
        providerFactories: {
            ldap: ldap.create({}),
        },
    });
}
```

And you're ready to go! If you need more use cases, like having multiple processes and need a shared token store instead of in-memory look at the [examples folder](https://github.com/immobiliare/backstage-plugin-ldap-auth/examples)

## Powered Apps

dats was created by the amazing Node.js team at ImmobiliareLabs, the Tech dept of [Immobiliare.it](https://www.immobiliare.it), the #1 real estate company in Italy.

We are currently using dats in our products as well as our internal toolings.

**If you are using dats in production [drop us a message](mailto:opensource@immobiliare.it)**.

## Support & Contribute

Made with ❤️ by [ImmobiliareLabs](https://github.com/immobiliare) & [Contributors](./CONTRIBUTING.md#contributors)

We'd love for you to contribute to dats!
If you have any questions on how to use dats, bugs and enhancement please feel free to reach out by opening a [GitHub Issue](https://github.com/immobiliare/dats/issues).

## License

dats is licensed under the MIT license.  
See the [LICENSE](./LICENSE) file for more information.
