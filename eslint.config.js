import angular from '@angular-eslint/eslint-plugin';
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import angularEslint from 'angular-eslint';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.angular/**',
      '**/out-tsc/**',
      'eslint.config.js'
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  ...angularEslint.configs.tsRecommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        type: 'module'
      }
    },
    processor: angularEslint.processInlineTemplates,
    plugins: {
      '@angular-eslint': angular,
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
        }
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
      // '@angular-eslint/no-conflicting-lifecycle': 'error',
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
            'classProperty',
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
          selector: 'method',
          format: [
            'PascalCase'
          ],
          modifiers: [
            'static'
          ]
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
          selector: 'enumMember',
          format: [
            'PascalCase'
          ]
        }
      ],
      '@typescript-eslint/no-empty-function': 'off',
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
      '@typescript-eslint/no-require-imports': 'warn',
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
      '@stylistic/arrow-parens': [
        'error',
        'always'
      ],
      '@stylistic/block-spacing': 'off',
      '@stylistic/brace-style': [
        'error',
        '1tbs'
      ],
      '@stylistic/comma-dangle': [
        'error',
        'never'
      ],
      '@stylistic/eol-last': 'error',
      '@stylistic/generator-star-spacing': [
        'warn',
        {
          after: false,
          before: true
        }
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
      '@stylistic/new-parens': 'error',
      '@stylistic/no-multi-spaces': 'off',
      '@stylistic/no-multiple-empty-lines': 'warn',
      '@stylistic/no-trailing-spaces': 'warn',
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
      '@stylistic/quote-props': [
        'error',
        'as-needed'
      ],
      '@stylistic/quotes': [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: 'always'
        }
      ],
      '@stylistic/semi': [
        'error',
        'always'
      ],
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'never',
          asyncArrow: 'always',
          named: 'never'
        }
      ],
      '@stylistic/spaced-comment': [
        'warn',
        'always',
        {
          markers: [
            '/'
          ]
        }
      ],
      '@stylistic/type-annotation-spacing': 'error',
      'arrow-body-style': [
        'off',
        'as-needed'
      ],
      'complexity': 'off',
      'constructor-super': 'error',
      'curly': 'error',
      'dot-notation': 'off',
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
      'no-new-wrappers': 'error',
      'no-restricted-imports': 'error',
      'no-shadow': 'off',
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
      'no-case-declarations': 'warn',
      'prefer-arrow-callback': 'warn',
      'radix': 'error',
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
  ...angularEslint.configs.templateRecommended.map((config) => ({...config, files: ['src/**/*.html']})),
  ...angularEslint.configs.templateAccessibility.map((config) => ({...config, files: ['src/**/*.html']})),
  {
    files: ['src/**/*.html'],
    rules: {
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/no-autofocus': 'warn',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error'
    }
  }
]);
