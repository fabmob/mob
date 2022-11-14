import React from 'react';
import { Button } from '@material-ui/core';

const CustomAddButton = (props: { label: string }): JSX.Element => {
  const { label } = props;
  return (
    <Button size="medium" variant="contained" color="secondary" {...props}>
      {label}
    </Button>
  );
};
export default CustomAddButton;
