import { AiOutlineApi } from 'react-icons/ai';
import { IoHome } from 'react-icons/io5';
import { CiCircleList } from 'react-icons/ci';
// import { FaRegUser } from "react-icons/fa";
import { FaCog, FaPlay, FaUser } from 'react-icons/fa';
import { RiUserSettingsFill } from 'react-icons/ri';
import { RiUserLine } from 'react-icons/ri';
import axios from 'axios';
import { api } from 'views/api';

// ---- Full Menu with permission keys ----
const allMenuItems = {
  items: [
    {
      id: 'main',
      title: 'Main',
      type: 'group',
      icon: AiOutlineApi,
      children: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'item',
          icon: IoHome,
          url: '/dashboard',
          permission: 'Dashboard'
        }
      ]
    },
    {
      id: 'projectmanagement',
      title: 'Project Management',
      type: 'group',
      icon: AiOutlineApi,
      children: [
        {
          id: 'projectS',
          title: 'Projects',
          type: 'item',
          url: '/Projects',
          icon: FaCog,
          permission: 'Projects',
          children: [
            {
              id: 'projectintegration',
              title: 'Project Add',
              type: 'item',
              url: '/Project-integration',
              permission: 'Projects'
            },
            {
              id: 'projecview',
              title: 'Project View',
              type: 'item',
              url: '/Project-view/:id',
              permission: 'Projects'
            },
            {
              id: 'projectedit',
              title: 'Project Edit',
              type: 'item',
              url: '/Project-Edit/:id',
              permission: 'Projects'
            },
            {
              id: 'feedslist',
              title: 'Feeds List',
              type: 'item',
              url: '/Project-feeds/:projectId',
              permission: 'Projects',
              children: [
                {
                  id: 'feedslist',
                  title: 'Feeds view',
                  type: 'item',
                  url: '/Project-feeds/:projectId/Feed-details/:feedId',
                  permission: 'Projects'
                }
              ]
            }
          ]
        },
      ]
    },
    {
      id: 'workmanagement',
      title: 'Work Management',
      type: 'group',
      icon: AiOutlineApi,
      children: [
        {
          id: 'workreport',
          title: 'Work Report',
          type: 'item',
          icon: CiCircleList,
          url: '/Work-Report',
          permission: 'WorkReport',
          children: [
            {
              id: 'addworkreport',
              title: 'Add Work Report',
              type: 'item',
              url: '/add-work-report',
              permission: 'WorkReport'
            },
            {
              id: 'workreportDetails',
              title: 'Work Report Details',
              type: 'item',
              url: '/work-report-details/:id',
              permission: 'WorkReport'
            },
            {
              id: 'editworkreport',
              title: 'Edit Work Report ',
              type: 'item',
              url: '/Edit-Work-Report',
              permission: 'WorkReport'
            }
          ]
        }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      type: 'group',
      children: [
        {
          id: 'roles',
          title: 'Role',
          type: 'item',
          url: '/setting/role',
          icon: FaCog,
          permission: 'Role'
        },
        {
          id: 'users',
          title: 'User',
          type: 'item',
          url: '/setting/user',
          icon: RiUserLine,
          permission: 'User'
        }
      ]
    }
  ]
};

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

// ---- Fetch Permissions + Export Menu ----
// fallback if API fails

// (async () => {
//   try {
//     const res = await axios.get(`${api}/get-rolebase-permission`, { withCredentials: true });
//     const permissions = res.data;
//     console.log('permissions++++++++', res);
//     menuItems = filterMenuByPermissions(allMenuItems, permissions);
//     console.log('menuItems +++++++++', menuItems);
//   } catch (error) {
//     console.error('Error fetching permissions:', error);
//   }
// })();

// const getMenu = async () => {
//   try {
//     const res = await axios.get(`${api}/get-rolebase-permission`, { withCredentials: true });
//     const permissions = res.data;
//     // console.log('permissions++++++++', res);
//     return filterMenuByPermissions(allMenuItems, permissions);
//   } catch (error) {
//     console.error('Error fetching permissions:', error);
//     return allMenuItems;
//   }
// };
let menuItems = allMenuItems;

// async function initMenu() {
//   menuItems = await getMenu();
//   console.log("menuItems", menuItems);
// }

// initMenu();

export default menuItems;
