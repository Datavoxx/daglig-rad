import byggioLogo from "@/assets/byggio-loader-logo.png";

export function ByggioLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <img
          src={byggioLogo}
          alt="Byggio"
          className="h-16 w-auto animate-byggio-pulse"
        />
        <p className="text-sm text-muted-foreground animate-fade-in">
          Laddar...
        </p>
      </div>
    </div>
  );
}
