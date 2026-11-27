export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="backdrop__glow backdrop__glow--one" />
      <div className="backdrop__glow backdrop__glow--two" />
      <div className="backdrop__grid" />
      <div className="backdrop__vignette" />
      <div className="backdrop__grain" />
    </div>
  );
}
