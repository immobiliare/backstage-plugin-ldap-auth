import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { LdapAuthFrontendPage, ldapAuthFrontendPlugin } from '../src';
import { IdentityApi } from '@backstage/core-plugin-api';

createDevApp()
    .registerPlugin(ldapAuthFrontendPlugin)
    .addPage({
        element: (
            <LdapAuthFrontendPage
                provider="ldap"
                options={{
                    helperTextUsername:
                        "Usually it's  the first letter of your name followed by the surname, e.g. Dario Rossi 👉 drossi",
                }}
                onSignInSuccess={function (_identityApi: IdentityApi): void {
                    console.log('LoggedIn');
                }}
            ></LdapAuthFrontendPage>
        ),
        title: 'Root Page',
        path: '/backstage-plugin-ldap',
    })
    .render();
