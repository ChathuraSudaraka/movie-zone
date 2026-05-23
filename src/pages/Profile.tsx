import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

// Profile page removed — redirects home since auth is disabled.
export function Profile() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/"); }, [navigate]);
  return null;
}
