import { ldapAuthPlugin } from './plugin';

describe('ldap-auth-backend', () => {
    it('should export plugin', () => {
        expect(ldapAuthPlugin).toBeDefined();
    });
});
