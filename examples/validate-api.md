# Validate API with TokenValidator

In the **New Backend System**, the `TokenValidator` is available as a service that you can inject into any backend module. This allows you to protect your custom APIs or even wrap existing ones.

## Use the `TokenValidator` Service

You can request the `tokenValidatorRef` in your dependencies to validate tokens issued by this plugin.

### Create a Custom Auth Module

This example shows how to create a backend module that uses the `tokenValidator` to protect routes registered in that same module.

```ts
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { tokenValidatorRef } from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';

export const myCustomAuthModule = createBackendModule({
  pluginId: 'my-plugin', // The plugin you want to protect
  moduleId: 'token-validation',
  register(reg) {
    reg.registerInit({
      deps: {
        http: coreServices.httpRouter,
        tokenValidator: tokenValidatorRef,
      },
      async init({ http, tokenValidator }) {
        // Add a middleware to the plugin's router
        http.use(async (req, res, next) => {
          try {
            // Get token from Authorization header or cookie
            const token = req.headers.authorization?.split(' ')[1] 
                       || req.cookies?.['backstage-token'];
            
            if (!token) {
              res.status(401).send('Unauthorized: No token provided');
              return;
            }

            // Validate the token
            await tokenValidator.isValid(token);
            
            next();
          } catch (error) {
            res.status(401).send(`Unauthorized: ${error.message}`);
          }
        });
      },
    });
  },
});
```

## Protecting Existing APIs

Since the New Backend System isolates plugins, protecting other plugins (like `catalog` or `scaffolder`) globally with a custom middleware is typically handled by the `auth-backend` or by configuring the individual plugins if they support custom middleware.

However, because this plugin uses its own JWT store, you can always use the `tokenValidator` service in any module where you need to verify the user's session.

## Summary of Services

- `tokenValidatorRef`: Use this to inject the `TokenValidator` into your modules.
- `ldapAuthExtensionPoint`: Use this to customize the LDAP authentication logic (authHandler, resolvers, etc.).
