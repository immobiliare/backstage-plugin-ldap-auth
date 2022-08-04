# Backstage Plugin LDAP Auth

## ⚠️ This is still Work in Progress

This packages is still work in progress

## About

This is a plugin for [Backstage](https://backstage.io/) that enables authenticating users with an LDAP Servers, this is meant to be used in pair with the office [@backstage/plugin-catalog-backend-module-ldap](https://www.npmjs.com/package/@backstage/plugin-catalog-backend-module-ldap) which only imports LDAP users infos.

## Packages

- `packages/ldap-auth` - Frontend Login Page and token usage and retention logics
- `packages/ldap-auth-backend` - Back to back authentication and token validation and management
