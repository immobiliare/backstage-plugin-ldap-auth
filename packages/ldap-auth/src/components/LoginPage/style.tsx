import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

export type SignInPageClassKey = 'container' | 'item';

export const useStyles = makeStyles(
  {
    container: {
      padding: 0,
      listStyle: 'none',
    },
    item: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '400px',
      margin: 0,
      padding: 0,
    },
  },
  { name: 'BackstageSignInPage' },
);

export const GridItem = ({ children }: { children: JSX.Element }) => {
  const classes = useStyles();

  return (
    <Grid component="li" item classes={classes}>
      {children}
    </Grid>
  );
};
