<h1 align="center">Backstage Plugin LDAP Auth</h1>

![release workflow](https://img.shields.io/github/workflow/status/immobiliare/backstage-plugin-ldap-auth/Release)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier?style=flat-square)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/backstage-plugin-ldap-auth?style=flat-square)
![license](https://img.shields.io/github/license/immobiliare/backstage-plugin-ldap-auth)

[Backstage](https://backstage.io/) plugin that enables authenticating users to an LDAP server, this is meant to be used in pair with the official [@backstage/plugin-catalog-backend-module-ldap](https://www.npmjs.com/package/@backstage/plugin-catalog-backend-module-ldap) which only imports LDAP users infos.

Supports Node.js `>=14.0.0`.

## Usage

> Check the corrisponding README for both packages

- [`packages/ldap-auth`](./packages/ldap-auth/README.md)- Frontend Login Page and token usage and retention logics
- [`packages/ldap-auth-backend`](./packages/ldap-auth-backend/README.md) - Back to back authentication and token validation and management

## Powered Apps

Those packages were created by the amazing Node.js team at ImmobiliareLabs, the Tech dept of [Immobiliare.it](https://www.immobiliare.it), the #1 real estate company in Italy. We are currently using these in our internal toolings!

**If you are using in production [drop us a message](mailto:opensource@immobiliare.it)**.

## Support & Contribute

Made with ❤️ by [ImmobiliareLabs](https://github.com/immobiliare) & [Contributors](./CONTRIBUTING.md#contributors)

We'd love for you to contribute!
If you have any questions on how to use, bugs and enhancement please feel free to reach out by opening a [GitHub Issue](https://github.com/immobiliare/backstage-plugin-ldap-auth/issues).

## License

These packages are licensed under the MIT license.  
See the [LICENSE](./LICENSE) file for more information.
