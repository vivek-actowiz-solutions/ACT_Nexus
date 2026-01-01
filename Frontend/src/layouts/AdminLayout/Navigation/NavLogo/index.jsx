import React, { useContext } from 'react';
import { Link } from 'react-router-dom';

import { ConfigContext } from '../../../../contexts/ConfigContext';
import * as actionType from '../../../../store/actions';
import logo from '../../../../../public/icon.svg';
const NavLogo = () => {
  const configContext = useContext(ConfigContext);
  const { collapseMenu } = configContext.state;
  const { dispatch } = configContext;

  let toggleClass = ['mobile-menu'];
  if (collapseMenu) {
    toggleClass = [...toggleClass, 'on'];
  }

  return (
    <React.Fragment>
      <div className="navbar-brand header-logo">
        {/* <div className="b-brand">
          <div className="b-bg">
            <img src={logo} alt="actowiz" />
          </div>
          <span className="b-title b-brand ">ACT</span>
          <span className="b-title b-brand ">api hub</span>
        </div> */}
        <div className="b-brand d-flex align-items-center gap-3 ">
          <div className="b-bg">
            <img src={logo} alt="actowiz" />
          </div>
          <div className="brand-text p-1">
            <div
              className="m-0 fw-bold text-uppercase fs-4 lh-sm b-title "
              style={{
                // background: 'linear-gradient(90deg, #66b3e9, #9b7dd4, #6fd3e8)', // blue → purple → aqua
                // WebkitBackgroundClip: 'text',
                color: 'white',
                // WebkitTextFillColor: 'transparent',
                letterSpacing: '2px'
              }}
            >
              ACTOWIZ
            </div>

            <div
              className="text-uppercase fw-semibold fs-6 b-title "
              style={{
                // background: 'linear-gradient(90deg, #7cb5e8, #a78bfa, #89e3ec)', // lighter version for subtitle
                // WebkitBackgroundClip: 'text',
                // WebkitTextFillColor: 'transparent',
                color: 'white',
                letterSpacing: '1.5px'
              }}
            >
             Nexus
            </div>
          </div>
        </div>
        <Link to="#" className={toggleClass.join(' ')} id="mobile-collapse" onClick={() => dispatch({ type: actionType.COLLAPSE_MENU })}>
          <span />
        </Link>
      </div>
    </React.Fragment>
  );
};

export default NavLogo;
