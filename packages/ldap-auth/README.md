<p align="center">
  <img src="https://avatars.githubusercontent.com/u/10090828?s=200&v=4" width="200px" alt="logo"/>
</p>
<h1 align="center">@immobiliarelabs/backstage-plugin-ldap-auth</h1>

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/backstage-plugin-ldap-auth-backend?style=flat-square)
![license](https://img.shields.io/github/license/immobiliare/backstage-plugin-ldap-auth?style=flat-square)

> Login page and client-side token management for BAckstage LDAP Authentication Plugin

This plugin is not meant to be used alone but in pair with:

-   The official [@backstage/plugin-catalog-backend-module-ldap](https://www.npmjs.com/package/@backstage/plugin-catalog-backend-module-ldap) which keeps in sync your LDAP users with Backstage user catalogs!
-   Its sibling backend package [@immobiliarelabs/backstage-plugin-ldap-auth-backend](https://www.npmjs.com/package/@immobiliarelabs/backstage-plugin-ldap-auth-backend)

All the current LTS versions are supported.

<p align="center"><img src="https://github.com/immobiliare/backstage-plugin-ldap-auth/blob/main/screen.jpg?raw=true?cdn=1" width="600px" alt="LDAP Auth login page screenshot" /></p>

## Table of Content

<!-- toc -->

- [Migration to v5.x & Breaking Changes](#migration-to-v5x--breaking-changes)
  * [Key Changes](#key-changes)
- [Installation](#installation)
- [Configuration](#configuration)
  * [New Frontend System](#new-frontend-system)
  * [Old Frontend System (Legacy)](#old-frontend-system-legacy)
- [Powered Apps](#powered-apps)
- [Support & Contribute](#support--contribute)
- [License](#license)

<!-- tocstop -->

## Migration to v5.x & Breaking Changes

> [!IMPORTANT]
> Starting with version `5.x`, this plugin has fully migrated to support the **New Backstage Backend and Frontend Systems** (Backstage version **>= 1.48.3**).
>
> This matches our internal usage at ImmobiliareLabs. If you are unable or unwilling to migrate yet, we recommend sticking to the **`4.x.x`** versions of this plugin.

### Key Changes
- **Backend**: Migrated from `ldapjs` to [`ldapts`](https://github.com/ldapts/ldapts). See the [Backend README](../ldap-auth-backend/README.md#migration-to-v5x-ldapjs-to-ldapts) for more details.
- **Frontend**: Primary usage is now via the New Frontend System using `createLdapAuthModule`.

## Installation

> These packages are available on npm.

You can install them in your backstage installation using `yarn workspace`

```bash
# install yarn if you don't have it
$ npm install -g yarn
# install frontend plugin
$ yarn workspace app add @immobiliarelabs/backstage-plugin-ldap-auth
# install backend plugin
$ yarn workspace backend add @immobiliarelabs/backstage-plugin-ldap-auth-backend
```

## Configuration

> The react components accepts childrens to allow you to customize the login page look and feel

The component out of the box only shows the form, but you can pass down children components to render your logos/top bar os whatever you want!

### New Frontend System

In the new frontend system, you can use the `createLdapAuthModule` helper from the `/alpha` path. It allows you to provide a custom logo and detailed styling to match your brand.

> `packages/app/src/App.tsx`

```tsx
import { createApp } from '@backstage/frontend-app-api';
import { createLdapAuthModule } from '@immobiliarelabs/backstage-plugin-ldap-auth/alpha';
import { Box, Typography } from '@material-ui/core';

// 1. Define your custom styles
export const loginStyles = {
  content: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'var(--login-bg-color)',
    backgroundImage:
      'linear-gradient(rgba(15, 23, 41, 0.8), rgba(15, 23, 41, 0.8)), url("{{ YOUR BACKGROUND IMAGE }}")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    width: '100%',
    maxWidth: 'none',
    position: 'relative' as const,
  },
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  paper: {
    padding: '3rem',
    maxWidth: 480,
    width: '100%',
    backgroundColor: 'var(--login-paper-bg)',
    color: '#ffffff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(50px)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginTop: '1.5rem',
    gap: '1.25rem',
  },
};

// 2. Create a custom logo component using MUI v4 patterns
export const LoginLogo = () => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    marginBottom={2}
    style={{ gap: '8px' }}
  >
    <LogoFull style={{ width: '250px', height: 'auto' }} />
    <Typography
      variant="subtitle1"
      style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: 500,
        letterSpacing: '0.05rem',
        textTransform: 'uppercase',
        fontSize: '0.875rem',
      }}
    >
      Your developer portal
    </Typography>
  </Box>
);

// 3. Add the module to your app
// The /alpha path is used because the new frontend system is still in alpha/beta in Backstage
const app = createApp({
  features: [
    // ...
    createLdapAuthModule({
      logo: <LoginLogo />,
      options: {
        styles: loginStyles,
      },
    }),
  ],
});

export default app.createRoot();
```

> [!NOTE]
> The example above uses **MUI v4** patterns (standard props for `Box` and `style` for other CSS properties). If you have migrated your Backstage instance to **MUI v5** (`@mui/material`), you can use the more modern [`sx` prop](https://mui.com/system/getting-started/the-sx-prop/) for styling components.

### Old Frontend System (Legacy)

If you are still using the old frontend system, you can use the `LdapAuthFrontendPage` component. However, the current version of this plugin is optimized for the new system. We recommend staying on version **`4.x.x`** for legacy applications.

If you must use the latest version with the old system, you can still configure it in your `App.tsx`:

You can customize the login page by passing down a `logo` component and an `options.styles` object.

> `packages/app/src/App.tsx`

```tsx
import { LdapAuthFrontendPage } from '@immobiliarelabs/backstage-plugin-ldap-auth';
// Import your custom logo component
import LogoFull from './components/topbar/LogoFull';

const app = createApp({
    // ...
    components: {
        SignInPage: (props) => (
            <LdapAuthFrontendPage 
                {...props} 
                provider="ldap" 
                logo={<LogoFull />}
                options={{
                    styles: {
                        container: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100vh',
                            background: '#1a1a2e',
                        },
                        paper: { borderRadius: 16, maxWidth: 400 },
                        form: { padding: '1rem' },
                    }
                }}
            />
        ),
    },
    // ...
});
```

Now follow instructions at [@immobiliarelabs/backstage-plugin-ldap-auth-backend](../ldap-auth-backend/README.md) to add backend authentication logic!

## Powered Apps

Backstage Plugin LDAP Auth was created by the amazing Node.js team at [ImmobiliareLabs](http://labs.immobiliare.it/), the Tech dept of [Immobiliare.it](https://www.immobiliare.it), the #1 real estate company in Italy.

We are currently using Backstage Plugin LDAP Auth in our products as well as our internal toolings.

**If you are using Backstage Plugin LDAP Auth in production [drop us a message](mailto:opensource@immobiliare.it)**.

## Support & Contribute

Made with ❤️ by [ImmobiliareLabs](https://github.com/immobiliare) & [Contributors](https://github.com/immobiliare/backstage-plugin-ldap-auth/CONTRIBUTING.md#contributors)

We'd love for you to contribute to Backstage Plugin LDAP Auth!
If you have any questions on how to use Backstage Plugin LDAP Auth, bugs and enhancement please feel free to reach out by opening a [GitHub Issue](https://github.com/immobiliare/backstage-plugin-ldap-auth).

## License

Backstage Plugin LDAP Auth is licensed under the MIT license.  
See the [LICENSE](https://github.com/immobiliare/backstage-plugin-ldap-auth/LICENSE) file for more information.
