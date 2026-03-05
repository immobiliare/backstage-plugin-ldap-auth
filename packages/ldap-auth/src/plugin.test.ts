import { ldapAuthPlugin } from './plugin';

describe('ldap-auth-frontend', () => {
    it('should export plugin', () => {
        expect(ldapAuthPlugin).toBeDefined();
    });
});
