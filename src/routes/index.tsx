import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/solace-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Solace · A gentle space to talk it out" },
      {
        name: "description",
        content:
          "Solace is an AI companion for emotional support and practical guidance. Warm, private, available whenever you need to think things through.",
      },
      { property: "og:title", content: "Solace · A gentle space to talk it out" },
      {
        property: "og:description",
        content: "An AI companion for emotional support and practical guidance.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-accent/40">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="" width={36} height={36} />
          <span className="font-serif text-xl tracking-tight">Solace</span>
        </Link>
        <Link to="/auth">
          <Button variant="ghost" className="rounded-full">Sign in</Button>
        </Link>
      </nav>

      <section className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-24 text-center">
        <img
          src={logo}
          alt="Solace logo"
          width={120}
          height={120}
          className="mx-auto mb-8 opacity-90"
        />
        <h1 className="text-5xl md:text-6xl font-serif tracking-tight leading-[1.05]">
          A quiet place to <br />
          <span className="italic text-primary">talk it through.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Solace listens without judgement, helps you understand what you're feeling,
          and offers gentle, practical next steps — whenever you need to be heard.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20">
              Start a conversation
            </Button>
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { t: "Heard, first", d: "Every reply starts from what you actually said — not a script." },
            { t: "Warm + practical", d: "Validation when you need to vent. Steps when you're ready to act." },
            { t: "Private threads", d: "Each conversation is its own space, saved only for you." },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-2xl border border-border bg-card/70 backdrop-blur p-5"
            >
              <h3 className="font-medium mb-1">{c.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
