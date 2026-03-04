import { Client } from 'ldapts';
import type { ClientOptions } from 'ldapts';
import { dn } from 'ldap-escape';
import type { LDAPUser, LdapAuthenticationOptions } from './types';
import { AUTH_USER_DATA_ERROR, AUTH_USER_NOT_FOUND, LDAP_CONNECT_FAIL } from './errors';

async function createClient(
    ldapOpts: ClientOptions,
    starttls: boolean | undefined,
    bindDn: string,
    bindPassword: string
): Promise<Client> {
    const client = new Client({
        ...ldapOpts,
        connectTimeout: ldapOpts.connectTimeout || 5000,
    });

    if (starttls) await client.startTLS(ldapOpts.tlsOptions);
    await client.bind(bindDn, bindPassword);

    return client;
}

export const defaultCheckUserExists = async (
    options: LdapAuthenticationOptions
): Promise<boolean> => {
    const {
        ldapOpts,
        adminDn,
        adminPassword,
        username,
        userSearchBase,
        usernameAttribute = 'uid',
        starttls,
    } = options;

    const bindDn = adminDn || '';
    const bindPassword = adminPassword || '';

    try {
        const client = await createClient(ldapOpts, starttls, bindDn, bindPassword);
        try {
            const { searchEntries } = await client.search(userSearchBase || '', {
                filter: `(${usernameAttribute}=${username})`,
                scope: 'sub',
            });
            return searchEntries.length > 0;
        } finally {
            if (client.isConnected) await client.unbind();
        }
    } catch (e) {
        throw new Error(`${LDAP_CONNECT_FAIL} ${e instanceof Error ? e.message : String(e)}`);
    }
};

export async function defaultLDAPAuthentication(
    username: string,
    password: string,
    options: LdapAuthenticationOptions
): Promise<LDAPUser> {
    const {
        ldapOpts,
        adminDn,
        adminPassword,
        userSearchBase,
        usernameAttribute = 'uid',
        starttls,
    } = options;

    let userDn = '';
    let foundUser: Record<string, any> | null = null;

    try {
        if (adminDn && adminPassword) {
            let adminClient: Client | null = null;
            try {
                adminClient = await createClient(ldapOpts, starttls, adminDn, adminPassword);
                const { searchEntries } = await adminClient.search(userSearchBase || '', {
                    filter: `(${usernameAttribute}=${username})`,
                    scope: 'sub',
                });
                if (searchEntries.length === 0) {
                    throw new Error(AUTH_USER_NOT_FOUND);
                }
                foundUser = searchEntries[0];
                userDn = foundUser.dn;
            } finally {
                if (adminClient && adminClient.isConnected) await adminClient.unbind();
            }
        } else {
            userDn = dn`${usernameAttribute}=${username},` + (userSearchBase || '');
        }

        let userClient: Client | null = null;
        try {
            userClient = await createClient(ldapOpts, starttls, userDn, password);

            if (!foundUser && userSearchBase) {
                const { searchEntries } = await userClient.search(userSearchBase, {
                    filter: `(${usernameAttribute}=${username})`,
                    scope: 'sub',
                });
                if (searchEntries.length > 0) {
                    foundUser = searchEntries[0];
                }
            }
        } finally {
            if (userClient && userClient.isConnected) await userClient.unbind();
        }

        if (!foundUser) {
            throw new Error(AUTH_USER_NOT_FOUND);
        }

        const uidVal = foundUser[usernameAttribute];
        if (!uidVal) {
            throw new Error(AUTH_USER_DATA_ERROR);
        }

        return { uid: uidVal as string };
    } catch (e) {
        console.error('There was an error when trying to login with ldapts');
        if (e && typeof e === 'object' && 'name' in e && (e.name === 'InvalidCredentialsError' || e.name === 'NoSuchObjectError')) {
            throw new Error(AUTH_USER_NOT_FOUND);
        }
        if (
            e instanceof Error &&
            (e.message.includes(AUTH_USER_NOT_FOUND) || e.message.includes(AUTH_USER_DATA_ERROR))
        ) {
            throw e;
        }
        throw new Error(`${LDAP_CONNECT_FAIL} ${e instanceof Error ? e.message : String(e)}`);
    }
}
