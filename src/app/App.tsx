import { useState } from "react";
import Home      from "./pages/Home";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [loggedIn,  setLoggedIn]  = useState(false);

  function handleLogout() {
    localStorage.removeItem("ds_token");
    localStorage.removeItem("ds_user");
    setLoggedIn(false);
    setShowLogin(false);
  }

  if (loggedIn) {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (showLogin) {
    return (
      <LoginPage
        onBack={() => setShowLogin(false)}
        onLoginSuccess={() => { setLoggedIn(true); setShowLogin(false); }}
      />
    );
  }

  return (
    <Home
      onGetStarted={() => setShowLogin(true)}
      loggedIn={loggedIn}
      onLogout={handleLogout}
    />
  );
}
