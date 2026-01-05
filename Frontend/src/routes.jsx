import React, { Suspense, Fragment, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Loader from './components/Loader/Loader';
import AdminLayout from './layouts/AdminLayout';

import { BASE_URL } from './config/constant';
import { api } from 'views/api';



const isAuthenticated = async () => {
  try {
    const res = await axios.get(
      `${api}/checkAuth`,
      { withCredentials: true }
    );
    return res.data.authenticated === true;
  } catch (error) {
    return false;
  }
};
const PrivateRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return children;
};

export const renderRoutes = (routes = []) => (
  <Suspense fallback={<Loader />}>
    <Routes>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Element = route.element;

        // If the route is private, wrap it in the PrivateRoute component
        const RouteElement = route.isPrivate ? (
          <PrivateRoute>
            <Layout>{route.routes ? renderRoutes(route.routes) : <Element />}</Layout>
          </PrivateRoute>
        ) : (
          <Layout>{route.routes ? renderRoutes(route.routes) : <Element />}</Layout>
        );

        return <Route key={i} path={route.path} element={<Guard>{RouteElement}</Guard>} />;
      })}
    </Routes>
  </Suspense>
);

const routes = [
  {
    exact: 'true',
    path: '/login',
    element: lazy(() => import('./views/auth/login'))
  },
    {
      exact: 'true',
      path: '/error/:code',
      element: lazy(() => import('./views/Error/Error'))
    },
  {
    path: '*',
    layout: AdminLayout,
    routes: [
      {
        exact: 'true',
        path: '/dashboard',
        element: lazy(() => import('./views/dashboard')),
        isPrivate: true
      }, 
      {
        exact: 'true',
        path: '/Projects',
        element: lazy(() => import('./views/ProjectManagement/Project')),
        isPrivate: true
      },
      {
        exact: 'true',
        path: '/Project-view/:id',
        element: lazy(() => import('./views/ProjectManagement/ProjectView')),
        isPrivate: true
      },
      {
        exact: 'true',
        path: '/Project-Edit/:id',
        element: lazy(() => import('./views/ProjectManagement/ProjectEdit')),
        isPrivate: true
      },
      {
        exact: 'true',
        path: '/Project-integration',
        element: lazy(() => import('./views/ProjectManagement/ProjectAdd')),
        isPrivate: true
      },
      {
        exact: 'true',
        path: '/Project-feeds/:projectId',
        element: lazy(() => import('./views/ProjectManagement/Feed')),
        isPrivate: true
      },
      {
        exact: 'true',
        path: '/Project-feeds/:projectId/Feed-details/:feedId',
        element: lazy(() => import('./views/ProjectManagement/FeedView')),
        isPrivate: true
      },
       {
        exact: 'true',
        path: '/Work-Report',
        element: lazy(() => import('./views/ProjectManagement/WorkReport')),
        isPrivate: true
      },
       {
        exact: 'true',
        path: '/Add-Work-Report',
        element: lazy(() => import('./views/ProjectManagement/WorkReportAdd')),
        isPrivate: true
      },
       {
        exact: 'true',
        path: '/Edit-Work-Report',
        element: lazy(() => import('./views/ProjectManagement/WorkReportEdit')),
        isPrivate: true
      },
       {
        exact: 'true',
        path: '/work-report-details/:id',
        element: lazy(() => import('./views/ProjectManagement/WrokReportDetaliis')),
        isPrivate: true
      },
      {
        exact: 'true',
        path: '/setting/role',
        element: lazy(() => import('./views/management/role')) ,
         isPrivate: true
      },
      {
        exact: 'true',
        path: '/setting/user',
        element: lazy(() => import('./views/management/user')),
         isPrivate: true
      },
      {
        path: '*',
        exact: 'true',
        element: () => <Navigate to={BASE_URL} />
      }
    ]
  }
];

export default routes;
