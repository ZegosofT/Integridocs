import { useEffect, useState } from 'react';
import Link from 'next/link';

// Définir le type pour Entreprise
interface Entreprise {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  contact: string;
}

const Companies = () => {
  const [companies, setCompanies] = useState<Entreprise[]>([]); // Appliquer le type Entreprise à useState
  const [search, setSearch] = useState(''); // Etat pour le champ de recherche

  useEffect(() => {
    // Récupérer la liste des entreprises
    fetch('http://4.251.143.40:8000/entreprises')
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch((err) => console.error('Error fetching companies:', err));
  }, []);

  // Filtrer les entreprises en fonction du champ de recherche
  const filteredCompanies = companies.filter((company) =>
    company.nom.toLowerCase().includes(search.toLowerCase()) // Recherche insensible à la casse
  );

  return (
    <div>
      <h1>Liste des entreprises</h1>
      
      {/* Champ de recherche */}
      <input
        type="text"
        placeholder="Rechercher une entreprise"
        value={search}
        onChange={(e) => setSearch(e.target.value)} // Met à jour la valeur de la recherche
        style={{ marginBottom: '20px', padding: '8px', width: '300px' }} // Style basique pour le champ de recherche
      />
      
      {/* Liste des entreprises filtrées */}
      <ul>
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <li key={company.id}>
              {/* Lien vers la page de détails de l'entreprise */}
              <Link href={`/companies/${company.id}`}>{company.nom}</Link>
            </li>
          ))
        ) : (
          <li>Aucune entreprise trouvée</li>
        )}
      </ul>
    </div>
  );
};

export default Companies;