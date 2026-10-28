import type { EstimateAddon } from "@/hooks/useEstimate";

const fmt = (n: number) => new Intl.NumberFormat("sv-SE").format(Math.round(n || 0));

/** Read-only Tillval table for quote previews. Never part of the total. */
export function AddonsPreviewTable({ addons }: { addons: EstimateAddon[] }) {
  if (!addons.length) return null;
  return (
    <div className="mt-8">
      <h3 className="font-bold text-sm text-black mb-1">Tillval</h3>
      <p className="text-[11px] text-gray-500 mb-2">
        Frivilliga tillval – ingår ej i totalsumman. Priser exkl. moms.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-400">
            <th className="text-left py-2 font-bold text-black">Beskrivning</th>
            <th className="text-right py-2 font-bold text-black">Antal</th>
            <th className="text-right py-2 font-bold text-black">Enhet</th>
            <th className="text-right py-2 font-bold text-black">À-pris</th>
            <th className="text-right py-2 font-bold text-black">Summa</th>
          </tr>
        </thead>
        <tbody>
          {addons.map((a) => (
            <tr key={a.id} className="border-b border-gray-200">
              <td className="py-2 text-gray-800">{a.description || a.article || a.name}</td>
              {a.show_only_total ? (
                <>
                  <td className="py-2 text-right text-gray-400">–</td>
                  <td className="py-2 text-right text-gray-400">–</td>
                  <td className="py-2 text-right text-gray-400">–</td>
                </>
              ) : (
                <>
                  <td className="py-2 text-right text-gray-600">{a.type === "labor" ? a.hours ?? a.quantity : a.quantity}</td>
                  <td className="py-2 text-right text-gray-600">{a.unit}</td>
                  <td className="py-2 text-right text-gray-600">{fmt(a.unit_price)}</td>
                </>
              )}
              <td className="py-2 text-right font-medium text-black">{fmt(a.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
