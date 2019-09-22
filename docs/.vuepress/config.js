const sidebar = require("./sidebar");

module.exports = {
  title: "Gavel Docs",
  head: [
    ['link', {rel: 'icon', href: '/favicon.png'}]
  ],
  description: "Guides to using Asterisk's fork of Gavel",
  plugins: [
    'vuepress-plugin-dehydrate',
    'vuepress-plugin-sitemap',
    'vuepress-plugin-medium-zoom', {
      selector: '.zoomable',
      delay: 1000,
      options: {
        margin: 24,
        background: '#BADA55',
        scrollOffset: 0
      },
    },
  ],
  plugins: {
    'vuepress-plugin-clean-urls': {
      normalSuffix: '/',
      indexSuffix: '/'
    },
  },
  ga: 'UA-108513187-1',
  themeConfig: {
    repo: "https://github.com/weareasterisk/gavel",
    editLinks: true,
    editLinkText: 'Edit this page',
    lastUpdated: 'Last updated',
    docsDir: 'docs',
    yuu: {
			colorThemes: ['blue'],
    },
    sidebar: sidebar,
    nav: [
      {
        text: 'Home',
        link: '/'
      },
      {
        text: 'Deploy',
        link: '/deploy/'
      },
      {
        text: 'Contact',
        items: [
          {
            text: 'Twitter',
            link: 'https://twitter.com/helloasterisk'
          },
          {
            text: 'Email',
            link: 'mailto:muhammad@weareasterisk.com'
          }
        ]
      }
    ]
  }
}
