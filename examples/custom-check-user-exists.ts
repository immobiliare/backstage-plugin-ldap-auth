import {
  coreServices,
  createBackendModule,
} from "@backstage/backend-plugin-api";
import { ldapAuthExtensionPoint } from "@immobiliarelabs/backstage-plugin-ldap-auth-backend";

export default createBackendModule({
  pluginId: "auth",
  moduleId: "ldap-custom-check-user",
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        ldapAuth: ldapAuthExtensionPoint,
      },
      async init({ ldapAuth }) {
        ldapAuth.set({
          resolvers: {
            async checkUserExists(options) {
              const { username } = options;

              // Do your custom checks here
              // ...

              return true;
            },
          },
        });
      },
    });
  },
});
