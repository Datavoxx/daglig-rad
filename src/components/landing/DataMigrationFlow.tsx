import { Database, ArrowRight, Upload } from "lucide-react";
import excelLogo from "@/assets/excel-logo.png";
import byggioLogo from "@/assets/byggio-logo.png";

const DataMigrationFlow = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Flow visualization */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 mb-10">
        {/* Step 1: External System */}
        <div className="group relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-card border border-border/50 rounded-xl p-6 w-48 text-center transition-all duration-300 hover:border-border group-hover:shadow-lg animate-float" style={{ animationDelay: "0s" }}>
            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
              <Database className="w-7 h-7 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground text-sm mb-1">Ditt nuvarande system</h4>
            <p className="text-xs text-muted-foreground">Befintlig data</p>
          </div>
        </div>

        {/* Arrow 1 with particles */}
        <div className="relative h-8 md:h-auto md:w-16 flex items-center justify-center">
          <div className="hidden md:block w-full h-0.5 bg-gradient-to-r from-border via-primary/50 to-border animate-flow-pulse" />
          <div className="md:hidden h-full w-0.5 bg-gradient-to-b from-border via-primary/50 to-border animate-flow-pulse" />
          
          {/* Data particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="hidden md:block absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/60 animate-data-particle" style={{ animationDelay: "0s" }} />
            <div className="hidden md:block absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/40 animate-data-particle" style={{ animationDelay: "0.7s" }} />
            <div className="hidden md:block absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary/30 animate-data-particle" style={{ animationDelay: "1.4s" }} />
          </div>
          
          <ArrowRight className="absolute text-primary/60 w-4 h-4 hidden md:block right-0" />
          <ArrowRight className="absolute text-primary/60 w-4 h-4 md:hidden bottom-0 rotate-90" />
        </div>

        {/* Step 2: Excel Export */}
        <div className="group relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#217346]/20 to-[#217346]/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-card border border-border/50 rounded-xl p-6 w-48 text-center transition-all duration-300 hover:border-[#217346]/50 group-hover:shadow-lg group-hover:shadow-[#217346]/5 animate-float" style={{ animationDelay: "0.5s" }}>
            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-[#217346]/10 flex items-center justify-center">
              <img src={excelLogo} alt="Excel" className="w-8 h-8 object-contain" />
            </div>
            <h4 className="font-medium text-foreground text-sm mb-1">Exportera till Excel</h4>
            <p className="text-xs text-muted-foreground">Universellt format</p>
          </div>
        </div>

        {/* Arrow 2 with particles */}
        <div className="relative h-8 md:h-auto md:w-16 flex items-center justify-center">
          <div className="hidden md:block w-full h-0.5 bg-gradient-to-r from-border via-primary/50 to-border animate-flow-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="md:hidden h-full w-0.5 bg-gradient-to-b from-border via-primary/50 to-border animate-flow-pulse" style={{ animationDelay: "0.5s" }} />
          
          {/* Data particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="hidden md:block absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/60 animate-data-particle" style={{ animationDelay: "0.3s" }} />
            <div className="hidden md:block absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/40 animate-data-particle" style={{ animationDelay: "1s" }} />
            <div className="hidden md:block absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary/30 animate-data-particle" style={{ animationDelay: "1.7s" }} />
          </div>
          
          <ArrowRight className="absolute text-primary/60 w-4 h-4 hidden md:block right-0" />
          <ArrowRight className="absolute text-primary/60 w-4 h-4 md:hidden bottom-0 rotate-90" />
        </div>

        {/* Step 3: Import to Byggio */}
        <div className="group relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-card border border-primary/30 rounded-xl p-6 w-48 text-center transition-all duration-300 hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10 animate-float" style={{ animationDelay: "1s" }}>
            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
              <img src={byggioLogo} alt="Byggio" className="w-8 h-8 object-contain" />
            </div>
            <h4 className="font-medium text-foreground text-sm mb-1">Importera till Byggio</h4>
            <p className="text-xs text-muted-foreground">Klart på minuter</p>
          </div>
        </div>
      </div>

      {/* What can be imported */}
      <div className="flex flex-wrap justify-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Kunder</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Offerter</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Projekt</span>
        </div>
      </div>
    </div>
  );
};

export default DataMigrationFlow;
