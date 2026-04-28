"use client";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-gray-900 p-6 rounded w-80">
        <h2 className="text-red-600 text-xl mb-4">Login</h2>

        <input
          className="w-full p-2 mb-4 bg-black border"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className="w-full bg-red-600 py-2 rounded">
          Continue
        </button>
      </div>
    </div>
  );
}