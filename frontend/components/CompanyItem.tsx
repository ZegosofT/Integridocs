// frontend/components/CompanyItem.tsx
export default function CompanyItem({ company }) {
  return (
    <li>
      <a href={`/companies/${company.id}`}>{company.name}</a>
    </li>
  );
}

// frontend/components/ClientItem.tsx
export default function ClientItem({ client }) {
  return (
    <div>
      <h2>{client.name}</h2>
      <p>{client.address}</p>
    </div>
  );
}