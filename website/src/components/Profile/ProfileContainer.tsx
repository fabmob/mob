import React from 'react';

const ProfileContainer: React.FC<{ isEditing: boolean; onSubmit: () => void }> =
  ({ isEditing, children, onSubmit }) => {
    return isEditing ? (
      <div className="mcm-mon-profil">
        <form id="edit-profile-form" onSubmit={onSubmit}>
          {children}
        </form>
      </div>
    ) : (
      <div className="mcm-mon-profil o-bg-wrapper mb-l">{children}</div>
    );
  };

export default ProfileContainer;
