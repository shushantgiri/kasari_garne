/**
 * The header of a tool page, matching the photo tool: a soft mesh background, a two-part title with the
 * second part in the red gradient, and one line under it.
 */
export function ToolHero({ first, second, text }: { first: string; second: string; text: string }) {
  return (
    <section className="mesh-bg grain overflow-hidden border-b border-paper-line">
      <div className="container-page py-10 text-center sm:py-12">
        <h1 className="animate-rise text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]">
          {first}{" "}
          {/* The vertical padding keeps Devanagari marks inside the gradient's clip. */}
          <span className="block bg-gradient-to-r from-[#D63A44] to-brand-dark bg-clip-text py-[0.12em] text-transparent">{second}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md animate-rise text-balance text-ink-soft [animation-delay:60ms] sm:text-lg">{text}</p>
      </div>
    </section>
  );
}
