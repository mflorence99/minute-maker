import jsome from 'jsome';

// //////////////////////////////////////////////////////////////////////////
// 🟩 Global jsome configuration (must be imported first!)
// //////////////////////////////////////////////////////////////////////////

jsome.colors = {
  num: 'cyan', // stands for numbers
  str: ['yellow', 'bold'], // stands for strings
  bool: 'white', // stands for booleans
  regex: 'blue', // stands for regular expressions
  undef: 'grey', // stands for undefined
  null: 'grey', // stands for null
  attr: 'green', // objects attributes -> { attr : value }
  quot: 'yellow', // strings quotes -> "..."
  punc: 'yellow', // commas seperating arrays and objects values -> [ , , , ]
  brack: 'yellow' // for both {} and []
};

jsome.params.async = true;

jsome.params.lintable = true;

jsome.level.show = true;
