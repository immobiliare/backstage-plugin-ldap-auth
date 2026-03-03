import type { IdentityApi } from '@backstage/core-plugin-api';
import { createDevApp } from '@backstage/dev-utils';
import React from 'react';
import { LdapAuthFrontendPage, ldapAuthFrontendPlugin } from '../src';

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
                onSignInSuccess={(_identityApi: IdentityApi): void => {
                    console.log('LoggedIn');
                }}
            />
        ),
        title: 'Root Page',
        path: '/backstage-plugin-ldap',
    })
    .render();
