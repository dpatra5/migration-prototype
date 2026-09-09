import { useEffect, useState } from "react";
import { defaultRoleDefinitions, type AccessControlConfig, type Role } from "./accessControl";
import { Dashboard } from "./components/Dashboard";
import { LoginPage } from "./components/LoginPage";

function App() {
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [accessConfig, setAccessConfig] = useState<AccessControlConfig>(() => {
    const savedConfig = window.localStorage.getItem("migration-access-control");
    return savedConfig ? JSON.parse(savedConfig) as AccessControlConfig : defaultRoleDefinitions;
  });

  useEffect(() => {
    window.localStorage.setItem("migration-access-control", JSON.stringify(accessConfig));
  }, [accessConfig]);

  if (!currentRole) {
    return <LoginPage onSignIn={setCurrentRole} />;
  }

  return <Dashboard currentRole={currentRole} accessConfig={accessConfig} onAccessConfigChange={setAccessConfig} onSignOut={() => setCurrentRole(null)} />;
}

export default App;
