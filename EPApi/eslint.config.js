import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended, 
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,    
        ...globals.mocha,   
      },
    },
    rules: {
      'no-unused-vars': 'warn',   
      'no-console': 'off',        
      'semi': ['error', 'always'], 
      'quotes': ['error', 'single'], 
      'indent': ['error', 2]  
    },
  },
];