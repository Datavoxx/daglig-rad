import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, X, Upload, Image, FileIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileUploadFormCardProps {
  projectId: string;
  projectName?: string;
  onSubmit: (data: { projectId: string; fileName: string; storagePath: string }) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const categories = [
  { id: "document", label: "Dokument" },
  { id: "photo", label: "Foto" },
  { id: "drawing", label: "Ritning" },
  { id: "contract", label: "Avtal" },
  { id: "other", label: "Övrigt" },
];

export function FileUploadFormCard({ projectId, projectName, onSubmit, onCancel, disabled }: FileUploadFormCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState("document");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Ej inloggad");

      const ext = file.name.split(".").pop();
      const storagePath = `${projectId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("project_files").insert({
        project_id: projectId,
        user_id: userData.user.id,
        file_name: file.name,
        storage_path: storagePath,
        file_type: file.type,
        file_size: file.size,
        category,
      });
      if (dbError) throw dbError;

      onSubmit({ projectId, fileName: file.name, storagePath });
    } catch (err: any) {
      toast.error("Kunde inte ladda upp: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Ladda upp fil</CardTitle>
              <p className="text-xs text-muted-foreground">{projectName || "Projekt"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel} disabled={disabled || uploading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* File input */}
          <div className="space-y-1.5">
            <Label className="text-sm">Fil *</Label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.dwg,.dxf"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/30 transition-colors"
              disabled={disabled || uploading}
            >
              <Upload className="h-5 w-5" />
              <span>{file ? file.name : "Välj fil eller bild..."}</span>
            </button>
          </div>

          {/* Preview */}
          {preview && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={preview} alt="Förhandsvisning" className="w-full max-h-48 object-contain bg-muted/20" />
            </div>
          )}
          {file && !preview && (
            <div className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
              <span className="truncate">{file.name}</span>
              <span className="text-muted-foreground ml-auto">{(file.size / 1024).toFixed(0)} KB</span>
            </div>
          )}

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-sm">Kategori</Label>
            <Select value={category} onValueChange={setCategory} disabled={disabled || uploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={uploading}>
              Avbryt
            </Button>
            <Button type="submit" className="flex-1" disabled={!file || uploading || disabled}>
              {uploading ? "Laddar upp..." : "Ladda upp"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
