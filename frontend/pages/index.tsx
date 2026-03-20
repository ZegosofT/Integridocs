import { useEffect, useState } from "react";
import Link from "next/link";

interface Entreprise {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  contact: string;
}

interface Client {
  id: number;
  nom: string;
  entreprise: string;
  entreprise_id: number;
}

const Home = () => {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<number[]>([]);

  useEffect(() => {
    fetch("http://4.251.143.40:8000/entreprises")
      .then((res) => res.json())
      .then((data) => setEntreprises(data))
      .catch((err) => console.error(err));

    fetch("http://4.251.143.40:8000/clients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch((err) => console.error(err));
  }, []);

  const filteredEntreprises = entreprises.filter((e) =>
    e.nom.toLowerCase().includes(search.toLowerCase())
  );

  const autoOpen = search.trim().length > 0;

  const toggleEntreprise = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isOpen = (id: number) => autoOpen || openIds.includes(id);

  const getClientsForEntreprise = (entrepriseId: number) =>
    clients.filter((c) => c.entreprise_id === entrepriseId);

  return (
    <div className="accueil-page">

      <div className="accueil-hero">
        <h1 className="accueil-titre">INTEGRIDOCS</h1>
        <p className="accueil-description">
          Plateforme de gestion centralisée des clients et infrastructures IT — Integritech SAS
        </p>
        <Link href="/clients" className="accueil-lien-clients">
          👥 Voir tous les clients →
        </Link>
      </div>

      <div className="accueil-recherche">
        <input
          type="text"
          className="recherche-input"
          placeholder="🔍  Rechercher une entreprise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="entreprises-liste">
        {filteredEntreprises.length === 0 && (
          <p className="liste-vide">Aucune entreprise trouvée pour &quot;{search}&quot;</p>
        )}

        {filteredEntreprises.map((entreprise) => {
          const clientsDeLEntreprise = getClientsForEntreprise(entreprise.id);
          const ouvert = isOpen(entreprise.id);

          return (
            <div key={entreprise.id} className="entreprise-bloc">
              <div
                className={`entreprise-header ${ouvert ? "entreprise-header-open" : ""}`}
                onClick={() => toggleEntreprise(entreprise.id)}
              >
                <span className="entreprise-chevron">{ouvert ? "▾" : "▸"}</span>
                <span className="entreprise-nom">{entreprise.nom}</span>
                <span className="entreprise-count">
                  {clientsDeLEntreprise.length} client{clientsDeLEntreprise.length > 1 ? "s" : ""}
                </span>
              </div>

              {ouvert && (
                <div className="clients-dropdown">
                  {clientsDeLEntreprise.length === 0 ? (
                    <p className="liste-vide">Aucun client pour cette entreprise</p>
                  ) : (
                    clientsDeLEntreprise.map((client) => (
                      <Link key={client.id} href={`/clients/${client.id}`} className="client-ligne">
                        <span className="client-ligne-nom">{client.nom}</span>
                        <span className="client-ligne-arrow">→</span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
