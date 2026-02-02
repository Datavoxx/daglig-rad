import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, MoreHorizontal, Trash2, Download, FileText, File, Upload, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

interface ProjectFile {
  id: string;
  file_name: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  created_at: string;
}

interface PendingFile {
  file: File;
  customName: string;
}

interface ProjectFilesTabProps {
  projectId: string;
}

export default function ProjectFilesTab({ projectId }: ProjectFilesTabProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("document");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Kunde inte hämta filer", description: error.message, variant: "destructive" });
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesWithNames = Array.from(selectedFiles).map(file => ({
      file,
      customName: file.name.replace(/\.[^/.]+$/, "") // Remove extension for editing
    }));

    setPendingFiles(filesWithNames);
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Du måste vara inloggad", variant: "destructive" });
      setUploading(false);
      return;
    }

    for (const pf of pendingFiles) {
      const fileExt = pf.file.name.split('.').pop();
      const storagePath = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const displayName = `${pf.customName}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, pf.file);

      if (uploadError) {
        toast({ title: `Kunde inte ladda upp ${pf.customName}`, description: uploadError.message, variant: "destructive" });
        continue;
      }

      // Determine category based on file type
      let category = selectedCategory;
      if (pf.file.type.startsWith("image/")) {
        category = "image";
      }

      // Create database record
      const { error: dbError } = await supabase.from("project_files").insert({
        project_id: projectId,
        user_id: user.id,
        file_name: displayName,
        storage_path: storagePath,
        file_type: pf.file.type,
        file_size: pf.file.size,
        category,
      });

      if (dbError) {
        toast({ title: `Kunde inte spara ${pf.customName}`, description: dbError.message, variant: "destructive" });
      }
    }

    toast({ title: "Filer uppladdade" });
    fetchFiles();
    setUploading(false);
    setDialogOpen(false);
    setPendingFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updatePendingFileName = (index: number, newName: string) => {
    setPendingFiles(prev => prev.map((pf, i) => 
      i === index ? { ...pf, customName: newName } : pf
    ));
  };

  const handleDelete = async (file: ProjectFile) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("project-files")
      .remove([file.storage_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase.from("project_files").delete().eq("id", file.id);
    
    if (dbError) {
      toast({ title: "Kunde inte ta bort fil", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "Fil borttagen" });
      fetchFiles();
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    const { data } = supabase.storage.from("project-files").getPublicUrl(file.storage_path);
    window.open(data.publicUrl, "_blank");
  };

  const getFileIcon = (file: ProjectFile) => {
    const isImage = file.category === "image" || file.file_type?.startsWith("image/");
    
    if (isImage) {
      const { data } = supabase.storage.from("project-files").getPublicUrl(file.storage_path);
      return (
        <div 
          className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => setLightboxImage({ url: data.publicUrl, name: file.file_name })}
        >
          <img 
            src={data.publicUrl} 
            alt={file.file_name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
              const icon = document.createElement('div');
              icon.innerHTML = '<svg class="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
              e.currentTarget.parentElement?.appendChild(icon.firstChild as Node);
            }}
          />
        </div>
      );
    }
    
    if (file.file_type?.includes("pdf")) {
      return (
        <div className="h-10 w-10 rounded-md bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-red-500" />
        </div>
      );
    }
    
    return (
      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
        <File className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  };

  const getCategoryBadge = (category: string | null) => {
    switch (category) {
      case "image":
        return <Badge variant="secondary">Bild</Badge>;
      case "attachment":
        return <Badge variant="secondary">Bilaga</Badge>;
      default:
        return <Badge variant="secondary">Dokument</Badge>;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Filer & bilagor</h3>
          <p className="text-sm text-muted-foreground">Hantera projektets dokument och bilder</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setPendingFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ladda upp
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ladda upp filer</DialogTitle>
              <DialogDescription>
                Välj en eller flera filer att ladda upp till projektet
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Dokument</SelectItem>
                    <SelectItem value="image">Bild</SelectItem>
                    <SelectItem value="attachment">Bilaga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Välj filer</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </div>
              {pendingFiles.length > 0 && (
                <div className="space-y-3">
                  <Label>Döp dina filer</Label>
                  {pendingFiles.map((pf, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        value={pf.customName}
                        onChange={(e) => updatePendingFileName(index, e.target.value)}
                        placeholder="Filnamn"
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        .{pf.file.name.split('.').pop()}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removePendingFile(index)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Avbryt</Button>
              {pendingFiles.length > 0 && (
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Laddar upp..." : "Ladda upp"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : files.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium">Inga filer uppladdade</h3>
          <p className="text-sm text-muted-foreground mt-1">Ladda upp dokument, bilder och bilagor</p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Ladda upp fil
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="group">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {getCategoryBadge(file.category)}
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>{format(parseISO(file.created_at), "d MMM yyyy", { locale: sv })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="mr-2 h-4 w-4" />
                          Ladda ner
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(file)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Ta bort
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogHeader className="p-2">
            <DialogTitle className="text-sm font-medium truncate">{lightboxImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2">
            <img 
              src={lightboxImage?.url} 
              alt={lightboxImage?.name}
              className="max-h-[75vh] w-auto object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
