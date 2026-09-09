import { useState } from "react";
import { defaultRoleDefinitions, roles, type Role } from "../accessControl";

interface LoginPageProps {
  onSignIn: (role: Role) => void;
}

export function LoginPage({ onSignIn }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = (event: React.FormEvent) => {
    event.preventDefault();
    onSignIn(selectedRole);
  };

  return (
    <main className="min-h-screen bg-[#e71b18] p-4 sm:p-8 lg:p-12 flex items-center justify-center">
      <section className="w-full max-w-5xl min-h-[640px] grid overflow-hidden bg-white shadow-2xl lg:grid-cols-[1fr_1.08fr]">
        <div className="hidden lg:flex bg-[#e71b18] p-12 flex-col justify-end text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">Migration Utility</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Secure document migration, with the right access at every step.</h1>
        </div>

        <div className="flex items-center justify-center px-6 py-12 sm:px-12">
          <form onSubmit={signIn} className="w-full max-w-sm">
            <p className="text-4xl font-semibold text-[#e71b18]">Johnson&amp;Johnson</p>
            <h2 className="mt-10 text-2xl font-semibold text-gray-900">Sign in</h2>
            <p className="mt-2 text-sm text-gray-600">Access the migration workspace with your assigned role.</p>

            <button
              type="button"
              onClick={() => onSignIn(selectedRole)}
              className="mt-7 w-full rounded-md bg-[#414141] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#282828]"
            >
              Sign in via SSO
            </button>

            <div className="my-7 flex items-center gap-4 text-xs text-gray-500 before:h-px before:flex-1 before:bg-gray-200 after:h-px after:flex-1 after:bg-gray-200">or</div>

            <label className="block text-sm font-medium text-gray-700" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-1.5 w-full rounded-md border border-gray-400 px-3 py-2.5 text-sm focus:border-[#e71b18] focus:outline-none focus:ring-1 focus:ring-[#e71b18]" />

            <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="mt-1.5 w-full rounded-md border border-gray-400 px-3 py-2.5 text-sm focus:border-[#e71b18] focus:outline-none focus:ring-1 focus:ring-[#e71b18]" />

            <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="role">Sign in as</label>
            <select id="role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as Role)} className="mt-1.5 w-full rounded-md border border-gray-400 bg-white px-3 py-2.5 text-sm focus:border-[#e71b18] focus:outline-none focus:ring-1 focus:ring-[#e71b18]">
              {roles.map((role) => <option key={role} value={role}>{defaultRoleDefinitions[role].label}</option>)}
            </select>

            <button type="submit" className="mt-7 w-full rounded-md bg-[#414141] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#282828]">Sign in</button>
          </form>
        </div>
      </section>
    </main>
  );
}