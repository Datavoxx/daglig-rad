import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ReportsTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-28">Datum</TableHead>
            <TableHead>Projekt</TableHead>
            <TableHead className="w-20 text-center">Antal</TableHead>
            <TableHead className="w-20 text-center">Timmar</TableHead>
            <TableHead className="w-24 text-center">Avvikelser</TableHead>
            <TableHead className="w-20 text-center">ÄTA</TableHead>
            <TableHead className="w-24 text-center">Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4, 5].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-6 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-5 w-6 mx-auto rounded-full" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-5 w-6 mx-auto rounded-full" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-5 w-16 mx-auto rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-4" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
