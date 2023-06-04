import PACKAGE from '#mm/package';

export const environment = {
  env: {
    OPEN_AI_KEY: process.env['OPEN_AI_KEY']
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

  production: !process.argv.includes('DEV_MODE')
};
