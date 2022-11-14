const React = require('react');
const { forwardRef } = React;

const component = (props = {}, ref = {}) => {
  return <svg ref={ref} {...props} />;
};

const ReactComponent = forwardRef(component);

module.exports = {
  ReactComponent,
  default: 'file.svg',
};
