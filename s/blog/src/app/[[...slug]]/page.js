import StoryblokRenderer from '@/components/StoryblokRenderer';

export default async function StoryPage({ params }) {
  const { slug } = await params;
  const fullSlug = slug?.join('/') || 'home';
  const token = process.env.STORYBLOK_DELIVERY_API_TOKEN;

  const response = await fetch(
    `https://api.storyblok.com/v2/cdn/stories/${fullSlug}?version=draft&token=${encodeURIComponent(token)}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Storyblok request failed: ${response.status}`);
  }

  const { story } = await response.json();

  return <StoryblokRenderer blok={story.content} />;
}
