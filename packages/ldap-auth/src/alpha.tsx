import {
    createFrontendModule,
} from '@backstage/frontend-plugin-api';
import {
    SignInPageBlueprint,
    type SignInPageProps,
} from '@backstage/plugin-app-react';
import React, { type ReactNode } from 'react';
import { LdapAuthFrontendPage } from './plugin';
import type { LdapSignInPageProps } from './components/LoginPage/LoginPage';

type LdapAuthModuleOptions = {
    logo?: ReactNode;
    options?: LdapSignInPageProps['options'];
};

export function createLdapAuthModule(moduleOptions?: LdapAuthModuleOptions) {
    const ldapSignInPage = SignInPageBlueprint.makeWithOverrides({
        factory(originalFactory) {
            return originalFactory({
                loader: async () => (props: SignInPageProps) => (
                    <LdapAuthFrontendPage
                        {...props}
                        provider="ldap"
                        logo={moduleOptions?.logo}
                        options={moduleOptions?.options}
                    />
                ),
            });
        },
    });
    return createFrontendModule({
        pluginId: 'app',
        extensions: [ldapSignInPage],
    });
}
// Default export for feature discovery (no logo)
export default createLdapAuthModule();

