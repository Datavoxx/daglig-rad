import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Code,
  Table as TableIcon,
  Columns3,
  Rows3,
  Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocEditorToolbarProps {
  editor: Editor | null;
}

export function DocEditorToolbar({ editor }: DocEditorToolbarProps) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    cn("h-8 w-8 p-0", active && "bg-primary/10 text-primary");

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Länk (URL)", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background/95 p-1.5 backdrop-blur-sm">
      {([1, 2, 3] as const).map((level) => (
        <Button
          key={level}
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-8 px-2 text-xs font-semibold", editor.isActive("heading", { level }) && "bg-primary/10 text-primary")}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          H{level}
        </Button>
      ))}
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("code"))} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("taskList"))} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <ListChecks className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("link"))} onClick={setLink}>
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Infoga tabell" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <TableIcon className="h-4 w-4" />
      </Button>
      {editor.isActive("table") && (
        <>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Lägg till kolumn" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <Columns3 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Lägg till rad" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <Rows3 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Ta bort kolumn" onClick={() => editor.chain().focus().deleteColumn().run()}>
            -Kol
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Ta bort rad" onClick={() => editor.chain().focus().deleteRow().run()}>
            -Rad
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" title="Ta bort tabell" onClick={() => editor.chain().focus().deleteTable().run()}>
            <Trash className="h-4 w-4" />
          </Button>
        </>
      )}
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
