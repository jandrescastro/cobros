import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center bg-app-gradient px-4 py-8 text-ink">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 text-center shadow-soft">
        <h1 className="font-display text-3xl font-extrabold uppercase">No encontrado</h1>
        <p className="mt-3 text-sm leading-6 text-slate">La vista que buscas no existe o no esta disponible para este perfil.</p>
        <Link href="/" className="mt-5 inline-flex w-full justify-center rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
