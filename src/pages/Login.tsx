import { useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isRegister, setIsRegister] = useState(false);

const handleSubmit = async () => {
  const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Error");
    return;
  }

  // SI ES REGISTRO
  if (isRegister) {
    alert("Cuenta creada correctamente");
    setIsRegister(false);
    return;
  }

  // FIX SAFARI SOLO EN LOGIN
  await fetch("/api/auth/me", {
  credentials: "include",
  cache: "no-store",
});

  if (data.role === "admin") {
    window.location.href = "/admin";
  } else {
    window.location.href = "/";
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card p-6 rounded-xl border w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center mb-4">
  <a href="/" className="text-sm text-muted-foreground">
    ← Volver
  </a>
</div>
        <h1 className="text-xl font-bold text-center">
          {isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </h1>

        <input
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-white py-2 rounded"
        >
          {isRegister ? "Crear cuenta" : "Entrar"}
        </button>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm text-muted-foreground w-full"
        >
          {isRegister
            ? "¿Ya tienes cuenta? Inicia sesión"
            : "¿No tienes cuenta? Crear cuenta"}
        </button>
      </div>
    </div>
  );
}