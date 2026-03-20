import type { AppProps } from "next/app";
import "../styles/globals.css";
import Link from "next/link";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <>
      {/* ════════════════════════════════════════
          NAVBAR – pour changer la position/taille,
          modifie les variables dans globals.css
          sous la section "NAVBAR"
      ════════════════════════════════════════ */}
      <nav className="navbar">
        <div className="navbar-inner">

          {/* Bouton retour arrière */}
          <button className="navbar-btn" onClick={() => router.back()}>
            ← Retour
          </button>

          {/* Séparateur */}
          <span className="navbar-sep">|</span>

          {/* Lien accueil */}
          <Link href="/" className="navbar-link">
            🏠 Accueil
          </Link>

          {/* Lien tous les clients */}
          <Link href="/clients" className="navbar-link">
            👥 Clients
          </Link>

        </div>
      </nav>

      {/* Contenu de la page – le padding-top évite que la navbar cache le contenu */}
      <div className="page-wrapper">
        <Component {...pageProps} />
      </div>
    </>
  );
}
