import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import { Grommet } from 'grommet';

const theme = {
  global: {
    colors: {
      brand: '#000000',
      'accent-1': '#D6219C',
      'accent-2': '#871FFF'
    },
    focus: {
      border: {
        color: '#D6219C'
      }
    },
    font: {
      family: 'Roboto',
      size: '14px',
      height: '20px',
    },
  },
};

ReactDOM.render(<Grommet theme={theme} full><App /></Grommet>, document.getElementById('root'));
