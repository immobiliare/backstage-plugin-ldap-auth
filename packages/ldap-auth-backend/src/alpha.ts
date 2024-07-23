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
import {
    LDAPResponse,
    ProviderCreateOptions,
    Resolvers,
    SignInResolver,
} from './types';
import { AuthHandler } from '@backstage/plugin-auth-backend';
import Keyv from 'keyv';

interface LdapAuthSetter {
    set(opt: ProviderCreateOptions): void;
}

class LdapAuthExt implements LdapAuthSetter {
    #authHandler: AuthHandler<Partial<LDAPResponse>> | undefined;
    #resolvers: Resolvers | undefined;
    #signInResolver: SignInResolver | undefined;
    #tokenValidatorExt: TokenValidator | undefined;
    set(opt: ProviderCreateOptions): void {
        this.#authHandler = opt.authHandler;
        this.#resolvers = opt.resolvers;
        this.#signInResolver = opt.signIn;
        this.#tokenValidatorExt = opt.tokenValidator;
    }

    get authHandler() {
        return this.#authHandler;
    }
    get resolvers() {
        return this.#resolvers;
    }
    get signInResolver() {
        return this.#signInResolver;
    }
    get tokenValidatorExt() {
        return this.#tokenValidatorExt;
    }
}
export const ldapAuthExtensionPoint = createExtensionPoint<LdapAuthSetter>({
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

export const tokenValidatorFactoryWithOptions = (
    options?: TokenValidatorOptions
) =>
    createServiceFactory({
        service: tokenValidatorRef,
        deps: { config: coreServices.rootConfig },
        factory({ config }) {
            return (
                options?.createTokenValidator(config) ||
                new JWTTokenValidator(new Keyv())
            );
        },
    });

export const tokenValidatorFactory = Object.assign(
    tokenValidatorFactoryWithOptions,
    tokenValidatorFactoryWithOptions()
);

export default createBackendModule({
    pluginId: 'auth',
    moduleId: 'ldap',
    register(reg) {
        const ldapAuthSetter = new LdapAuthExt();
        reg.registerExtensionPoint<LdapAuthSetter>(
            ldapAuthExtensionPoint,
            ldapAuthSetter
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
                        tokenValidator:
                            ldapAuthSetter.tokenValidatorExt || tokenValidator,
                        authHandler: ldapAuthSetter.authHandler,
                        resolvers: ldapAuthSetter.resolvers,
                        signIn: ldapAuthSetter.signInResolver,
                    }),
                });
            },
        });
    },
});
