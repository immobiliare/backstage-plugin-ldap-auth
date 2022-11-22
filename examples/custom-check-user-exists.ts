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
            async checkUserExists(ldapAuthOptions, searchFunction): Promise<boolean> {
                const { username } = ldapAuthOptions;

                // Do you custom checks
                // ....
                
                return true;
            }
        }
    },
  });
}
