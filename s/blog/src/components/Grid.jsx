import StoryblokRenderer from './StoryblokRenderer';

export default function Grid({ blok }) {
  return (
    <section className="grid">
      {blok.columns?.map((child) => (
        <StoryblokRenderer key={child._uid} blok={child} />
      ))}
    </section>
  );
}
