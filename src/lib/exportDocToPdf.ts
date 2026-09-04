import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 15;

const DOC_CSS = `
  * { box-sizing: border-box; color: #111111; font-family: Helvetica, Arial, sans-serif; }
  h1 { font-size: 26px; margin: 0 0 12px; font-weight: 700; }
  h2 { font-size: 20px; margin: 18px 0 8px; font-weight: 700; }
  h3 { font-size: 16px; margin: 14px 0 6px; font-weight: 700; }
  p { font-size: 12.5px; line-height: 1.6; margin: 0 0 8px; }
  ul, ol { padding-left: 20px; margin: 0 0 8px; font-size: 12.5px; line-height: 1.6; }
  li { margin-bottom: 4px; }
  blockquote { border-left: 3px solid #111111; padding-left: 10px; margin: 0 0 8px; }
  a { color: #111111; text-decoration: underline; }
  code { font-family: monospace; background: #f2f2f2; padding: 1px 3px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th, td { border: 1px solid #111111; padding: 6px 8px; font-size: 12px; text-align: left; vertical-align: top; }
  th { background: #f2f2f2; font-weight: 700; }
  img { max-width: 100%; }
  ul[data-type="taskList"] { list-style: none; padding-left: 0; }
  ul[data-type="taskList"] li { display: flex; gap: 6px; }
`;

export async function exportDocToPdf(title: string, html: string, logoUrl?: string | null) {
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${PAGE_W_MM - MARGIN_MM * 2}mm`,
    "padding:0",
    "background:#ffffff",
  ].join(";");

  const style = document.createElement("style");
  style.textContent = DOC_CSS;
  container.appendChild(style);

  if (logoUrl) {
    const header = document.createElement("div");
    header.style.cssText = "display:flex;justify-content:flex-start;margin-bottom:16px;";
    const logo = document.createElement("img");
    logo.src = logoUrl;
    logo.crossOrigin = "anonymous";
    logo.style.cssText = "max-height:48px;max-width:180px;object-fit:contain;";
    await new Promise<void>((resolve) => {
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
    });
    if (logo.naturalWidth > 0) {
      header.appendChild(logo);
      container.appendChild(header);
    }
  }

  const heading = document.createElement("h1");
  heading.textContent = title || "Namnlöst dokument";
  container.appendChild(heading);

  const body = document.createElement("div");
  body.innerHTML = html;
  container.appendChild(body);

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const contentWidthMm = PAGE_W_MM - MARGIN_MM * 2;
    const contentHeightMm = PAGE_H_MM - MARGIN_MM * 2;
    const pxPerMm = canvas.width / contentWidthMm;
    const sliceHeightPx = Math.floor(contentHeightMm * pxPerMm);

    let offset = 0;
    let page = 0;
    while (offset < canvas.height) {
      const height = Math.min(sliceHeightPx, canvas.height - offset);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = height;
      const ctx = slice.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, offset, canvas.width, height, 0, 0, canvas.width, height);

      if (page > 0) pdf.addPage();
      pdf.addImage(
        slice.toDataURL("image/jpeg", 0.95),
        "JPEG",
        MARGIN_MM,
        MARGIN_MM,
        contentWidthMm,
        height / pxPerMm
      );

      offset += height;
      page += 1;
    }

    const safeTitle = (title || "dokument").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 60);
    pdf.save(`${safeTitle}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
