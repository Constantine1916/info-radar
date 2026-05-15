import axios from 'axios';

export function summarizeAxiosError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error;
  }

  return {
    message: error.message,
    status: error.response?.status,
    response: error.response?.data,
  };
}
