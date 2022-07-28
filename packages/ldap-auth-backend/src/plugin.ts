import { createPlugin } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const ldapAuthPlugin = createPlugin({
  id: 'ldap-auth-backend',
  routes: {
    root: rootRouteRef,
  },
});

// export const LoginCard = ldapAuthPlugin.provide(
//   createComponentExtension({
//     name: 'LoginCard',
//     component: {
//       lazy: () => import('./components/loginPage').then(m => m.default),
//     },
//   }),
// );
