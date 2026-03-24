import { Content, Page } from "@backstage/core-components";
import { Button, Paper, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import PasswordValidator from "password-validator";
import React from "react";
import { useEffect, useState } from "react";

/**
 * Style overrides for the login form layout.
 *
 * @public
 */
export type LoginFormStyles = {
  /** Style for the outermost container wrapping children and the form. */
  container?: React.CSSProperties;
  /** Style for the Content wrapper (controls overall layout/centering). */
  content?: React.CSSProperties;
  /** Style for the Paper card containing the form. */
  paper?: React.CSSProperties;
  /** Style for the form element itself. */
  form?: React.CSSProperties;
};

export type LoginFormProps = {
  onSubmit: (username: string, password: string) => void;
  onSignInError?: (error: Error) => void;
  error?: Error;
  logo?: React.ReactNode;
  helperTextUsername?: string;
  helperTextPassword?: string;
  validateUsername?: (usr: string) => boolean;
  validatePassword?: (pass: string) => boolean;
  usernameLabel?: string;
  /** Optional inline style overrides for the login form layout. */
  styles?: LoginFormStyles;
};

const useStyles = makeStyles((theme) => ({
  content: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
  paperHead: {
    marginBottom: theme.spacing(2),
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
}));

const passwordSchema = new PasswordValidator();
const usernameSchema = new PasswordValidator();

passwordSchema.is().min(4).not().spaces();
usernameSchema.is().min(3).is().max(40).not().spaces();

export const LoginForm = ({
  onSubmit,
  onSignInError,
  error,
  logo,
  helperTextUsername,
  helperTextPassword,
  validatePassword,
  validateUsername,
  usernameLabel,
  styles: styleOverrides,
}: LoginFormProps) => {
  const validatePasswd =
    validatePassword || passwordSchema.validate.bind(passwordSchema);
  const validateUsern =
    validateUsername || usernameSchema.validate.bind(usernameSchema);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      if (event.key === "Enter") {
        event.preventDefault();
        onClick();
      }
    };

    document.addEventListener("keydown", keyDownHandler);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  });

  return (
    <Page themeId="tool">
      <Content noPadding>
        <div
          className={classes.content}
          style={{ width: "100%", height: "100%", ...styleOverrides?.content }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 600,
              ...styleOverrides?.container,
            }}
          >
            <Paper
              elevation={4}
              className={classes.paper}
              style={styleOverrides?.paper}
            >
              <form
                onSubmit={(e) => e.preventDefault()}
                style={styleOverrides?.form}
              >
                {logo}
                <TextField
                  required
                  label={usernameLabel || "LDAP Name"}
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
          </div>
        </div>
      </Content>
    </Page>
  );
};
