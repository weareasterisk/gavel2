const purgecss = require('@fullhuman/postcss-purgecss')
const cssnano = require('cssnano')

const isProd = process.env.NODE_ENV === "production"

module.exports = {
  modules: true,
  syntax: 'postcss-scss',
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer')(),
    require('postcss-url'),
    require('postcss-nested'),
    require('postcss-preset-env')({
      features: {
          'nesting-rules': true
      },
      browsers: [
          '> 1%',
          'last 2 versions',
          'Firefox ESR',
      ]
    }),

    isProd 
    ? cssnano({preset: 'default'}) 
    : null,

    isProd
    ? purgecss({
      content: ['./gavel/**/*.html', './gavel/**/*.js'],
      defaultExtractor: content => content.match(/[\w-/:%.]+(?<!:)/g) || []
    }) : null
  ],
};