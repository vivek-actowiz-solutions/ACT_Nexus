// import React, { useContext, useEffect, useState } from 'react';

// import { ConfigContext } from '../../../contexts/ConfigContext';
// import useWindowSize from '../../../hooks/useWindowSize';

// import NavLogo from './NavLogo';
// import NavContent from './NavContent';
// import Manuitems from '../../../menu-items';

// console.log('menuItems', Manuitems);

// const Navigation = () => {
//   const configContext = useContext(ConfigContext);
//   const { collapseMenu } = configContext.state;
//   const windowSize = useWindowSize();
//   const [navigation , setNavigation] = useState([])
//  const filterMenuByPermissions = (menu, permissions) => {
//     const filterChildren = (children = []) =>
//       children
//         .filter((child) => !child.permission || permissions.includes(child.permission))
//         .map((child) => ({
//           ...child,
//           children: child.children ? filterChildren(child.children) : undefined
//         }));

//     return {
//       ...menu,
//       items: menu.items
//         .map((group) => ({
//           ...group,
//           children: filterChildren(group.children)
//         }))
//         .filter((group) => group.children && group.children.length > 0)
//     };
//   };

//   const getMenu = async () => {
//     try {
//       const res = await axios.get(`${api}/get-rolebase-permission`, { withCredentials: true });
//       const permissions = res.data;
//       return filterMenuByPermissions(Manuitems, permissions);
//     } catch (error) {
//       console.error('Error fetching permissions:', error);
//       return Manuitems;
//     }
//   };

//   useEffect(() => {
//     const fetchMenu = async () => {
//       const menu = await getMenu(); // ✅ wait for async function
//       console.log("hello",  menu )
//       setNavigation(menu);    // set only items
//     };
//     fetchMenu();
//   }, []);

//   let navClass = ['pcoded-navbar'];

//   navClass = [...navClass];

//   if (windowSize.width < 992 && collapseMenu) {
//     navClass = [...navClass, 'mob-open'];
//   } else if (collapseMenu) {
//     navClass = [...navClass, 'navbar-collapsed'];
//   }

//   let navBarClass = ['navbar-wrapper'];

//   let navContent = (
//     <div className={navBarClass.join(' ')}>
//       <NavLogo />
//       <NavContent navigation={navigation.items} />
//     </div>
//   );
//   if (windowSize.width < 992) {
//     navContent = (
//       <div className="navbar-wrapper">
//         <NavLogo />
//         <NavContent navigation={navigation.items} />
//       </div>
//     );
//   }
//   return (
//     <React.Fragment>
//       <nav className={navClass.join(' ')}>{navContent}</nav>
//     </React.Fragment>
//   );
// };

// export default Navigation;
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { ConfigContext } from '../../../contexts/ConfigContext';
import useWindowSize from '../../../hooks/useWindowSize';

import NavLogo from './NavLogo';
import NavContent from './NavContent';
import Manuitems from '../../../menu-items';
import { api } from '../../../views/api';

const Navigation = () => {
  const { state: { collapseMenu } } = useContext(ConfigContext);
  const windowSize = useWindowSize();
  const [navigation, setNavigation] = useState(null); // ✅ initialize as null

  // ---- Filter function ----
  const filterMenuByPermissions = (menu, permissions) => {
    const filterChildren = (children = []) =>
      children
        .filter((child) => !child.permission || permissions.includes(child.permission))
        .map((child) => ({
          ...child,
          children: child.children ? filterChildren(child.children) : undefined
        }));

    return {
      ...menu,
      items: menu.items
        .map((group) => ({
          ...group,
          children: filterChildren(group.children)
        }))
        .filter((group) => group.children && group.children.length > 0)
    };
  };

  // ---- Fetch menu ----
  const getMenu = async () => {
    try {
      const res = await axios.get(`${api}/get-rolebase-permission`, { withCredentials: true });
      const permissions = res.data;
      return filterMenuByPermissions(Manuitems, permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return Manuitems;
    }
  };

  useEffect(() => {
    const fetchMenu = async () => {
      const menu = await getMenu();
      setNavigation(menu.items); // ✅ store only items
    };
    fetchMenu();
  }, []);

  // ---- show nothing while loading ----
  if (!navigation) return null;

  // ---- Navbar classes ----
  let navClass = ['pcoded-navbar'];
  if (windowSize.width < 992 && collapseMenu) navClass.push('mob-open');
  else if (collapseMenu) navClass.push('navbar-collapsed');

  const navBarClass = ['navbar-wrapper'];

  return (
    <nav className={navClass.join(' ')}>
      <div className={navBarClass.join(' ')}>
        <NavLogo />
        <NavContent navigation={navigation} /> 
      </div>
    </nav>
  );
};

export default Navigation;
