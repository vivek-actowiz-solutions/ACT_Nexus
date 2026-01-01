import PropTypes from 'prop-types';
import React from 'react';

const NavIcon = ({ items }) => {
  let navIcons = false;
  // console.log('items', items);
  const IconComponent = items.icon;
  if (items.icon) {
    navIcons = (
      <span className="pcoded-micon">
        <IconComponent size={20} />
      </span>
    );
  }

  return <React.Fragment>{navIcons}</React.Fragment>;
};

NavIcon.propTypes = {
  items: PropTypes.object,
  icon: PropTypes.string
};

export default NavIcon;
