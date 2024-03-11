import {
    ldapAuthExtensionPoint,
    default as ldapAuthModule,
    tokenValidatorFactory,
} from './alpha';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';
import { COOKIE_FIELD_KEY, JWTTokenValidator } from './jwt';
import Keyv from 'keyv';
import { createBackendModule } from '@backstage/backend-plugin-api';

describe('ldapProvider new backend system', () => {
    it('extension point should work', async () => {
        let invalidateTokenMock;
        let ldapAuthenticationMock = jest.fn(() =>
            Promise.resolve({
                dn: 'test',
                uid: 'test',
                givenName: 'test',
                cn: 'test',
                uidNumber: 'test',
                gidNumber: '42423',
                homeDirectory: '/home',
                mail: 'test@gmail.com',
                sn: 'mock',
            })
        );

        let authHandlerMock = jest.fn(() =>
            Promise.resolve({
                email: 'test@gmail.com',
                displayName: 'test',
            })
        );

        let signIn = jest.fn(() =>
            Promise.resolve({
                token: 'random',
            })
        );

        const createTokenValidator = () => {
            const token = new JWTTokenValidator(new Keyv());

            invalidateTokenMock = jest.fn(() => Promise.resolve());
            token.invalidateToken = invalidateTokenMock;
            return token;
        };
        const { server } = await startTestBackend({
            features: [
                import('@backstage/plugin-auth-backend'),
                ldapAuthModule,
                createBackendModule({
                    pluginId: 'auth',
                    moduleId: 'ldap-ext',
                    register(reg) {
                        reg.registerInit({
                            deps: {
                                ldapAuth: ldapAuthExtensionPoint,
                            },
                            async init({ ldapAuth }) {
                                ldapAuth.set({
                                    tokenValidator: createTokenValidator(),
                                    resolvers: {
                                        ldapAuthentication:
                                            ldapAuthenticationMock,
                                    },
                                    authHandler: authHandlerMock as any,
                                    signIn: { resolver: signIn },
                                });
                            },
                        });
                    },
                }),
                mockServices.rootConfig.factory({
                    data: {
                        app: {
                            baseUrl: 'http://localhost:3000',
                        },
                        auth: {
                            providers: {
                                ldap: {
                                    test: {
                                        cookies: { secure: false },
                                        ldapAuthenticationOptions: {
                                            usernameAttribute: 'uid',
                                        },
                                    },
                                },
                            },
                        },
                    },
                }),
            ],
        });

        const agent = request.agent(server);
        await agent
            .post('/api/auth/ldap/refresh')
            .send({ username: 'hello', password: 'world' });

        expect(ldapAuthenticationMock).toHaveBeenCalled();
        expect(invalidateTokenMock).not.toHaveBeenCalled();

        expect(authHandlerMock).toHaveBeenCalled();
        expect(signIn).toHaveBeenCalled();
    });

    it('service should work', async () => {
        let isValidMock = jest.fn(() => Promise.resolve(true));
        const createTokenValidator = () => {
            const token = new JWTTokenValidator(new Keyv());
            token.isValid = isValidMock;
            return token;
        };
        const { server } = await startTestBackend({
            features: [
                import('@backstage/plugin-auth-backend'),
                ldapAuthModule,
                tokenValidatorFactory({ createTokenValidator }),
                mockServices.rootConfig.factory({
                    data: {
                        app: {
                            baseUrl: 'http://localhost:3000',
                        },
                        auth: {
                            providers: {
                                ldap: {
                                    test: {
                                        cookies: { secure: false },
                                        ldapAuthenticationOptions: {
                                            usernameAttribute: 'uid',
                                        },
                                    },
                                },
                            },
                        },
                    },
                }),
            ],
        });

        const agent = request.agent(server);
        await agent
            .post('/api/auth/ldap/refresh')
            .set('Cookie', [`${COOKIE_FIELD_KEY}=eyJqd3QiOiJ`])
            .send({});

        expect(isValidMock).toHaveBeenCalled();
    });
});
