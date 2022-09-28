<p align="center">
  <img src="https://avatars.githubusercontent.com/u/10090828?s=200&v=4" width="200px" alt="logo"/>
</p>
<h1 align="center">Backstage Plugin LDAP Auth</h1>

![release workflow](https://img.shields.io/github/workflow/status/immobiliare/backstage-plugin-ldap-auth/Release?style=flat-square)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier?style=flat-square)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
![license](https://img.shields.io/github/license/immobiliare/backstage-plugin-ldap-auth?style=flat-square)
![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/backstage-plugin-ldap-auth?style=flat-square)

> [Backstage](https://backstage.io/) plugins to authenticate users to an LDAP server

This is a monorepo containing two Backstage plugins, one for the frontend and one for the backend, both used to provide login screen, token management and serer-side auth logic to your LDAP server.

This project is also meant to be used in pair with the official [@backstage/plugin-catalog-backend-module-ldap](https://www.npmjs.com/package/@backstage/plugin-catalog-backend-module-ldap) which imports and keeps in sync your LDAP users but won't authenticate them.

## Plugins

> Check the corrisponding README for both packages

-   [`packages/ldap-auth-backend`](./packages/ldap-auth-backend/README.md) - Back to back authentication and token validation and management
-   [`packages/ldap-auth`](./packages/ldap-auth/README.md)- Frontend Login Page and token usage and retention logics

<p align="center">
  <img src="https://github.com/immobiliare/backstage-plugin-ldap-auth/blob/main/screen.png?raw=true" width="600px" />
</p>

## Backstage compatibility

| backstage |
| --------- |
| 1.6.x     |

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
