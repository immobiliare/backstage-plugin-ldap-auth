<h1 align="center">Backstage Plugin LDAP Auth</h1>

![release workflow](https://img.shields.io/github/workflow/status/immobiliare/backstage-plugin-ldap-auth/Release?style=flat-square)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier?style=flat-square)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
![license](https://img.shields.io/github/license/immobiliare/backstage-plugin-ldap-auth?style=flat-square)

![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/backstage-plugin-ldap-auth?style=flat-square)
![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/backstage-plugin-ldap-auth-backend?style=flat-square)

> [Backstage](https://backstage.io/) plugin to authenticate users using an LDAP server

_This is meant to be used in pair with the official [@backstage/plugin-catalog-backend-module-ldap](https://www.npmjs.com/package/@backstage/plugin-catalog-backend-module-ldap) which imports and keeps in sync your LDAP users but won't authenticate them._

All the current LTS versions are supported..

## Usage

> Check the corrisponding README for both packages

-   [`packages/ldap-auth-backend`](./packages/ldap-auth-backend/README.md) - Back to back authentication and token validation and management
-   [`packages/ldap-auth`](./packages/ldap-auth/README.md)- Frontend Login Page and token usage and retention logics
