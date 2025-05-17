import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ||
    //  "http://localhost:8000/api/v1", // Default to localhost for local development
    "https://leetsight-server-361581772158.asia-south1.run.app/api/v1", // Your FastAPI base URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get the session which contains the idToken
    const session = await getSession(); // This gets the client-side session

    // console.log("Session in API client:", session);

    if (session?.idToken) {
      // console.log("Adding ID token to request headers");
      config.headers.Authorization = `Bearer ${session.idToken}`;
    } else if (config.url?.includes("/public-endpoint")) {
      // Example: don't add auth for specific public paths
      // No token needed for this public endpoint
    } else {
      // Handle cases where token is missing for a protected route
      // This could be by canceling the request, redirecting to login, or letting it fail.
      // For now, we'll let it proceed without a token, and the backend will reject if it's protected.
      console.warn(
        "No ID token found in session for API request to:",
        config.url
      );
    }
    return config;
  },
  (error: AxiosError) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  async (error: AxiosError) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.warn(
        "Received 401 from FastAPI, attempting to sign out and redirect."
      );
      // You might want to clear local state before redirecting
      // Option 1: Programmatic sign out (if on client side)
      // import { signOut } from "next-auth/react";
      // signOut({ callbackUrl: '/signin' });
      // Option 2: Or just redirect, middleware will catch it if session is truly gone
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
