import { createBackendModule } from "@backstage/backend-plugin-api";
import { mockServices, startTestBackend } from "@backstage/backend-test-utils";
import jwt from "jsonwebtoken";
import request from "supertest";
import { ldapAuthExtensionPoint, default as ldapAuthModule } from "./alpha";
import { JWT_EXPIRED_TOKEN } from "./errors";
import { COOKIE_FIELD_KEY } from "./jwt";

jest.setTimeout(30000);

describe("LdapAuthProvider login tests", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("Test refresh for login with username and password", async () => {
    const sub = "my-uid-name";
    const token = jwt.sign({ sub }, "secret", {
      expiresIn: "1min",
    });

    const authHandler = jest.fn(async () => ({
      profile: {
        email: "test@gmail.com",
        displayName: "test",
      },
    })) as any;
    const ldapAuthentication = jest.fn(
      async (_username: string, _password: string, _options: any) =>
        Promise.resolve({ uid: sub }),
    ) as any;
    const signIn = jest.fn(() => Promise.resolve({ token }));
    const checkUserExists = jest.fn(() => Promise.resolve(true)) as any;

    const backend = await startTestBackend({
      features: [
        import("@backstage/plugin-auth-backend"),
        ldapAuthModule,
        createBackendModule({
          pluginId: "auth",
          moduleId: "ldap-ext-login",
          register(reg) {
            reg.registerInit({
              deps: {
                ldapAuth: ldapAuthExtensionPoint,
              },
              async init({ ldapAuth }) {
                ldapAuth.set({
                  resolvers: {
                    ldapAuthentication,
                    checkUserExists,
                  },
                  authHandler,
                  signIn: { resolver: signIn },
                });
              },
            });
          },
        }),
        mockServices.rootConfig.factory({
          data: {
            app: {
              baseUrl: "http://localhost:3000",
            },
            auth: {
              providers: {
                ldap: {
                  test: {
                    cookies: { secure: false },
                    ldapAuthenticationOptions: {
                      usernameAttribute: "uid",
                    },
                  },
                },
              },
            },
          },
        }),
      ],
    });

    const agent = request.agent(backend.server);
    const response = await agent
      .post("/api/auth/ldap/refresh")
      .send({ username: sub, password: "hello-world" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      backstageIdentity: {
        identity: {
          ownershipEntityRefs: [],
          type: "user",
          userEntityRef: sub,
        },
        token,
      },
      profile: {
        email: "test@gmail.com",
        displayName: "test",
      },
      providerInfo: {},
    });
    expect(authHandler).toHaveBeenCalledTimes(1);
    expect(ldapAuthentication).toHaveBeenCalledTimes(1);
    expect(checkUserExists).not.toHaveBeenCalled();
    expect(response.header["set-cookie"]).toBeDefined();
    await backend.stop();
  });

  it("Test refresh with token", async () => {
    const sub = "my-uid-name";
    const token = jwt.sign({ sub }, "secret", {
      expiresIn: "1min",
    });

    const authHandler = jest.fn(async () => ({
      profile: {
        email: "test@gmail.com",
        displayName: "test",
      },
    })) as any;
    const signIn = jest.fn(() => Promise.resolve({ token }));
    const checkUserExists = jest.fn(() => Promise.resolve(true)) as any;

    const backend = await startTestBackend({
      features: [
        import("@backstage/plugin-auth-backend"),
        ldapAuthModule,
        createBackendModule({
          pluginId: "auth",
          moduleId: "ldap-ext-token",
          register(reg) {
            reg.registerInit({
              deps: {
                ldapAuth: ldapAuthExtensionPoint,
              },
              async init({ ldapAuth }) {
                ldapAuth.set({
                  resolvers: {
                    checkUserExists,
                  },
                  authHandler,
                  signIn: { resolver: signIn },
                });
              },
            });
          },
        }),
        mockServices.rootConfig.factory({
          data: {
            app: {
              baseUrl: "http://localhost:3000",
            },
            auth: {
              providers: {
                ldap: {
                  test: {
                    cookies: { secure: false },
                    ldapAuthenticationOptions: {
                      usernameAttribute: "uid",
                    },
                  },
                },
              },
            },
          },
        }),
      ],
    });

    const agent = request.agent(backend.server);
    const response = await agent
      .post("/api/auth/ldap/refresh")
      .set("Cookie", [`${COOKIE_FIELD_KEY}=${token}`])
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      backstageIdentity: {
        identity: {
          ownershipEntityRefs: [],
          type: "user",
          userEntityRef: sub,
        },
        token,
      },
      profile: {
        email: "test@gmail.com",
        displayName: "test",
      },
      providerInfo: {},
    });
    expect(authHandler).toHaveBeenCalledTimes(1);
    expect(checkUserExists).toHaveBeenCalledTimes(1);
    await backend.stop();
  });

  it("Test token invalidation", async () => {
    const sub = "my-uid-name";
    const token = jwt.sign({ sub }, "secret", {
      expiresIn: "-1min",
    });

    const backend = await startTestBackend({
      features: [
        import("@backstage/plugin-auth-backend"),
        ldapAuthModule,
        createBackendModule({
          pluginId: "auth",
          moduleId: "ldap-ext-inval",
          register(reg) {
            reg.registerInit({
              deps: {
                ldapAuth: ldapAuthExtensionPoint,
              },
              async init({ ldapAuth }) {
                ldapAuth.set({
                  resolvers: {
                    checkUserExists: jest.fn(() => Promise.resolve(true)),
                  },
                  authHandler: jest.fn(async () => ({ profile: {} })) as any,
                });
              },
            });
          },
        }),
        mockServices.rootConfig.factory({
          data: {
            app: {
              baseUrl: "http://localhost:3000",
            },
            auth: {
              providers: {
                ldap: {
                  test: {
                    cookies: { secure: false },
                    ldapAuthenticationOptions: {
                      usernameAttribute: "uid",
                    },
                  },
                },
              },
            },
          },
        }),
      ],
    });

    const agent = request.agent(backend.server);

    const response = await agent
      .post("/api/auth/ldap/refresh")
      .set("Cookie", [`${COOKIE_FIELD_KEY}=${token}`])
      .send({});

    expect(response.status).not.toBe(200);
    expect(response.body).toMatchObject({
      error: {
        message: expect.stringContaining(JWT_EXPIRED_TOKEN),
      },
    });
    await backend.stop();
  });

  it("Test logout", async () => {
    const sub = "my-uid-name";
    const token = jwt.sign({ sub }, "secret", {
      expiresIn: "1min",
    });

    const backend = await startTestBackend({
      features: [
        import("@backstage/plugin-auth-backend"),
        ldapAuthModule,
        createBackendModule({
          pluginId: "auth",
          moduleId: "ldap-ext-logout",
          register(reg) {
            reg.registerInit({
              deps: {
                ldapAuth: ldapAuthExtensionPoint,
              },
              async init({ ldapAuth }) {
                ldapAuth.set({
                  resolvers: {
                    checkUserExists: jest.fn(() => Promise.resolve(true)),
                  },
                  authHandler: jest.fn(async () => ({ profile: {} })) as any,
                });
              },
            });
          },
        }),
        mockServices.rootConfig.factory({
          data: {
            app: {
              baseUrl: "http://localhost:3000",
            },
            auth: {
              providers: {
                ldap: {
                  test: {
                    cookies: { secure: false },
                    ldapAuthenticationOptions: {
                      usernameAttribute: "uid",
                    },
                  },
                },
              },
            },
          },
        }),
      ],
    });

    const agent = request.agent(backend.server);
    const response = await agent
      .post("/api/auth/ldap/logout")
      .set("Cookie", [`${COOKIE_FIELD_KEY}=${token}`])
      .send({});

    expect(response.status).toBe(200);
    expect(response.header["set-cookie"][0]).toContain(`${COOKIE_FIELD_KEY}=;`);
    await backend.stop();
  });
});
