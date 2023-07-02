import 'jest-extended';

// 👇 we have to split this up as require only works once!

describe('isDev', () => {
  it('correctly identifies production mode', () => {
    // :see https://stackoverflow.com/questions/54021037
    delete window.location;
    window.location = new URL('https://www.example.com') as any;
    const isDev = require('./is-dev').default;
    expect(isDev).toBeFalse();
  });
});
