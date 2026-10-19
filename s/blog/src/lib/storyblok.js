import { storyblokInit } from '@storyblok/react/rsc';
import PageComponent from '@/components/Page';
import Teaser from '@/components/Teaser';
import Grid from '@/components/Grid';
import Feature from '@/components/Feature';

export const getStoryblokApi = storyblokInit({
  accessToken: 'unused',
  components: {
    page: PageComponent,
    teaser: Teaser,
    grid: Grid,
    feature: Feature,
  },
});
