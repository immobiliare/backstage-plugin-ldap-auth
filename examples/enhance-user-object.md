# Enhance User Object

This example shows how to use the `authHandler` to enhance the user profile object. In this case, we add a Gravatar picture based on the user's email from the catalog.

```ts
import {
  coreServices,
  createBackendModule,
} from "@backstage/backend-plugin-api";
import { ldapAuthExtensionPoint } from "@immobiliarelabs/backstage-plugin-ldap-auth-backend";
import type { ProfileInfo } from "@backstage/plugin-auth-node";
import crypto from "crypto";

export default createBackendModule({
  pluginId: "auth",
  moduleId: "ldap-enhance-profile",
  register(reg) {
    reg.registerInit({
      deps: {
        ldapAuth: ldapAuthExtensionPoint,
      },
      async init({ ldapAuth }) {
        ldapAuth.set({
          async authHandler({ uid }, ctx) {
            const backstageUserData = await ctx.findCatalogUser({
              entityRef: uid as string,
            });

            const profile = backstageUserData?.entity?.spec?.profile as ProfileInfo;

            if (profile?.email) {
              const hash = crypto.createHash("md5").update(profile.email).digest("hex");
              profile.picture = `https://www.gravatar.com/avatar/${hash}`;
            }

            return {
              profile,
            };
          },
        });
      },
    });
  },
});
```
