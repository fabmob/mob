import React from 'react';

const IndexPagePreview = ({ entry, getAsset }) => {
  const data = entry.getIn(['data']).toJS();

  if (data) {
    return <div>{data.title}</div>;
  }
  return <div>Loading...</div>;
};

export default IndexPagePreview;
