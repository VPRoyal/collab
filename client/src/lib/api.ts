import axios, { AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/config/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10 sec
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error);
    return Promise.reject(
      error.response?.data?.error || error.message || "Unknown error"
    );
  }
);

export default client;
