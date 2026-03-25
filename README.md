<p align="center">
  <img src="https://avatars.githubusercontent.com/u/10090828?s=200&v=4" width="200px" alt="logo"/>
</p>
<h1 align="center">Backstage Plugin LDAP Auth</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Backstage-%3E%3D%201.48.3-%239c27b0?style=flat-square&logo=backstage" alt="Backstage Version Support" />
  <img src="https://img.shields.io/npm/v/@immobiliarelabs/backstage-plugin-ldap-auth-backend?style=flat-square" alt="npm (scoped)" />
  <img src="https://img.shields.io/github/license/immobiliare/backstage-plugin-ldap-auth?style=flat-square" alt="license" />
</p>

This monorepo containing two Backstage plugins to add LDAP authentication to your Backstage instance. It provides a sign-in page, token management, and server-side auth logic for your LDAP server.

> [!IMPORTANT]
> **Breaking Change**: Starting with version `5.x`, this plugin has fully migrated to support the **New Backstage Backend and Frontend Systems** (Backstage version **>= 1.48.3**).
> 
> We have also migrated from `ldapjs` (which is deprecated and unmaintained) to [`ldapts`](https://github.com/ldapts/ldapts). While most options remain the same, please refer to the new project for connection options and troubleshooting.
>
> **Legacy Support**: If you are still using the old Backstage systems and cannot migrate yet, please continue using version **`4.x.x`** of these plugins.

<p align="center"><img src="https://github.com/immobiliare/backstage-plugin-ldap-auth/blob/main/screen.jpg?raw=true?cdn=1" width="600px" alt="LDAP Auth login page screenshot" /></p>

## Quick Start


1. **Install** the packages in your Backstage repository:
   ```bash
   yarn workspace app add @immobiliarelabs/backstage-plugin-ldap-auth
   yarn workspace backend add @immobiliarelabs/backstage-plugin-ldap-auth-backend
   ```
2. **Configure Backend**: Add the LDAP module to your backend in `packages/backend/src/index.ts`.
3. **Configure Frontend**: Add `createLdapAuthModule` to your app features in `packages/app/src/App.tsx`.

> [!TIP]
> This project is meant to be used in pair with the official [@backstage/plugin-catalog-backend-module-ldap](https://www.npmjs.com/package/@backstage/plugin-catalog-backend-module-ldap) to keep your LDAP users in sync.

## Plugins

> Check the corrisponding README for both packages

-   [`packages/ldap-auth-backend`](./packages/ldap-auth-backend/README.md) - Back to back authentication and token validation and management
-   [`packages/ldap-auth`](./packages/ldap-auth/README.md)- Frontend Login Page and token usage and retention logics

## Powered Apps

Backstage Plugin LDAP Auth was created by the Node.js team at [ImmobiliareLabs](http://labs.immobiliare.it/), the Tech dept of [Immobiliare.it](https://www.immobiliare.it), the #1 real estate company in Italy.

We are currently using Backstage Plugin LDAP Auth in our products as well as our internal toolings.

**If you are using Backstage Plugin LDAP Auth in production [drop us a message](mailto:opensource@immobiliare.it)**.

## Support & Contribute

Made with ❤️ by [ImmobiliareLabs](https://github.com/immobiliare) & [Contributors](https://github.com/immobiliare/backstage-plugin-ldap-auth/CONTRIBUTING.md#contributors)

We'd love for you to contribute to Backstage Plugin LDAP Auth!
If you have any questions on how to use Backstage Plugin LDAP Auth, bugs and enhancement please feel free to reach out by opening a [GitHub Issue](https://github.com/immobiliare/backstage-plugin-ldap-auth).

## License

Backstage Plugin LDAP Auth is licensed under the MIT license.  
See the [LICENSE](https://github.com/immobiliare/backstage-plugin-ldap-auth/LICENSE) file for more information.
