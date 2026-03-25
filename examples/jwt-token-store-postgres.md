# Use a database to store JWT tokens for revalidation

Since tokens are not stored in any way by Backstage, you may want to do so to manually expire them (e.g., bans or deleted users).

This example uses `Keyv` with a PostgreSQL database to save tokens in a dedicated table.

In the **New Backend System**, you can provide a custom `tokenValidator` by using the `tokenValidatorFactoryWithOptions`.

## Configuration in `packages/backend/src/index.ts`

```ts
import { createBackend } from '@backstage/backend-defaults';
import { 
  tokenValidatorFactoryWithOptions,
  JWTTokenValidator 
} from '@immobiliarelabs/backstage-plugin-ldap-auth-backend';
import Keyv from 'keyv';

const backend = createBackend();

backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@immobiliarelabs/backstage-plugin-ldap-auth-backend'));

// Add the custom token validator factory
backend.add(
  tokenValidatorFactoryWithOptions({
    async createTokenValidator(config) {
      const host = config.getOptionalString('backend.database.connection.host');
      const port = config.getOptionalString('backend.database.connection.port');
      const user = config.getOptionalString('backend.database.connection.user');
      const password = config.getOptionalString('backend.database.connection.password');

      return new JWTTokenValidator(
          new Keyv(
              `postgresql://${user}:${password}@${host}:${port}/bs_jwt_tokens`,
              { table: 'token' }
          )
      );
    },
  })
);

backend.start();
```
