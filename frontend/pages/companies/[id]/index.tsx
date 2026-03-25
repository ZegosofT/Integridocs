import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Définir le type pour Client
interface Client {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  contact: string;
}

const CompanyDetails = () => {
  const [clients, setClients] = useState<Client[]>([]); // Appliquer le type Client à useState
  const router = useRouter();
  const { id } = router.query; // Récupère l'ID de l'entreprise depuis l'URL

  useEffect(() => {
    if (id) {
      fetch(`http://4.251.143.40:8000/companies/${id}/clients`)  // Récupère les clients de l'entreprise
        .then((response) => response.json())
        .then((data) => setClients(data))
        .catch((error) => console.error('Error fetching clients:', error));
    }
  }, [id]);

  return (
    <div>
      <h1>Clients de l'entreprise {id}</h1>
      <ul>
        {clients.map((client) => (
          <li key={client.id}>
            <a href={`/clients/${client.id}`}>{client.nom}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CompanyDetails;