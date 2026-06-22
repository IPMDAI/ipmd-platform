import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="flex min-h-[60vh] items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-black/50">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-ipmd-red border-t-transparent" />
          <p className="text-sm font-medium">Chargement…</p>
        </div>
      </Container>
    </section>
  );
}
