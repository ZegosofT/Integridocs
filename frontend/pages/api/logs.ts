// pages/api/logs.ts
import type { NextApiRequest, NextApiResponse } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { page, limit } = req.query;
  const qs = new URLSearchParams();
  if (page)  qs.set("page",  String(page));
  if (limit) qs.set("limit", String(limit));

  try {
    const upstream = await fetch(`${API}/logs?${qs.toString()}`, {
      headers: { Cookie: req.headers.cookie || "" },
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch {
    res.status(502).json({ detail: "Erreur de connexion au serveur" });
  }
}
