import { Content, Page } from '@backstage/core-components';
import React, { useEffect, useState } from 'react';
import { Paper, TextField, Container, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PasswordValidator from 'password-validator';

export type LoginFormProps = {
    onSubmit: (username: string, password: string) => void;
    onSignInError?: (error: Error) => void;
    error?: Error;
    helperTextUsername?: string;
    helperTextPassword?: string;
    validateUsername?: (usr: string) => boolean;
    validatePassword?: (pass: string) => boolean;
    usernameLabel?: string;
};

const useStyles = makeStyles((theme) => ({
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    paperHead: {
        marginBottom: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
}));

const passwordSchema = new PasswordValidator();
const usernameSchema = new PasswordValidator();

passwordSchema.is().min(4).not().spaces();
usernameSchema.is().min(4).is().max(40).not().spaces();

export const LoginForm = ({
    onSubmit,
    onSignInError,
    error,
    helperTextUsername,
    helperTextPassword,
    validatePassword,
    validateUsername,
    usernameLabel,
}: LoginFormProps) => {
    const validatePasswd =
        validatePassword || passwordSchema.validate.bind(passwordSchema);
    const validateUsern =
        validateUsername || usernameSchema.validate.bind(usernameSchema);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [uError, setUError] = useState(Boolean(error));
    const [pError, setPError] = useState(Boolean(error));
    const classes = useStyles();

    function onClick() {
        const isUsernameValid = validateUsern(username) as boolean;
        const isPasswordValid = validatePasswd(password) as boolean;
        setUError(!isUsernameValid);
        setPError(!isPasswordValid);

        if (isUsernameValid && isPasswordValid) onSubmit(username, password);
    }

    useEffect(() => {
        if (error && onSignInError) {
            onSignInError(error);
        }
    }, [error, onSignInError]);

    useEffect(() => {
        const keyDownHandler = (event: {
            key: string;
            preventDefault: () => void;
        }) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                onClick();
            }
        };

        document.addEventListener('keydown', keyDownHandler);

        return () => {
            document.removeEventListener('keydown', keyDownHandler);
        };
    });

    return (
        <Page themeId="tool">
            <Content>
                <Container maxWidth="sm">
                    <Paper elevation={4} className={classes.paper}>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <TextField
                                required
                                label={usernameLabel || 'LDAP Name'}
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                                type="username"
                                autoComplete="username"
                                id="username"
                                error={uError}
                                helperText={helperTextUsername}
                                fullWidth
                                size="small"
                                margin="dense"
                            />
                            <TextField
                                required
                                label="Password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                id="password"
                                type="password"
                                autoComplete="password"
                                error={pError}
                                helperText={helperTextPassword}
                                fullWidth
                                size="small"
                                margin="dense"
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                fullWidth
                                onClick={onClick}
                                type="submit"
                                style={{ marginTop: 16 }}
                            >
                                Login
                            </Button>
                        </form>
                    </Paper>
                </Container>
            </Content>
        </Page>
    );
};
