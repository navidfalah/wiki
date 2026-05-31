import React from 'react';
import Content from '@theme-original/DocItem/Content';
import Backlinks from '@site/src/components/Backlinks';

/**
 * Swizzled DocItem/Content — renders default doc body plus Backlinks footer.
 * Created via theme shadowing (equivalent to: npm run swizzle DocItem/Content).
 */
export default function DocItemContent(props) {
  return (
    <>
      <Content {...props} />
      <Backlinks />
    </>
  );
}
