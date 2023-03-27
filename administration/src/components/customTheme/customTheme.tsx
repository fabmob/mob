import { createTheme } from '@material-ui/core/styles';
import { defaultTheme } from 'react-admin';

const customTheme = createTheme({
  ...defaultTheme,
  palette: {
    primary: {
      main: '#464cd0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#01bf7d',
      contrastText: '#FFFFFF',
    },
  },
  overrides: {
    MuiTableCell: {
      head: {
        'font-weight': 'bold',
      },
    },
    MuiFilledInput: {
      root: {
        'background-color': 'rgba(0, 0, 0, 0.04)',
      },
    },
  },
});

export default customTheme;
