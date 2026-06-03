import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ({ children, ...props }) => (
  <ToastPrimitive.Provider swipeDirection="right" {...props}>
    {children}
  </ToastPrimitive.Provider>
);
ToastProvider.displayName = "ToastProvider";

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef(
  ({ className, variant, duration, children, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    // Determina duration baseado no variant:
    // - destructive (erro): 0 = nunca dismissar automaticamente
    // - outros (info/sucesso): 2000ms
    const baseDur =
      typeof duration === "number"
        ? duration
        : variant === "destructive"
          ? 5000
          : 2000;

    // Quando hovering, setar duration=0 para pausar o timer do Radix
    const dur = isHovered ? 0 : baseDur;

    return (
      <ToastPrimitive.Root
        ref={ref}
        duration={dur}
        className={cn(toastVariants({ variant }), className)}
        style={{
          "--toast-duration": `${baseDur}ms`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Barra de progresso */}
        {baseDur > 0 && (
          <style>{`
            @keyframes slideOut {
              from {
                width: 100%;
              }
              to {
                width: 0%;
              }
            }
          `}</style>
        )}
        {baseDur > 0 && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-current opacity-50 origin-left"
            style={{
              animation: `slideOut ${baseDur}ms linear forwards`,
              animationPlayState: isHovered ? "paused" : "running",
            }}
          />
        )}
        {children}
      </ToastPrimitive.Root>
    );
  },
);
Toast.displayName = "Toast";

const ToastAction = React.forwardRef(
  ({ className, altText, ...props }, ref) => (
    <ToastPrimitive.Action
      ref={ref}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      altText={altText}
      {...props}
    />
  ),
);
ToastAction.displayName = "ToastAction";

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
      className,
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = "ToastClose";

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
