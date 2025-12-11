import * as React from "react";
import classNames from "classnames";

const Alert = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={classNames(
      "relative w-full rounded-lg border p-4",
      {
        "bg-background text-foreground": variant === "default",
        "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive": variant === "destructive",
      },
      className
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={classNames("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };
