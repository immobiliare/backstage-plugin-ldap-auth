import { AUTH_USER_DATA_ERROR } from "./errors";
import { defaultCheckUserExists, defaultLDAPAuthentication } from "./ldap";
import type { LdapAuthenticationOptions } from "./types";

let searchEntriesResult: any[] = [
  { uid: "ieqwiewqee", dn: "uid=ieqwiewqee,dc=localhost" },
];

jest.mock("ldapts", () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        isConnected: true,
        startTLS: jest.fn().mockResolvedValue(true),
        bind: jest.fn().mockResolvedValue(true),
        unbind: jest.fn().mockResolvedValue(true),
        search: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            searchEntries: searchEntriesResult,
          });
        }),
      };
    }),
  };
});

describe("LDAP authentication", () => {
  beforeEach(() => {
    searchEntriesResult = [
      { uid: "ieqwiewqee", dn: "uid=ieqwiewqee,dc=localhost" },
    ];
  });

  it("LDAP authentication success", async () => {
    const out = await defaultLDAPAuthentication(
      "john-doe",
      "my-secure-password",
      { ldapOpts: { url: "localhost" }, userSearchBase: "dc=localhost" },
    );

    expect(out).toEqual({ uid: "ieqwiewqee" });
  });

  it("LDAP authentication throws on bad attributes", async () => {
    searchEntriesResult = [{ dn: "uid=ieqwiewqee,dc=localhost" } as any]; // Missing usernameAttribute 'uid'
    await expect(
      defaultLDAPAuthentication("john-doe", "my-secure-password", {
        ldapOpts: { url: "localhost" },
        userSearchBase: "dc=localhost",
      }),
    ).rejects.toEqual(new Error(AUTH_USER_DATA_ERROR));
  });
});

describe("LDAP check user exists", () => {
  beforeEach(() => {
    searchEntriesResult = [
      { uid: "ieqwiewqee", dn: "uid=ieqwiewqee,dc=localhost" },
    ];
  });

  it("defaultCheckUserExists should return true if user is found", async () => {
    const options: LdapAuthenticationOptions = {
      ldapOpts: {
        url: "test.com",
      },
      adminDn: "admin",
      adminPassword: "secretPassword",
      username: "ieqwiewqee",
    };
    await expect(defaultCheckUserExists(options)).resolves.toEqual(true);
  });

  it("defaultCheckUserExists should return false if user is not found", async () => {
    const options: LdapAuthenticationOptions = {
      ldapOpts: {
        url: "test.com",
      },
      username: "ieqwiewqee",
    };
    searchEntriesResult = [];
    await expect(defaultCheckUserExists(options)).resolves.toEqual(false);
  });
});
