import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

type Props = {
  preferredLabel: string;
  onClose: () => void;
};

export default function BookingSuccess({ preferredLabel, onClose }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-primary" />
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">Tack för din bokning!</h3>
      <p className="text-muted-foreground">Vi ringer dig {preferredLabel}.</p>

      <div className="w-full mt-6 pt-6 border-t border-border/60">
        <p className="text-sm text-muted-foreground mb-5">
          Vi hör av oss så snart som möjligt. Konton till Byggio skapas via inbjudan efter samtalet.
        </p>

        <div className="flex justify-center">
          <Button variant="outline" onClick={onClose}>
            Stäng
          </Button>
        </div>
      </div>
    </div>
  );
}
