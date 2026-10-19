export default function Author({ blok }) {
  return (
    <div className="author">
      {blok.avatar?.filename && (
        <img
          src={blok.avatar.filename}
          alt={blok.name || "Author"}
          className="author-avatar"
        />
      )}

      <div>
        <span>Written by </span>
        <strong>{blok.name}</strong>
      </div>
    </div>
  );
}
