import { render } from "storyblok-rich-text-react-renderer";
import Author from "./Author";

export default function Blog({ blok }) {
  return (
    <article className="blog">
      <h1>{blok.title}</h1>

      <div className="blog-author">
        {blok.author?.map((author) => (
          <Author key={author._uid} blok={author} />
        ))}
      </div>

      <div className="blog-body">
        {blok.body && render(blok.body)}
      </div>
    </article>
  );
}
