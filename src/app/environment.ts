import PACKAGE from '../../package.json';

const IS_DEV = ['localhost', '127.0.0.1'].includes(location.hostname);

export const environment = {
  mode: (): string => (environment.production ? 'prod' : 'dev'),

  env: {
    OPEN_AI_KEY: null
  },

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

  production: !IS_DEV
};
