import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-legal-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al menú
          </Link>
          <span className="font-display font-black tracking-tight">
            ADICTO<span className="text-primary">KEBAB</span>
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Última actualización: {updated}
        </p>
        <div className="space-y-6 text-sm leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </main>
    </div>
  );
}
