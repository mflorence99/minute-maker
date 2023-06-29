import jsome from 'jsome';

// //////////////////////////////////////////////////////////////////////////
// 🟩 Global jsome configuration (must be imported first!)
// //////////////////////////////////////////////////////////////////////////

jsome.colors = {
  num: 'cyan',
  str: 'white',
  bool: 'white',
  regex: 'blue',
  undef: 'grey',
  null: 'grey',
  attr: 'green',
  quot: 'yellow',
  punc: 'yellow',
  brack: 'yellow'
};

jsome.params.async = true;

jsome.params.lintable = true;

jsome.level.show = true;
