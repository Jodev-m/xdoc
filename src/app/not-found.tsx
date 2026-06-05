import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
        <span className="text-2xl font-bold">404</span>
      </div>
      <h1 className="text-xl font-bold mb-2">Page introuvable</h1>
      <p className="text-neutral-500 mb-8 max-w-sm">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
