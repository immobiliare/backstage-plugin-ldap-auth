import { Content, Page } from '@backstage/core-components';
import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  TextField,
  Container,
  Button,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PasswordValidator from 'password-validator';

export type LoginFormProps = {
  onSubmit: (username: string, password: string) => void;
  error?: Error;
};

const useStyles = makeStyles(theme => ({
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

export const LoginForm = ({ onSubmit, error }: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [uError, setUError] = useState(Boolean(error));
  const [pError, setPError] = useState(Boolean(error));
  const classes = useStyles();

  function onClick() {
    const isUsernameValid = usernameSchema.validate(username) as boolean;
    const isPasswordValid = passwordSchema.validate(password) as boolean;
    setUError(!isUsernameValid);
    setPError(!isPasswordValid);

    if (isUsernameValid && isPasswordValid) onSubmit(username, password);
  }

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
          <Typography variant="h5" component="h2" className={classes.paperHead}>
            LDAP login page
          </Typography>
          <Paper elevation={4} className={classes.paper}>
            <TextField
              required
              label="LDAP Name"
              onChange={e => setUsername(e.target.value)}
              value={username}
              id="username"
              error={uError}
              helperText={`Usually it's  the first letter of your name followed by the surname, e.g. Dario Rossi 👉 drossi`}
              fullWidth
              size="small"
              margin="dense"
            />
            <TextField
              required
              label="Password"
              onChange={e => setPassword(e.target.value)}
              value={password}
              id="password"
              type="password"
              error={pError}
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
          </Paper>
        </Container>
      </Content>
    </Page>
  );
};