import React from 'react';
import { ShieldAlert } from 'lucide-react';

const RoleGate = ({ allowedRoles = [], children, fallback, loadingMessage = "Checking permissions" }) => {
  // Mock auth check - in real implementation, this would use the actual auth context
  const currentUser = {
    role: 'admin' // This should come from actual auth context
  };

  const DefaultFallback = () => (
    <div className="mx-auto max-w-lg border border-destructive/40 bg-destructive/10 p-6 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-full bg-destructive/20 p-2 text-destructive">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">Access denied</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        You do not have permission to view this section. Please contact an administrator if you believe this is an error.
      </p>
    </div>
  );

  // If current user role is not in allowed roles, show fallback
  if (currentUser && !allowedRoles.includes(currentUser.role)) {
    return fallback || <DefaultFallback />;
  }

  return children;
};

export default RoleGate;