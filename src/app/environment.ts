import PACKAGE from '../../package.json';

const isDev = ['localhost', '127.0.0.1'].includes(location.hostname);

export const environment = {
  package: {
    author: PACKAGE.author,
    name: PACKAGE.name,
    description: PACKAGE.description,
    license: PACKAGE.license,
    repository: {
      type: PACKAGE.repository.type,
      url: PACKAGE.repository.url
    },
    version: PACKAGE.version
  },

  production: !isDev
};
