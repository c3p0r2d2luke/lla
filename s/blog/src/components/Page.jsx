import StoryblokRenderer from "./StoryblokRenderer";

export default function Page({ blok }) {
  const body = Array.isArray(blok?.body) ? blok.body : [];

  const orderedBody = [...body].sort((a, b) => {
    if (a.component === "blog" && b.component === "blog") {
      return body.indexOf(b) - body.indexOf(a);
    }

    return body.indexOf(a) - body.indexOf(b);
  });

  return (
    <main>
      {orderedBody.map((child) => (
        <StoryblokRenderer key={child._uid} blok={child} />
      ))}
    </main>
  );
}
