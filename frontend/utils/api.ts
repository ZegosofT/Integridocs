// frontend/utils/api.ts
export const fetchCompanies = async () => {
  const response = await fetch('http://localhost:8000/companies');
  return response.json();
};