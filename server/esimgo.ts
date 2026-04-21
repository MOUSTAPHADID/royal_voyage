
import axios from "axios";

export const esimGoApi = axios.create({
  baseURL: process.env.ESIMGO_BASE_URL || "https://api.esim-go.com/v2.5",
  headers: {
    "X-API-Key": process.env.ESIMGO_API_KEY || "",
    "Content-Type": "application/json",
  },
});

export async function getEsimCatalogue() {
  const response = await esimGoApi.get("/catalogue");
  return response.data;
}

export async function createEsimGoOrder(payload: any) {
  const response = await esimGoApi.post("/orders", payload);
  return response.data;
}

export async function getEsimDetails(iccid: string) {
  const response = await esimGoApi.get(`/esims/${iccid}`);
  return response.data;
}
