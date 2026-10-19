import Page from './Page';
import Teaser from './Teaser';
import Grid from './Grid';
import Feature from './Feature';
import Author from './Author';
import Blog from './Blog';

const components = {
  page: Page,
  teaser: Teaser,
  grid: Grid,
  feature: Feature,
  author: Author,
  blog: Blog,
};

export default function StoryblokRenderer({ blok }) {
  if (!blok) return null;

  const Component = components[blok.component];

  if (!Component) {
    console.warn(`Unknown Storyblok component: ${blok.component}`);
    return null;
  }

  return <Component blok={blok} />;
}
