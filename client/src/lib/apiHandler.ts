// lib/apiHandler.ts
import type { AxiosResponse } from "axios";

interface ApiError {
  statusCode: number;
  message: string;
  details?: unknown;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
}

export async function handleApiResponse<T>(
  request: Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> {
  try {
    const res = await request;
    const payload = res.data;

    if (!payload.success) {
      // Backend controlled error
      const msg = payload.error?.message || "API request failed";
      throw new Error(msg);
    }

    // Success response
    if (res.status === 204) {
      // No Content
      return null as unknown as T;
    }

    if (!payload.data) {
      throw new Error("No data returned from API");
    }

    return payload.data;
  } catch (error: any) {
    if (error.response) {
      // server error with payload
      const errPayload: ApiResponse<any> = error.response.data;
      const msg =
        errPayload?.error?.message ||
        error.message ||
        `Request failed with status ${error.response.status}`;
      throw new Error(msg);
    } else if (error.request) {
      // no response
      throw new Error("No response from server. Please check your network.");
    } else {
      // unexpected error
      throw new Error(error.message || "Unexpected API error");
    }
  }
}