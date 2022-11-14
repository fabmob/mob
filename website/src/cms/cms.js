import CMS from 'netlify-cms-app';

CMS.registerMediaLibrary({
  name: 'disabled',
  init: () => ({ show: () => undefined, enableStandalone: () => false }),
});
