# @immobiliarelabs/backstage-plugin-ldap-auth

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier?style=flat-square)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
![license](https://img.shields.io/github/license/immobiliare/backstage-plugin-ldap-auth?style=flat-square)
![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/backstage-plugin-ldap-auth?style=flat-square)

> Customizable Authentication backend provider for LDAP servers for your [Backstage](https://backstage.io/) deployment

Works either on simple stand-alone process or scaled infrastracture spanning multiple deployments using the shared PostgreSQL instance that Backstage already uses!

This plugin is not meant to be used alone but in pair with:

-   The official [@backstage/plugin-catalog-backend-module-ldap](https://www.npmjs.com/package/@backstage/plugin-catalog-backend-module-ldap) which keeps in sync your LDAP users with Backstage user catalogs!
-   Its sibling backend package [@immobiliarelabs/backstage-plugin-ldap-auth-backend](https://www.npmjs.com/package/@immobiliarelabs/backstage-plugin-ldap-auth-backend)

All the current LTS versions are supported.

## Table of Content

<!-- toc -->

-   [Installation](#installation)
-   [Configuration](#configuration)
-   [Powered Apps](#powered-apps)
-   [Support & Contribute](#support--contribute)
-   [License](#license)

<!-- tocstop -->

## Installation

> These packages are available on npm.

You can install them in your backstage installation using `yarn workspace`

```bash
# install yarn if you don't have it
$ npm install -g yarn
# install frontend plugin
$ yarn workspace app add @immobiliarelabs/backstage-plugin-ldap-auth
# install backend plugin
$ yarn workspace backend add @immobiliarelabs/backstage-plugin-ldap-auth-backend
```

## Configuration

> The react components accepts childrens to allow you to customize the login page look and feel

The component out of the box only shows the form, but you can pass down children components to render your logos/top bar os whatever you want!

<img src="./screen.png" width="600px" />

<br />

In the `App.tsx` file, change the `createApp` function adding a `components` with our custom `SignInPage`

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

Now follow instructions at [@immobiliarelabs/backstage-plugin-ldap-auth-backend](../ldap-auth-backend/README.md) to add backend authentication logic!

## Powered Apps

backstage-plugin-ldap-auth was created by the amazing Node.js team at [ImmobiliareLabs](http://labs.immobiliare.it/), the Tech dept of [Immobiliare.it](https://www.immobiliare.it), the #1 real estate company in Italy.

We are currently using backstage-plugin-ldap-auth in our products as well as our internal toolings.

**If you are using backstage-plugin-ldap-auth in production [drop us a message](mailto:opensource@immobiliare.it)**.

## Support & Contribute

Made with ❤️ by [ImmobiliareLabs](https://github.com/immobiliare) & [Contributors](https://github.com/immobiliare/backstage-plugin-ldap-auth/CONTRIBUTING.md#contributors)

We'd love for you to contribute to backstage-plugin-ldap-auth!
If you have any questions on how to use backstage-plugin-ldap-auth, bugs and enhancement please feel free to reach out by opening a [GitHub Issue](https://github.com/immobiliare/backstage-plugin-ldap-auth).

## License

backstage-plugin-ldap-auth is licensed under the MIT license.  
See the [LICENSE](https://github.com/immobiliare/backstage-plugin-ldap-auth/LICENSE) file for more information.
