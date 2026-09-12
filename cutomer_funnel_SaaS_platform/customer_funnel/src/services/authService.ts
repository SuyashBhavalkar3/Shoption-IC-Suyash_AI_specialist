const API_BASE = import.meta.env.VITE_API_BASE_URL;
console.log("AUTH SERVICE LOADED");
export async function login(
  email: string,
  password: string
)
 {
  const response = await fetch(
    `${API_BASE}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}

export async function getCurrentUser(
  token: string
) {
  const response = await fetch(
    `${API_BASE}/api/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load user");
  }

  return response.json();
}