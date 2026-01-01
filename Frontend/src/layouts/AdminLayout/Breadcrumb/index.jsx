// import React, { useState, useEffect } from 'react';
// // import { ListGroup } from 'react-bootstrap';
// import { Link, useLocation } from 'react-router-dom';

// import navigation from '../../../menu-items';
// import { BASE_TITLE } from '../../../config/constant';

// const Breadcrumb = () => {
//   const location = useLocation();
//   const [breadcrumbs, setBreadcrumbs] = useState([]);

//   useEffect(() => {
//     const path = location.pathname;
//     const matchedItems = [];

//     const findBreadcrumbs = (items, parents = []) => {
//       for (const item of items) {
//         if (item.type === 'item') {
//           // Support dynamic route like /api-detail/:id
//           const itemPath = item.url?.replace(/:\w+/g, '[^/]+');
//           const regex = new RegExp(`^${itemPath}$`);

//           if (regex.test(path)) {
//             matchedItems.push(...parents, item);
//             return true;
//           }
//         }

//         if (item.children) {
//           const found = findBreadcrumbs(item.children, [...parents, item]);
//           if (found) return true;
//         }
//       }
//       return false;
//     };

//     findBreadcrumbs(navigation.items);
//     setBreadcrumbs(matchedItems);

//     if (matchedItems.length > 0) {
//       document.title = matchedItems[matchedItems.length - 1].title + BASE_TITLE;
//     }
//   }, [location.pathname]);

//   return (
//     <div className="page-header mb-3">
//       <div className="page-block">
//         <div className="row align-items-center">
//           <div className="col-md-12">
//             <h5 className="mb-2 fw-bold">{breadcrumbs[breadcrumbs.length - 1]?.title || ''}</h5>

//             <div className="d-flex align-items-center text-muted">
//               <Link to="/" className="text-muted me-2">
//                 <i className="feather icon-home" />
//               </Link>
//               <span className="mx-1">/</span>
//               <span className="fw-semibold text-dark">{breadcrumbs[breadcrumbs.length - 1]?.title || ''}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Breadcrumb;
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import navigation from '../../../menu-items';
import { BASE_TITLE } from '../../../config/constant';

/**
 * Extract dynamic IDs manually from URL
 * Works even when React Router gives only "*"
 */
const extractDynamicParams = (pathname) => {
  const parts = pathname.split('/').filter(Boolean);
  const params = {};

  const projectIndex = parts.indexOf('Project-feeds');
  if (projectIndex !== -1 && parts[projectIndex + 1]) {
    params.projectId = parts[projectIndex + 1];
  }

  const feedIndex = parts.indexOf('Feed-details');
  if (feedIndex !== -1 && parts[feedIndex + 1]) {
    params.feedId = parts[feedIndex + 1];
  }

  return params;
};

const Breadcrumb = () => {
  const location = useLocation();
  const routeParams = useParams();
  const derivedParams = extractDynamicParams(location.pathname);

  // ✅ merge both (derived overrides *)
  const params = {
    ...routeParams,
    ...derivedParams
  };

  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const buildUrl = (url, params) => {
    if (!url) return null;

    let finalUrl = url;

    Object.keys(params).forEach((key) => {
      finalUrl = finalUrl.replace(`:${key}`, params[key]);
    });

    // 🔒 If unresolved param still exists, disable link
    if (finalUrl.match(/:\w+/)) return null;

    return finalUrl;
  };

  useEffect(() => {
    const path = location.pathname;
    const matchedItems = [];

    const findBreadcrumbs = (items, parents = []) => {
      for (const item of items) {
        if (item.type === 'item' && item.url) {
          const itemPath = item.url.replace(/:\w+/g, '[^/]+');
          const regex = new RegExp(`^${itemPath}$`);
          if (regex.test(path)) {
            matchedItems.push(...parents, item);
            return true;
          }
        }

        if (item.children) {
          if (findBreadcrumbs(item.children, [...parents, item])) return true;
        }
      }
      return false;
    };

    findBreadcrumbs(navigation.items);
    setBreadcrumbs(matchedItems);

    if (matchedItems.length) {
      document.title =
        matchedItems[matchedItems.length - 1].title + BASE_TITLE;
    }
  }, [location.pathname]);

  return (
    <div className="page-header mb-3">
      <h5 className="fw-bold">
        {breadcrumbs[breadcrumbs.length - 1]?.title || ''}
      </h5>

      <div className="d-flex align-items-center text-muted flex-wrap">
        <Link to="/" className=" me-2 text-muted">
          <i className="feather icon-home" />
        </Link>

        {breadcrumbs.map((crumb, index) => {
          const link = buildUrl(crumb.url, params);

          return (
            <React.Fragment key={index}>
              {index !== breadcrumbs.length - 1 ? (
                <>
                  {link ? (
                    <Link
                      to={link}
                      className="text-muted text-decoration-none"
                    >
                      {crumb.title}
                    </Link>
                  ) : (
                    <span className="text-muted ">{crumb.title}</span>
                  )}
                  <span className="mx-1">/</span>
                </>
              ) : (
                <span className="fw-semibold text-dark">{crumb.title}</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Breadcrumb;


