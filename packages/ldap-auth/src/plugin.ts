import { createPlugin } from '@backstage/core-plugin-api';

import { LdapSignInPage } from './components/LoginPage/LoginPage';

export const ldapAuthFrontendPlugin = createPlugin({
    id: 'ldap-auth-frontend',
});

/** @deprecated Use ldapAuthFrontendPlugin instead */
export const ldapAuthPlugin = ldapAuthFrontendPlugin;

export const LdapAuthFrontendPage = LdapSignInPage;
