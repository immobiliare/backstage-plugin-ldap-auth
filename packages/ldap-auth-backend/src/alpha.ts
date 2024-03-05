import {
    RootConfigService,
    coreServices,
    createBackendModule,
    createExtensionPoint,
    createServiceFactory,
    createServiceRef,
} from '@backstage/backend-plugin-api';
import { authProvidersExtensionPoint } from '@backstage/plugin-auth-node';
import { JWTTokenValidator, TokenValidator } from './jwt';
import { ldap } from './provider';
import { LDAPResponse } from './types';
import { AuthHandler } from '@backstage/plugin-auth-backend';
import Keyv from 'keyv';

interface AuthHandlerSetter {
    set(handler: AuthHandler<Partial<LDAPResponse>>): void;
}
export const ldapAuthExtensionPoint = createExtensionPoint<AuthHandlerSetter>({
    id: 'ldap-auth-extension',
});

export const tokenValidatorRef = createServiceRef<TokenValidator>({
    scope: 'plugin',
    id: 'token-validator',
    defaultFactory: async (service) =>
        createServiceFactory({
            service,
            deps: { config: coreServices.rootConfig },
            factory({}) {
                return new JWTTokenValidator(new Keyv());
            },
        }),
});

type TokenValidatorOptions = {
    createTokenValidator(
        config: RootConfigService
    ): TokenValidator | Promise<TokenValidator>;
};

export const tokenValidatorFactory = createServiceFactory(
    (options?: TokenValidatorOptions) => ({
        service: tokenValidatorRef,
        deps: { config: coreServices.rootConfig },
        factory({ config }) {
            return (
                options?.createTokenValidator(config) ||
                new JWTTokenValidator(new Keyv())
            );
        },
    })
);

export default createBackendModule({
    pluginId: 'auth',
    moduleId: 'ldap',
    register(reg) {
        let authHandler: AuthHandler<Partial<LDAPResponse>> | undefined;
        const authHandlerSetter = {
            set(handler: AuthHandler<Partial<LDAPResponse>>) {
                authHandler = handler;
            },
        };
        reg.registerExtensionPoint<AuthHandlerSetter>(
            ldapAuthExtensionPoint,
            authHandlerSetter
        );

        reg.registerInit({
            deps: {
                providers: authProvidersExtensionPoint,
                tokenValidator: tokenValidatorRef,
            },
            async init({ providers, tokenValidator }) {
                providers.registerProvider({
                    providerId: 'ldap',
                    factory: ldap.create({
                        tokenValidator,
                        authHandler,
                    }),
                });
            },
        });
    },
});
