import { useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { cn } from "@/lib/utils";

function ResizableImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [resizing, setResizing] = useState(false);
  const width = node.attrs.width as number | null;

  const startResize = (e: React.MouseEvent, dir: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = imgRef.current?.offsetWidth ?? 0;
    const maxWidth = imgRef.current?.parentElement?.parentElement?.offsetWidth ?? 2000;
    setResizing(true);

    const onMove = (ev: MouseEvent) => {
      const delta = dir === "right" ? ev.clientX - startX : startX - ev.clientX;
      const next = Math.max(80, Math.min(maxWidth, startWidth + delta));
      updateAttributes({ width: Math.round(next) });
    };
    const onUp = () => {
      setResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const editable = editor.isEditable;

  return (
    <NodeViewWrapper className="doc-image-wrapper" data-drag-handle>
      <div
        className={cn(
          "relative inline-block max-w-full",
          (selected || resizing) && "ring-2 ring-primary rounded-sm"
        )}
        style={{ width: width ? `${width}px` : undefined }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          title={node.attrs.title ?? undefined}
          className="block h-auto w-full rounded-sm"
          draggable={false}
        />
        {editable && (
          <>
            <span
              onMouseDown={(e) => startResize(e, "left")}
              className="absolute left-[-6px] top-1/2 h-8 w-3 -translate-y-1/2 cursor-ew-resize rounded-full border border-primary bg-background opacity-0 transition-opacity group-hover:opacity-100 data-[show=true]:opacity-100"
              data-show={selected || resizing}
            />
            <span
              onMouseDown={(e) => startResize(e, "right")}
              className="absolute right-[-6px] top-1/2 h-8 w-3 -translate-y-1/2 cursor-ew-resize rounded-full border border-primary bg-background opacity-0 transition-opacity group-hover:opacity-100 data-[show=true]:opacity-100"
              data-show={selected || resizing}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const w = element.getAttribute("width") ?? element.style.width;
          const parsed = parseInt(String(w), 10);
          return Number.isNaN(parsed) ? null : parsed;
        },
        renderHTML: (attributes) =>
          attributes.width ? { width: attributes.width, style: `width: ${attributes.width}px` } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
