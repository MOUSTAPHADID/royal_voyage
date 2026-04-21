import axios from "axios";
import { ENV } from "./_core/env";

export const esimGoApi = axios.create({
  baseURL: ENV.esimGoBaseUrl || "https://api.esim-go.com/v2.4",
  headers: {
    "X-API-Key": ENV.esimGoApiKey,
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
