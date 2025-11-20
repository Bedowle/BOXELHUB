"use client";

import { useEffect, useState } from "react";

export default function MakerRegisterForm() {
  const [form, setForm] = useState({
    nombre: "",
    apellido1: "",
    apellido2: "",
    usuario: "",
    email: "",
    ubicacion: "",
    privacidad: false,
  });

  const [usuarioDisponible, setUsuarioDisponible] = useState<null | boolean>(null);
  const [emailDisponible, setEmailDisponible] = useState<null | boolean>(null);

  // Manejo de cambios en inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // Comprobación de disponibilidad de usuario
  useEffect(() => {
    const value = form.usuario.trim();
    if (value.length < 3) {
      setUsuarioDisponible(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-username?usuario=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return setUsuarioDisponible(null);
        const data = await res.json();
        setUsuarioDisponible(Boolean(data.available));
      } catch {
        setUsuarioDisponible(null);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [form.usuario]);

  // Comprobación de disponibilidad de email
  useEffect(() => {
    const value = form.email.trim();
    if (!value.includes("@") || value.length < 5) {
      setEmailDisponible(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-email?email=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return setEmailDisponible(null);
        const data = await res.json();
        setEmailDisponible(Boolean(data.available));
      } catch {
        setEmailDisponible(null);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [form.email]);

  // Envío del formulario
  const handleSubmit = () => {
    if (!form.privacidad) {
      alert("Debes aceptar la política de privacidad");
      return;
    }
    alert("Datos enviados (pendiente de backend)");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8FFE6] via-[#AEFFA3] to-[#46FF2E] flex flex-col items-center">
      {/* Header */}
      <header className="w-full flex flex-col shadow-lg bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-8 py-5">
          <a href="/" className="flex items-center space-x-2">
            <span className="text-3xl font-extrabold text-[#B1BF30] drop-shadow-lg tracking-wide">
              Voxelhub
            </span>
          </a>
          <div className="flex-1 mx-8">
            <input
              type="text"
              placeholder="🔍 Buscar modelos..."
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-[#B1BF30] text-gray-800 placeholder-gray-600"
            />
          </div>
        </div>
      </header>

      {/* Formulario */}
      <main className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-10 mt-10">
        <h1 className="text-3xl font-extrabold text-[#B1BF30] drop-shadow-lg mb-8 text-center">
          Completa tus datos
        </h1>

        <div className="space-y-4">
          <input
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#B1BF30] text-gray-800 placeholder-gray-600"
          />
          <input
            name="apellido1"
            placeholder="Primer apellido"
            value={form.apellido1}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#B1BF30] text-gray-800 placeholder-gray-600"
          />
          <input
            name="apellido2"
            placeholder="Segundo apellido (opcional)"
            value={form.apellido2}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#B1BF30] text-gray-800 placeholder-gray-600"
          />

          {/* Usuario con feedback */}
          <div>
            <input
              name="usuario"
              placeholder="Nombre de usuario"
              value={form.usuario}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#B1BF30] text-gray-800 placeholder-gray-600"
            />
            {usuarioDisponible === true && (
              <p className="text-green-700 text-sm mt-1">✅ Nombre de usuario disponible</p>
            )}
            {usuarioDisponible === false && (
              <p className="text-red-700 text-sm mt-1">❌ Nombre de usuario ya en uso</p>
            )}
          </div>

          {/* Email con feedback */}
          <div>
            <input
              name="email"
              type="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#B1BF30] text-gray-800 placeholder-gray-600"
            />
            {emailDisponible === true && (
              <p className="text-green-700 text-sm mt-1">✅ Correo electrónico disponible</p>
            )}
            {emailDisponible === false && (
              <p className="text-red-700 text-sm mt-1">❌ Correo electrónico ya registrado</p>
            )}
          </div>

          <input
            name="ubicacion"
            placeholder="Ubicación aproximada"
            value={form.ubicacion}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#B1BF30] text-gray-800 placeholder-gray-600"
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="privacidad"
              checked={form.privacidad}
              onChange={handleChange}
            />
            <span className="text-gray-800">
              Acepto la{" "}
              <a href="/politica-privacidad" className="text-[#B1BF30] font-semibold hover:underline">
                política de privacidad
              </a>
            </span>
          </label>

          <button
            onClick={handleSubmit}
            className="w-full px-6 py-3 rounded-full bg-[#B1BF30] text-white font-semibold hover:bg-[#97FF8A] transition transform hover:scale-105 shadow-lg"
          >
            Registrarse
          </button>
        </div>

        {/* Opciones de login social */}
        <div className="mt-8 space-y-4">
          <button className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-400 transition transform hover:scale-105 shadow-lg">
            <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
            <span>Iniciar sesión con Google</span>
          </button>
          <button className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-500 transition transform hover:scale-105 shadow-lg">
            <img src="/icons/facebook.svg" alt="Facebook" className="w-5 h-5" />
            <span>Iniciar sesión con Facebook</span>
          </button>
          <button className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition transform hover:scale-105 shadow-lg">
            <img src="/icons/apple.svg" alt="Apple" className="w-5 h-5" />
            <span>Iniciar sesión con Apple</span>
          </button>
        </div>
      </main>
    </div>
  );
}