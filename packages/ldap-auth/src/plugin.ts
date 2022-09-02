import { createPlugin } from '@backstage/core-plugin-api';

import { LdapSignInPage } from './components/LoginPage/LoginPage';

export const ldapAuthFrontendPlugin = createPlugin({
    id: 'ldap-auth-frontend',
});

export const LdapAuthFrontendPage = LdapSignInPage;
