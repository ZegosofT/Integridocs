// pages/api/clients/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const cookies = req.headers.cookie || "";

  try {
    if (req.method === "GET") {
      const upstream = await fetch(`${API}/clients/${id}`, {
        headers: { Cookie: cookies },
      });
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    if (req.method === "PUT") {
      const upstream = await fetch(`${API}/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: cookies },
        body: JSON.stringify(req.body),
      });
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    if (req.method === "DELETE") {
      const upstream = await fetch(`${API}/clients/${id}`, {
        method: "DELETE",
        headers: { Cookie: cookies },
      });
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    res.status(405).end();
  } catch {
    res.status(502).json({ detail: "Erreur de connexion au serveur" });
  }
}
