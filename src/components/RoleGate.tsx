import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";   // <-- FIXED ALIAS
import LoadingScreen from "@/components/LoadingScreen"; // <-- FIXED ALIAS

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "analyst" | "user" | "viewer")[];
}

export function RoleGate({
  children,
  allowedRoles = ["admin", "analyst", "user", "viewer"],
}: RoleGateProps) {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // No role, or not allowed
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default RoleGate;
