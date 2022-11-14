import type { LDAPUser } from './types';

import ldap from 'ldapjs';
import { dn } from 'ldap-escape';
import { authenticate, AuthenticationOptions } from 'ldap-authentication';

import { AUTH_USER_NOT_FOUND, LDAP_CONNECT_FAIL } from './errors';

async function _verifyUserExistsNoAdmin(
    searchString: string,
    ldapOpts: ldap.ClientOptions,
    searchOpts = {}
): Promise<boolean> {
    const client: ldap.Client = await new Promise((resolve, reject) => {
        ldapOpts.connectTimeout = ldapOpts.connectTimeout || 5000;
        const client = ldap.createClient(ldapOpts);

        client.on('connect', () => resolve(client));
        client.on('timeout', reject);
        client.on('connectTimeout', reject);
        client.on('error', reject);
        client.on('connectError', reject);
    });
    if (client instanceof Error)
        throw new Error(`${LDAP_CONNECT_FAIL} ${client.message}`);
    return new Promise((resolve, reject) => {
        client.search(searchString, searchOpts, (error, res) => {
            if (error) reject(error);
            let exists = false; // avoids double resolve call if user exists
            res.on('searchEntry', () => (exists = true));
            res.on('error', () => client.unbind());
            res.on('end', () => {
                resolve(exists);
                client.unbind();
            });
        });
    });
}

export const defaultCheckUserExists = async (
    ldapAuthOptions: AuthenticationOptions,
    searchFunction = authenticate
) => {
    // This fallback is for clients with no need for an admin to list users
    // I'll remove this if we can add this option to the auth library.
    if (!ldapAuthOptions.adminDn || !ldapAuthOptions.adminPassword) {
        const { username, usernameAttribute, userSearchBase } = ldapAuthOptions;
        return _verifyUserExistsNoAdmin(
            dn`${usernameAttribute as string}=${username as string},` +
                userSearchBase,
            ldapAuthOptions.ldapOpts
        );
    }

    return searchFunction({
        ...ldapAuthOptions,
        // this is used to serach for the user
        verifyUserExists: true,
    });
};

export async function defaultLDAPAuthentication(
    username: string,
    password: string,
    ldapAuthOptions: AuthenticationOptions,
    authFunction: typeof authenticate = authenticate
): Promise<LDAPUser> {
    const { usernameAttribute, userSearchBase } = ldapAuthOptions;
    const user = await authFunction({
        ...ldapAuthOptions,
        userPassword: password,
        userDn:
            dn`${usernameAttribute as string}=${username as string},` +
            userSearchBase,
    });
    if (!user[usernameAttribute as string]) {
        throw new Error(AUTH_USER_NOT_FOUND);
    }
    return { uid: user[usernameAttribute as string] };
}
