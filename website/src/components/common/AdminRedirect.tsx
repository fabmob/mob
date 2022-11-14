import React, { FC } from 'react';

interface AdminRedirectProps {
  adminPage: string;
  collection: string;
}

const AdminRedirect: FC<AdminRedirectProps> = ({ collection, adminPage }) => {
  const admin = adminPage
    .split('-')
    .map(function (word) {
      return word[0].toUpperCase() + word.substr(1);
    })
    .join('%20');

  return (
    <button
      type="button"
      onClick={() => {
        document.location.href = `/admin/#/collections/${collection}/entries/${admin}`;
      }}>
      Admin
    </button>
  );
};

export default AdminRedirect;
