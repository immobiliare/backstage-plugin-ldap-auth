import { SignInPageProps } from '@backstage/core-plugin-api';
import React from 'react';
/**
 * Props for {@link LdapSignInPage}.
 *
 * @public
 */
export declare type LdapSignInPageProps = SignInPageProps & {
    provider: string;
    children?: React.ReactElement;
};
/**
 * A sign-in page that has no user interface of its own. Instead, it relies on
 * sign-in being performed by a reverse authenticating proxy that Backstage is
 * deployed behind, and leverages its session handling.
 *
 * @remarks
 *
 * This sign-in page is useful when you are using products such as Google
 * Identity-Aware Proxy or AWS Application Load Balancer or similar, to front
 * your Backstage installation. This sign-in page implementation will silently
 * and regularly punch through the proxy to the auth backend to refresh your
 * frontend session information, without requiring user interaction.
 *
 * @public
 */
export declare const LdapSignInPage: (props: LdapSignInPageProps) => JSX.Element | null;
