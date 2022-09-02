/// <reference types="react" />
export declare type LoginFormProps = {
    onSubmit: (username: string, password: string) => void;
    error?: Error;
};
export declare const LoginForm: ({
    onSubmit,
    error,
}: LoginFormProps) => JSX.Element;
