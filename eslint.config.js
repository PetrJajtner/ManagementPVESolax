// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default tseslint.config(
  {
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      stylistic.configs['recommended-flat']
    ],
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: 'tsconfig.json',
        type: 'module'
      }
    },
    processor: angular.processInlineTemplates,
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/component-selector': [
        'warn',
        {
          prefix: '',
          style:  'kebab-case',
          type:   'element'
        },
      ],
      '@angular-eslint/contextual-lifecycle': 'error',
      '@angular-eslint/directive-class-suffix': 'error',
      '@angular-eslint/directive-selector': [
        'warn',
        {
          prefix: '',
          style:  'camelCase',
          type:   'attribute'
        }
      ],
      '@angular-eslint/no-conflicting-lifecycle': 'error',
      '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
      '@angular-eslint/no-input-rename': 'off',
      '@angular-eslint/no-inputs-metadata-property': 'error',
      '@angular-eslint/no-output-native': 'off',
      '@angular-eslint/no-output-on-prefix': 'off',
      '@angular-eslint/no-output-rename': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
      '@angular-eslint/prefer-standalone': 'off',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/use-pipe-transform-interface': 'error',
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/consistent-type-definitions': [
        'error',
        'type'
      ],
      '@typescript-eslint/dot-notation': 'warn',
      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        {
          accessibility: 'explicit'
        }
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/member-ordering': [
        'off',
        {
          default: {
            order: 'alphabetically',
            memberTypes: [
              'public-field',
              'protected-field',
              'private-field',
              'public-get',
              'public-set',
              'protected-get',
              'protected-set',
              'private-get',
              'private-set',
              'public-constructor',
              'protected-constructor',
              'private-constructor',
              'public-method',
              'protected-method',
              'private-method'
            ]
          }
        }
      ],
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: [
            'objectLiteralProperty',
            'typeProperty'
          ],
          format: [
            'snake_case',
            'camelCase',
            'PascalCase'
          ],
          leadingUnderscore: 'allow'
        },
        {
          selector: [
            'parameter',
            'classProperty',
            'method'
          ],
          format: [
            'camelCase'
          ]
        },
        {
          selector: 'classProperty',
          modifiers: [
            'public',
            'static',
            'readonly'
          ],
          format: [
            'UPPER_CASE'
          ]
        },
        {
          selector: [
            'classProperty',
            'method'
          ],
          format: [
            'camelCase'
          ],
          modifiers: [
            'protected'
          ],
          leadingUnderscore: 'require'
        },
        {
          selector: [
            'classProperty',
            'method'
          ],
          format: [
            'camelCase'
          ],
          modifiers: [
            'private'
          ],
          prefix: [
            '__'
          ]
        },
        {
          selector: 'classProperty',
          format: [
            'PascalCase'
          ],
          modifiers: [
            'static'
          ]
        },
        {
          selector: [
            'property',
            'method'
          ],
          format: [
            'PascalCase'
          ],
          modifiers: [
            'private',
            'static'
          ],
          prefix: [
            '__'
          ]
        },
        {
          selector: 'method',
          format: [
            'PascalCase'
          ],
          modifiers: [
            'static'
          ]
        },
        {
          selector: 'enumMember',
          format: [
            'PascalCase'
          ]
        }
      ],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-inferrable-types': [
        'error',
        {
          ignoreParameters: true,
          ignoreProperties: true
        }
      ],
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-shadow': [
        'off',
        {
          hoist: 'all'
        }
      ],
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      '@typescript-eslint/parameter-properties': 'off',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-namespace-keyword': 'error',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/triple-slash-reference': [
        'error',
        {
          lib: 'always',
          path: 'always',
          types: 'prefer-import'
        }
      ],
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      '@stylistic/block-spacing': 'off',
      '@stylistic/brace-style': [
        'error',
        '1tbs'
      ],
      '@stylistic/comma-dangle': [
        'error',
        'never'
      ],
      '@stylistic/indent': [
        'warn',
        2,
        {
          CallExpression: {
            arguments: 'first'
          },
          FunctionDeclaration: {
            body: 1,
            parameters: 2
          },
          FunctionExpression: {
            body: 1,
            parameters: 2
          },
          SwitchCase: 1,
          VariableDeclarator: 'first'
        }
      ],
      '@stylistic/indent-binary-ops': 'off',
      '@stylistic/key-spacing': [
        'error',
        {
          afterColon: true,
          align: 'value',
          mode: 'minimum'
        }
      ],
      '@stylistic/max-len': [
        'error',
        {
          code: 160,
          tabWidth: 2
        }
      ],
      '@stylistic/member-delimiter-style': [
        'warn',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false
          }
        }
      ],
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/operator-linebreak': [
        'error',
        'after',
        {
          overrides: {
            '?': 'before',
            ':': 'before'
          }
        }
      ],
      '@stylistic/padded-blocks': [
        'error',
        {
          classes: 'always'
        }
      ],
      '@stylistic/no-multi-spaces': 'off',
      '@stylistic/semi': [
        'error',
        'always'
      ],
      '@stylistic/type-annotation-spacing': 'error',
      'arrow-body-style': [
        'off',
        'as-needed'
      ],
      'arrow-parens': [
        'error',
        'always'
      ],
      'complexity': 'off',
      'constructor-super': 'error',
      'curly': 'error',
      'dot-notation': 'off',
      'eol-last': 'error',
      'eqeqeq': [
        'error',
        'smart'
      ],
      'guard-for-in': 'error',
      'id-denylist': [
        'error',
        'any',
        'boolean',
        'Boolean',
        'number',
        'Number',
        'string',
        'String',
        'undefined',
        'Undefined'
      ],
      'id-match': 'error',
      'max-classes-per-file': 'off',
      'new-parens': 'error',
      'no-bitwise': 'off',
      'no-caller': 'error',
      'no-cond-assign': 'error',
      'no-console': [
        'error',
        {
          allow: [
            'assert',
            'clear',
            'Console',
            'context',
            'count',
            'countReset',
            'dir',
            'dirxml',
            'error',
            'group',
            'groupCollapsed',
            'groupEnd',
            'log',
            'profile',
            'profileEnd',
            'table',
            'timeLog',
            'timeStamp',
            'warn'
          ]
        }
      ],
      'no-debugger': 'warn',
      'no-empty': 'warn',
      'no-empty-function': [
        'warn',
        {
          allow: [
            'arrowFunctions',
            'constructors'
          ]
        }
      ],
      'no-eval': 'error',
      'no-fallthrough': 'error',
      'no-invalid-this': 'warn',
      'no-multiple-empty-lines': 'warn',
      'no-new-wrappers': 'error',
      'no-restricted-imports': 'error',
      'no-shadow': 'off',
      'no-trailing-spaces': 'warn',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-underscore-dangle': 'off',
      'no-use-before-define': 'off',
      'no-unsafe-finally': 'error',
      'no-unused-expressions': 'off',
      'no-unused-labels': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'one-var': [
        'off',
        'never'
      ],
      'prefer-const': 'error',
      'quotes': [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: true
        }
      ],
      'quote-props': [
        'error',
        'as-needed'
      ],
      'no-case-declarations': 'warn',
      'prefer-arrow-callback': 'warn',
      'radix': 'error',
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'never',
          asyncArrow: 'always',
          named: 'never'
        }
      ],
      'spaced-comment': [
        'warn',
        'always',
        {
          markers: [
            '/'
          ]
        }
      ],
      'sort-imports': [
        'warn',
        {
          'ignoreCase': false,
          'ignoreDeclarationSort': true,
          'ignoreMemberSort': false,
          'memberSyntaxSortOrder': [
            'none',
            'single',
            'multiple',
            'all'
          ]
        }
      ],
      'use-isnan': 'error',
      'valid-typeof': 'off'
    }
  },
  {
    files: ['src/**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/no-autofocus': 'warn',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error'
    }
  }
);
