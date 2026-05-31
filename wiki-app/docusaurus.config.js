/** @type {import('@docusaurus/types').Config} */

// GitHub Pages project site: https://<org>.github.io/<repo>/
// Override via env in CI (see .github/workflows/wiki-build.yml).
const organizationName = process.env.GITHUB_ORG ?? 'navidfalah';
const projectName = process.env.GITHUB_REPO ?? 'wiki';
const deploymentBranch = 'gh-pages';
const githubPagesUrl = `https://${organizationName}.github.io`;
const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true';

const config = {
  title: 'Aurora Labs Wiki',
  tagline: 'LLM-compiled personal knowledge base',
  favicon: 'img/favicon.ico',

  url: githubPagesUrl,
  baseUrl: isGitHubPagesBuild ? `/${projectName}/` : '/',
  trailingSlash: false,

  organizationName,
  projectName,
  deploymentBranch,

  customFields: {
    wikiApiUrl: process.env.WIKI_API_URL || 'http://localhost:8000',
  },

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Compiler writes linked Markdown + frontmatter here (compiler/linker.py)
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.js',
          editUrl: undefined,
          showLastUpdateAuthor: false,
          showLastUpdateTime: false,
          // Treat compiler output as docs; index.md is the entry catalog
          breadcrumbs: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [require.resolve('./plugins/backlinksPlugin')],

  markdown: {
    // Compiler-generated pages may contain `<` from junk data; hooks warn on bad links
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Aurora Labs Wiki',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'wikiSidebar',
            position: 'left',
            label: 'Wiki',
          },
          {
            to: '/graph',
            label: 'Graph',
            position: 'left',
          },
          {
            to: '/knowledge-graph',
            label: 'Knowledge Graph',
            position: 'left',
          },
          {
            to: '/workspace',
            label: 'Dashboard',
            position: 'left',
          },
          {
            to: '/analytics',
            label: 'Analytics',
            position: 'left',
          },
          {
            href: 'https://github.com/karpathy/442a6bf555914893e9891c11519de94f',
            label: 'LLM Wiki pattern',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `LLM Wiki — compiled ${new Date().getFullYear()}`,
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
    }),
};

module.exports = config;
