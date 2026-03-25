/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Progress } from "@backstage/core-components";
import {
  discoveryApiRef,
  type SignInPageProps,
  useApi,
} from "@backstage/core-plugin-api";
import { useAsync } from "@react-hookz/web";
import React, { useEffect, useState } from "react";
import { LoginForm, type LoginFormStyles } from "./Form";
import { LdapSignInIdentity } from "./Identity";

/**
 * Props for {@link LdapSignInPage}.
 *
 * @public
 */
export type LdapSignInPageProps = SignInPageProps & {
  provider: string;
  logo?: React.ReactNode;
  children?: React.ReactNode | null;
  onSignInError?: (error: Error) => void;
  options?: {
    helperTextPassword?: string;
    helperTextUsername?: string;
    validateUsername?: (usr: string) => boolean;
    validatePassword?: (pass: string) => boolean;
    usernameLabel?: string;
    /** Optional inline style overrides for the login form layout. */
    styles?: LoginFormStyles;
  };
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
export const LdapSignInPage = (props: LdapSignInPageProps) => {
  const discoveryApi = useApi(discoveryApiRef);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [identity] = useState(
    new LdapSignInIdentity({
      provider: props.provider,
      discoveryApi,
    }),
  );

  const [{ status, error }, { execute }] = useAsync(async () => {
    await identity.login({ username, password });

    props.onSignInSuccess(identity);
  });

  const [{ status: statusRefresh }, { execute: executeRefresh }] = useAsync(
    async () => {
      await identity.fetch();

      props.onSignInSuccess(identity);
    },
  );

  useEffect(() => {
    executeRefresh();
  }, []);

  function onSubmit(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setTimeout(execute, 0);
  }

  if (
    status === "loading" ||
    statusRefresh === "loading" ||
    statusRefresh === "not-executed"
  ) {
    return <Progress />;
  }
  if (status === "success" || statusRefresh === "success") {
    return null;
  }

  function onSignInError(error: Error) {
    props?.onSignInError?.(error);
  }

  return (
    <>
      {props.children}
      <LoginForm
        onSubmit={onSubmit}
        onSignInError={onSignInError}
        error={error}
        logo={props.logo}
        {...props.options}
      />
    </>
  );
};
