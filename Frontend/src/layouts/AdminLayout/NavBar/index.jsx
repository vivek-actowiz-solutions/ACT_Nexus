import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';

import NavLeft from './NavLeft';
import NavRight from './NavRight';

import { ConfigContext } from '../../../contexts/ConfigContext';
import * as actionType from '../../../store/actions';
import logo from '../../../../public/icon.svg';

const NavBar = () => {
  const [moreToggle, setMoreToggle] = useState(false);
  const configContext = useContext(ConfigContext);
  const { collapseMenu, headerFixedLayout, layout } = configContext.state;
  const { dispatch } = configContext;

  let headerClass = ['navbar', 'pcoded-header', 'navbar-expand-lg'];
  if (headerFixedLayout && layout === 'vertical') {
    headerClass = [...headerClass, 'headerpos-fixed'];
  }

  let toggleClass = ['mobile-menu'];
  if (collapseMenu) {
    toggleClass = [...toggleClass, 'on'];
  }

  const navToggleHandler = () => {
    dispatch({ type: actionType.COLLAPSE_MENU });
  };

  let moreClass = ['mob-toggler'];

  let collapseClass = ['collapse navbar-collapse'];
  if (moreToggle) {
    moreClass = [...moreClass, 'on'];
    collapseClass = [...collapseClass, 'show'];
  }

  let navBar = (
    <React.Fragment>
      <div className="m-header">
        <Link to="#" className={toggleClass.join(' ')} id="mobile-collapse" onClick={navToggleHandler}>
          <span />
        </Link>
        <Link to="#" className="b-brand">
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
        </Link>
        <Link to="#" className={moreClass.join(' ')} onClick={() => setMoreToggle(!moreToggle)}>
          <i className="feather icon-more-vertical" />
        </Link>
      </div>
      <div style={{ justifyContent: 'space-between' }} className={collapseClass.join(' ')}>
        <NavLeft />
        <NavRight />
      </div>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      <header className={headerClass.join(' ')}>{navBar}</header>
    </React.Fragment>
  );
};

export default NavBar;
