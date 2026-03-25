import {
  coreServices,
  createBackendModule,
} from "@backstage/backend-plugin-api";
import { ldapAuthExtensionPoint } from "@immobiliarelabs/backstage-plugin-ldap-auth-backend";

export default createBackendModule({
  pluginId: "auth",
  moduleId: "ldap-custom-auth",
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        ldapAuth: ldapAuthExtensionPoint,
      },
      async init({ ldapAuth }) {
        ldapAuth.set({
          resolvers: {
            async ldapAuthentication(username, password, ldapOptions) {
              // Perform your custom authentication logic here.
              // You can use the defaultLDAPAuthentication helper if you just want to wrap it.
              // Note: ldapOptions now uses ldapts ClientOptions.
              return { uid: username };
            },
          },
        });
      },
    });
  },
});
