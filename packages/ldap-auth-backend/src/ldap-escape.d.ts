
declare module 'ldap-escape' {
    function filter(TemplateStringsArray: TemplateStringsArray, ...str: string[] | number[]): string;
    function dn(TemplateStringsArray: TemplateStringsArray, ...str: string[] | number[]): string
}
