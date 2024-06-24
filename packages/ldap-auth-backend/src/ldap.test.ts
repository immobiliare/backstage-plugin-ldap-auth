import { defaultCheckUserExists, defaultLDAPAuthentication } from './ldap';
import { AUTH_USER_DATA_ERROR } from './errors';
import { AuthenticationOptions } from 'ldap-authentication';

describe('LDAP authentication', () => {
    it('LDAP authentication success', async () => {
        const UID = 'ieqwiewqee';
        const authFunc = jest.fn(() =>
            Promise.resolve({
                uid: UID,
            })
        );
        const out = await defaultLDAPAuthentication(
            'john-doe',
            'my-secure-password',
            { ldapOpts: { url: 'localhost' } },
            authFunc
        );

        expect(authFunc).toBeCalled();
        expect(out).toEqual({ uid: UID });
    });

    it('LDAP authentication throws', async () => {
        const authFunc = jest.fn(() =>
            Promise.resolve({
                uid: '',
            })
        );
        const out = defaultLDAPAuthentication(
            'john-doe',
            'my-secure-password',
            { ldapOpts: { url: 'localhost' } },
            authFunc
        );

        expect(authFunc).toBeCalled();
        expect(out).rejects.toEqual(new Error(AUTH_USER_DATA_ERROR));
    });
});

describe('LDAP check user exists', () => {
    it('defaultCheckUserExists should forward to searchFunction if admin is defined', async () => {
        const options: AuthenticationOptions = {
            ldapOpts: {
                url: 'test.com',
            },
            adminDn: 'admin',
            adminPassword: 'secretPassword',
        };
        const authFunc = jest.fn(() => Promise.resolve(true));
        await expect(
            defaultCheckUserExists(options, authFunc)
        ).resolves.toEqual(true);

        expect(authFunc).toBeCalledWith({ ...options, verifyUserExists: true });
    });
});
