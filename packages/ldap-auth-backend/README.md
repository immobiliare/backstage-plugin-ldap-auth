<p align="center">
  <img src="https://avatars.githubusercontent.com/u/10090828?s=200&v=4" width="200px" alt="logo"/>
</p>
<h1 align="center">@immobiliarelabs/backstage-plugin-ldap-auth-backend</h1>

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/backstage-plugin-ldap-auth-backend?style=flat-square)
![license](https://img.shields.io/github/license/immobiliare/backstage-plugin-ldap-auth?style=flat-square)

> LDAP Authentication your [Backstage](https://backstage.io/) deployment

This package is the Backend Provider to add LDAP authentication to your Backstage instance!

-   Customizable: Authentication request format and marshaling of the response can be injected with custom ones;
-   Works on simple stand-alone process or scaled infrastracture spanning multiple deployments using the shared PostgreSQL instance that Backstage already uses;

This plugin is not meant to be used alone but in pair with:

-   The official [@backstage/plugin-catalog-backend-module-ldap](https://www.npmjs.com/package/@backstage/plugin-catalog-backend-module-ldap) which keeps in sync your LDAP users with Backstage user catalogs!
-   Its sibling frontend package [@immobiliarelabs/backstage-plugin-ldap-auth](https://www.npmjs.com/package/@immobiliarelabs/backstage-plugin-ldap-auth)

<p align="center"><img src="https://github.com/immobiliare/backstage-plugin-ldap-auth/blob/main/screen.jpg?raw=true?cdn=1" width="600px" alt="LDAP Auth login page screenshot" /></p>

## Table of Content

<!-- toc -->

- [Migration to v5.x: `ldapjs` to `ldapts`](#migration-to-v5x-ldapjs-to-ldapts)
  * [Migration Guide](#migration-guide)
- [Installation](#installation)
- [Configurations](#configurations)
  * [Setup](#setup)
  * [Connection Configuration](#connection-configuration)
  * [New Backend System](#new-backend-system)
  * [Old Backend System (Legacy)](#old-backend-system-legacy)
  * [Custom LDAP Configurations](#custom-ldap-configurations)
    + [Custom authentication function](#custom-authentication-function)
    + [Custom check if user exists](#custom-check-if-user-exists)
  * [Add the login form](#add-the-login-form)
- [Powered Apps](#powered-apps)
- [Support & Contribute](#support--contribute)
- [License](#license)

<!-- tocstop -->

## Migration to v5.x: `ldapjs` to `ldapts`

> [!IMPORTANT]
> Starting with version `5.x`, we have fully replaced `ldapjs` and `ldap-authentication` with [`ldapts`](https://github.com/ldapts/ldapts). This architectural switch was necessary because `ldapjs` is no longer maintained and has been deprecated.
>
> This version also targets the **New Backstage Backend System** (Backstage version **>= 1.48.3**). For legacy support, please stay on version **`4.x.x`**.

### Migration Guide

If you were heavily relying on custom resolvers or internal `ldapjs` types, follow these steps to migrate:

1. **Custom Resolver Changes**: The `ldapAuthentication` and `checkUserExists` resolvers have updated type signatures to accommodate `ldapts`. If you wrote custom resolvers in `4.x`, ensure your functions now accept the `ldapts` `ClientOptions` and return objects that comply with the new signatures.
2. **Standard Configurations**: For most users using the standard configurations via `app-config.yaml`, the update is drop-in.
3. **StartTLS Support**: We now fully support the usage of `starttls: true` natively using `ldapts`, which can be turned on in your config!

## Installation

> These packages are available on npm.

You can install them in your backstage installation using `yarn workspace`

```bash
# install yarn if you don't have it
$ npm install -g yarn
# install backend plugin
$ yarn workspace backend add @immobiliarelabs/backstage-plugin-ldap-auth-backend
# install frontend plugin
$ yarn workspace app add @immobiliarelabs/backstage-plugin-ldap-auth
```

## Configurations

> This documentation assumes that you have already scaffolded your Backstage instance from the official `@backstage/create-app`, all files that we're going to customize here are the one already created by the CLI!

### Setup

If you didn't have already, you need to configure Backstage's official LDAP plugin, that is needed to import and keep in syncs users your LDAP users.

```sh
# in your backstage repo
yarn add @backstage/plugin-catalog-backend-module-ldap
```

and follow this [guide](https://backstage.io/docs/integrations/ldap/org)

### Connection Configuration

> Adds connection configuration inside your backstage YAML config file, eg: `app-config.yaml`

We use [`ldapts`](https://github.com/ldapts/ldapts) for authentication, you can find all the configurations at this [link](https://github.com/ldapts/ldapts/blob/main/README.md).

> Add in you You backstage configuration file

```yml
auth:
    environment: { ENV_NAME } # eg: production|staging|review|develop
    providers:
        ldap:
            # eg: production|staging|review|develop
            { ENV_NAME }:
                cookies:
                    secure: false # https cookies or not
                    field: 'backstage-token' # default

                ldapAuthenticationOptions:
                    userSearchBase: 'ou=users,dc=ns,dc=farm' # REQUIRED
                    # what is the user unique key in your ldap instance
                    usernameAttribute: 'uid' # defaults to `uid`
                    # directory where to search user
                    # default search will be `[userSearchBase]=[username],[userSearchBase]`

                    # User able to list other users, this is used
                    # to check incoming JWT if user are already part of the LDAP
                    # NOTE: If no admin user/pass provided we'll attempt a credential-less search
                    adminDn: uid={ADMIN_USERNAME},ou=users,dc=ns,dc=farm
                    adminPassword: ''
                    
                    # Optional: Use StartTLS
                    # starttls: true

                    ldapOpts:
                        url: 'ldaps://123.123.123.123'
                        # Common ldapts options (mapping to ldapjs ones)
                        tlsOptions:
                            rejectUnauthorized: false
                        # timeout: 5000
                        # connectTimeout: 10000
                        # strictDN: true

> [!TIP]
> Since we use [`ldapts`](https://github.com/ldapts/ldapts), almost all `ClientOptions` from `ldapts` can be passed under `ldapOpts`.
```

### New Backend System

For the new Backstage backend system, simply add the module to your backend.

> `packages/backend/src/index.ts`

```ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

backend.add(import('@backstage/plugin-auth-backend'));
// ... other plugins
backend.add(import('@immobiliarelabs/backstage-plugin-ldap-auth-backend'));

backend.start();
```

### Old Backend System (Legacy)

If you are still using the old backend system, follow the instructions below. Note that we recommend migrating to the New Backend System as this plugin is optimized for it.

If you want to connect to Postgres for the store of the token (default is in memory):

```ts
// index.ts
import { tokenValidatorFactory } from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';

// This is required to work
backend.add(import('@backstage/plugin-auth-backend'));
...
backend.add(import('@immobiliarelabs/backstage-plugin-ldap-auth-backend'));
backend.add(tokenValidatorFactory({ createTokenValidator }));
...
backend.start();


// auth.ts
createTokenValidator(config: Config): TokenValidator {
    ...
    const url = `postgresql://${user}:${password}@${host}:${port}/mydb`;
    return new JWTTokenValidator(
      new Keyv(url, { table: 'token' })
    );
}

```

### Custom LDAP Configurations

If your LDAP server connection options requires more fine tune than we handle here you can inject your custom auth function, take a look at `ldap.create` types at `resolvers.ldapAuthentication`, you can copy the default function and change what you need!

This can be also done for the `resolvers.checkUserExists` function, which runs when controlling a JWT token.

#### Custom authentication function

```ts
import {
    coreServices,
    createBackendModule,
} from '@backstage/backend-plugin-api';
import { ldapAuthExtensionPoint } from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';

export default createBackendModule({
    pluginId: 'auth',
    moduleId: 'ldap-ext',
    register(reg) {
        reg.registerInit({
            deps: {
                config: coreServices.rootConfig,
                ldapAuth: ldapAuthExtensionPoint,
            },
            async init({ config, ldapAuth }) {
                ldapAuth.set({
                    resolvers: {
                        async ldapAuthentication(
                            username,
                            password,
                            options
                        ): Promise<LDAPUser> {
                            // perform your custom authentication logic here
                            // you can use the defaultLDAPAuthentication helper if you just want to wrap it
                            return { uid: username };
                        },
                    },
                });
            },
        });
    },
});
```

#### Custom check if user exists

```ts
export default createBackendModule({
    pluginId: 'auth',
    moduleId: 'ldap-ext',
    register(reg) {
        reg.registerInit({
            deps: {
                config: coreServices.rootConfig,
                ldapAuth: ldapAuthExtensionPoint,
            },
            async init({ config, ldapAuth }) {
                ldapAuth.set({
                    resolvers: {
                        async checkUserExists(
                            options
                        ): Promise<boolean> {
                            const { username } = options;

                            // Do you custom checks
                            // ....

                            return true;
                        },
                    },
                });
            },
        });
    },
});
```

### Add the login form

> More on this in the frontend plugin documentation [here](../ldap-auth/README.md)

We need to replace the existing Backstage demo authentication page with our custom one!

In the `App.tsx` file, change the `createApp` function adding a `components` with our custom `SignInPage`In the `App.tsx` file change the `createApp` function to provide use our custom `SignInPage` in the `components` key.

**Note:** This components isn't only UI, it also brings all the token state management and HTTP API calls to the backstage auth routes we already configured in the backend part.

> `packages/app/src/App.tsx`

```tsx
import { LdapAuthFrontendPage } from '@immobiliarelabs/backstage-plugin-ldap-auth';

const app = createApp({
    // ...
    components: {
        SignInPage: (props) => (
            <LdapAuthFrontendPage {...props} provider="ldap" />
        ),
    },
    // ...
});
```

And you're ready to go! If you need more use cases, like having multiple processes and need a shared token store instead of in-memory look at the [example folders](https://github.com/immobiliare/backstage-plugin-ldap-auth/examples/)

## Powered Apps

Backstage Plugin LDAP Auth was created by the amazing Node.js team at [ImmobiliareLabs](http://labs.immobiliare.it/), the Tech dept of [Immobiliare.it](https://www.immobiliare.it), the #1 real estate company in Italy.

We are currently using Backstage Plugin LDAP Auth in our products as well as our internal toolings.

**If you are using Backstage Plugin LDAP Auth in production [drop us a message](mailto:opensource@immobiliare.it)**.

## Support & Contribute

Made with ❤️ by [ImmobiliareLabs](https://github.com/immobiliare) & [Contributors](https://github.com/immobiliare/backstage-plugin-ldap-auth/CONTRIBUTING.md#contributors)

We'd love for you to contribute to Backstage Plugin LDAP Auth!
If you have any questions on how to use Backstage Plugin LDAP Auth, bugs and enhancement please feel free to reach out by opening a [GitHub Issue](https://github.com/immobiliare/backstage-plugin-ldap-auth).

## License

Backstage Plugin LDAP Auth is licensed under the MIT license.  
See the [LICENSE](https://github.com/immobiliare/backstage-plugin-ldap-auth/LICENSE) file for more information.
