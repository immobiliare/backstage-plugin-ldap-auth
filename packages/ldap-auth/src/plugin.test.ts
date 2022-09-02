import { ldapAuthFrontendPlugin } from './plugin';

describe('ldap-auth-frontend', () => {
    it('should export plugin', () => {
        expect(ldapAuthFrontendPlugin).toBeDefined();
    });
});
