export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
    database: env.database,
    discovery: env.discovery,
    tokenManager: env.tokenManager,
    providerFactories: {
      ldap: ldap.create({
        resolvers: {
          async ldapAuthentication(username, password, ldapOptions, authFunction): LDAPUser {
            const user = await authFunction(ldapOptions)
            return { uid: user.uid };
          }
        }
    },
  });
}
