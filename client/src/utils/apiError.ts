import axios from "axios";

interface ErrorBody {
  error?: string;
  message?: string;
}

export function getApiError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ErrorBody>(error)) return fallback;

  if (!error.response) {
    return "We couldn't reach the kitchen. Check your connection and try again.";
  }

  return error.response.data?.error || error.response.data?.message || fallback;
}
