import type { AppProps } from "next/app";
import "../styles/globals.css";
import Link from "next/link";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/logs" className="navbar-link navbar-link-logs">
            📋 Logs
          </Link>
          <span className="navbar-sep">|</span>
          <Link href="/" className="navbar-link">
            🏠 Accueil
          </Link>
          <span className="navbar-sep">|</span>
          <Link href="/clients/nouveau" className="navbar-link navbar-link-add">
            + Nouveau client
          </Link>
        </div>
      </nav>
      <div className="page-wrapper">
        <Component {...pageProps} />
      </div>
    </>
  );
}
