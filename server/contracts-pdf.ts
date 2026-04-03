/**
 * Royal Voyage — Contract & Invoice PDF Generator
 * Generates: Employment Contract, Partnership Agreement, Service Invoice
 * All documents in Arabic (RTL) with ROYAL SERVICE LIMITED branding
 */
import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Brand Colors ──────────────────────────────────────────────────────────────
const NAVY   = "#0D1B3E";
const GOLD   = "#C9A84C";
const WHITE  = "#FFFFFF";
const LIGHT  = "#F8FAFC";
const GRAY   = "#64748B";
const BORDER = "#E2E8F0";
const DARK   = "#1E293B";

// ── Page dimensions (A4) ──────────────────────────────────────────────────────
const W = 595.28;
const H = 841.89;
const M = 40;
const CW = W - M * 2; // content width

// ── Font helpers ──────────────────────────────────────────────────────────────
// We use Helvetica (built-in) for Latin text
// For Arabic: we embed Amiri font if available, else fallback to Helvetica
function getArabicFontPath(): string | null {
  const candidates = [
    path.join(__dirname, "../assets/fonts/Amiri-Regular.ttf"),
    path.join(__dirname, "assets/fonts/Amiri-Regular.ttf"),
    "/home/ubuntu/Amiri-Regular.ttf",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getArabicBoldFontPath(): string | null {
  const candidates = [
    path.join(__dirname, "../assets/fonts/Amiri-Bold.ttf"),
    path.join(__dirname, "assets/fonts/Amiri-Bold.ttf"),
    "/home/ubuntu/Amiri-Bold.ttf",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function drawRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, fill: string, stroke?: string) {
  doc.rect(x, y, w, h);
  if (stroke) doc.fillAndStroke(fill, stroke);
  else doc.fill(fill);
}

function drawRoundedRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  doc.roundedRect(x, y, w, h, r);
  if (stroke) doc.fillAndStroke(fill, stroke);
  else doc.fill(fill);
}

function divider(doc: PDFKit.PDFDocument, x: number, y: number, w: number, color = BORDER) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor(color).lineWidth(0.5).stroke();
}

/** Draw page header with company branding */
function drawHeader(doc: PDFKit.PDFDocument, arabicFont: string | null, arabicBoldFont: string | null) {
  // Navy header bar
  drawRect(doc, 0, 0, W, 72, NAVY);
  // Gold accent line
  drawRect(doc, 0, 72, W, 3, GOLD);

  // Company name (Latin)
  doc.fontSize(14).fillColor(WHITE).font("Helvetica-Bold")
    .text("ROYAL SERVICE LIMITED", M, 18, { width: CW, align: "right" });
  doc.fontSize(9).fillColor("rgba(255,255,255,0.7)").font("Helvetica")
    .text("Royal Voyage  ·  suporte@royalvoyage.online  ·  +222 33 70 00 00  ·  royalvoyage.online", M, 36, { width: CW, align: "right" });

  // Arabic subtitle (address)
  if (arabicFont) {
    doc.fontSize(9).fillColor("rgba(255,255,255,0.6)").font(arabicFont)
      .text("تفرغ زين، نواكشوط، موريتانيا", M, 52, { width: CW, align: "left" });
  } else {
    doc.fontSize(9).fillColor("rgba(255,255,255,0.6)").font("Helvetica")
      .text("Tavragh Zeina, Nouakchott, Mauritania", M, 52, { width: CW, align: "left" });
  }
}

/** Draw page footer */
function drawFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number) {
  drawRect(doc, 0, H - 44, W, 44, NAVY);
  doc.fontSize(8).fillColor("rgba(255,255,255,0.5)").font("Helvetica")
    .text(`ROYAL SERVICE LIMITED  |  Royal Voyage  |  suporte@royalvoyage.online  |  +222 33 70 00 00  |  royalvoyage.online`, M, H - 30, { width: CW, align: "center" });
  doc.fontSize(8).fillColor("rgba(255,255,255,0.3)").font("Helvetica")
    .text(`${pageNum} / ${totalPages}`, W - M - 30, H - 30, { width: 30, align: "right" });
}

/** Draw section header */
function drawSection(doc: PDFKit.PDFDocument, title: string, y: number, arabicFont: string | null): number {
  drawRoundedRect(doc, M, y, CW, 28, 4, NAVY);
  // Gold number circle
  const font = arabicFont || "Helvetica-Bold";
  doc.fontSize(11).fillColor(WHITE).font(font)
    .text(title, M + 12, y + 7, { width: CW - 24, align: "right" });
  return y + 28 + 10;
}

/** Draw a table row */
function drawRow(doc: PDFKit.PDFDocument, label: string, value: string, y: number, arabicFont: string | null, shade = false): number {
  const rowH = 22;
  if (shade) drawRect(doc, M, y, CW, rowH, "#F1F5F9");
  doc.rect(M, y, CW, rowH).strokeColor(BORDER).lineWidth(0.5).stroke();

  const font = arabicFont || "Helvetica";
  const boldFont = arabicFont ? arabicFont : "Helvetica-Bold";

  // Label (right side in RTL)
  doc.fontSize(9.5).fillColor(DARK).font(boldFont)
    .text(label, M + 8, y + 5, { width: CW / 2 - 16, align: "right" });
  // Value (left side in RTL)
  doc.fontSize(9.5).fillColor(GRAY).font(font)
    .text(value || "___________________________", M + CW / 2, y + 5, { width: CW / 2 - 8, align: "right" });

  return y + rowH;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYMENT CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
export interface EmploymentContractData {
  employeeName: string;
  employeeId?: string;
  nationality?: string;
  birthDate?: string;
  position: string;
  department?: string;
  startDate: string;
  contractDuration?: string;
  salary: string;
  workHours?: string;
  probationPeriod?: string;
  refNumber?: string;
  date?: string;
}

export async function generateEmploymentContractPDF(data: EmploymentContractData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const arabicFont = getArabicFontPath();
      const arabicBoldFont = getArabicBoldFontPath();

      const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      if (arabicFont) doc.registerFont("Arabic", arabicFont);
      if (arabicBoldFont) doc.registerFont("ArabicBold", arabicBoldFont);

      const af = arabicFont ? "Arabic" : null;
      const abf = arabicBoldFont ? "ArabicBold" : null;

      // ── Page 1 ──────────────────────────────────────────────────────────────
      drawHeader(doc, af, abf);

      let y = 90;

      // Title
      const titleFont = af || "Helvetica-Bold";
      doc.fontSize(22).fillColor(NAVY).font(titleFont)
        .text("عقد عمل", M, y, { width: CW, align: "center" });
      y += 28;
      doc.fontSize(11).fillColor(GRAY).font("Helvetica-Oblique")
        .text("Contrat de Travail", M, y, { width: CW, align: "center" });
      y += 10;
      // Gold divider
      drawRect(doc, M + CW / 2 - 40, y, 80, 2, GOLD);
      y += 16;

      // Reference box
      drawRoundedRect(doc, M, y, CW, 36, 6, LIGHT, BORDER);
      const refFont = af || "Helvetica";
      doc.fontSize(9).fillColor(GRAY).font(refFont)
        .text(`رقم المرجع: ${data.refNumber || "RV-EMP-_______________"}`, M + 12, y + 8, { width: CW / 2 - 24, align: "right" });
      doc.fontSize(9).fillColor(GRAY).font(refFont)
        .text(`التاريخ: ${data.date || "_______________"}`, M + CW / 2, y + 8, { width: CW / 2 - 12, align: "right" });
      y += 50;

      // Section 1: Parties
      y = drawSection(doc, "1  بيانات الأطراف المتعاقدة", y, af);

      // Employer
      doc.fontSize(10).fillColor(NAVY).font(abf || "Helvetica-Bold")
        .text("الطرف الأول — صاحب العمل", M, y, { width: CW, align: "right" });
      y += 16;

      const employer = [
        ["الاسم القانوني", "ROYAL SERVICE LIMITED"],
        ["العلامة التجارية", "Royal Voyage"],
        ["العنوان", "تفرغ زين، نواكشوط، موريتانيا"],
        ["البريد الإلكتروني", "suporte@royalvoyage.online"],
        ["الهاتف / واتساب", "+222 33 70 00 00"],
      ];
      employer.forEach(([label, value], i) => {
        y = drawRow(doc, label, value, y, af, i % 2 === 0);
      });
      y += 14;

      // Employee
      doc.fontSize(10).fillColor(NAVY).font(abf || "Helvetica-Bold")
        .text("الطرف الثاني — الموظف", M, y, { width: CW, align: "right" });
      y += 16;

      const employee = [
        ["الاسم الكامل", data.employeeName],
        ["رقم الهوية / جواز السفر", data.employeeId || ""],
        ["الجنسية", data.nationality || ""],
        ["تاريخ الميلاد", data.birthDate || ""],
      ];
      employee.forEach(([label, value], i) => {
        y = drawRow(doc, label, value, y, af, i % 2 === 0);
      });
      y += 16;

      // Section 2: Job Details
      y = drawSection(doc, "2  تفاصيل الوظيفة", y, af);

      const jobDetails = [
        ["المسمى الوظيفي", data.position],
        ["القسم / الإدارة", data.department || ""],
        ["تاريخ بدء العمل", data.startDate],
        ["مدة العقد", data.contractDuration || "غير محدد المدة"],
        ["فترة التجربة", data.probationPeriod || "3 أشهر"],
        ["ساعات العمل", data.workHours || "8 ساعات يومياً — 40 ساعة أسبوعياً"],
      ];
      jobDetails.forEach(([label, value], i) => {
        y = drawRow(doc, label, value, y, af, i % 2 === 0);
      });
      y += 16;

      // Section 3: Salary
      y = drawSection(doc, "3  الراتب والمزايا", y, af);

      const salaryRows = [
        ["الراتب الأساسي الشهري", data.salary],
        ["طريقة الدفع", "تحويل بنكي — نهاية كل شهر"],
        ["الإجازة السنوية", "18 يوم عمل مدفوعة الأجر"],
        ["التأمين الصحي", "وفق سياسة الشركة"],
      ];
      salaryRows.forEach(([label, value], i) => {
        y = drawRow(doc, label, value, y, af, i % 2 === 0);
      });

      drawFooter(doc, 1, 2);

      // ── Page 2 ──────────────────────────────────────────────────────────────
      doc.addPage();
      drawHeader(doc, af, abf);
      y = 90;

      // Section 4: Obligations
      y = drawSection(doc, "4  التزامات الموظف", y, af);

      const obligations = [
        "الالتزام بأوقات العمل الرسمية والحضور المنتظم.",
        "الحفاظ على سرية معلومات الشركة والعملاء.",
        "الامتثال للوائح الداخلية وسياسات الشركة.",
        "أداء المهام الموكلة بكفاءة واحترافية.",
        "الإخطار المسبق بمدة لا تقل عن 30 يوماً عند الرغبة في الاستقالة.",
      ];

      const oblFont = af || "Helvetica";
      obligations.forEach((item, i) => {
        drawRoundedRect(doc, M, y, CW, 26, 4, i % 2 === 0 ? LIGHT : WHITE, BORDER);
        doc.fontSize(9.5).fillColor(DARK).font(oblFont)
          .text(`• ${item}`, M + 12, y + 7, { width: CW - 24, align: "right" });
        y += 28;
      });
      y += 10;

      // Section 5: Termination
      y = drawSection(doc, "5  إنهاء العقد", y, af);

      const termText = "يحق لأي من الطرفين إنهاء هذا العقد بإشعار خطي مسبق مدته (30) يوماً. في حالة الإخلال الجسيم بالالتزامات، يحق لصاحب العمل إنهاء العقد فوراً وفق أحكام قانون العمل الموريتاني رقم 2004-017.";
      drawRoundedRect(doc, M, y, CW, 52, 6, LIGHT, BORDER);
      doc.fontSize(9.5).fillColor(DARK).font(oblFont)
        .text(termText, M + 12, y + 8, { width: CW - 24, align: "right" });
      y += 66;

      // Section 6: Signatures
      y = drawSection(doc, "6  التوقيعات", y, af);

      // Two signature boxes
      const boxW = (CW - 20) / 2;
      drawRoundedRect(doc, M, y, boxW, 90, 6, LIGHT, BORDER);
      drawRoundedRect(doc, M + boxW + 20, y, boxW, 90, 6, LIGHT, BORDER);

      doc.fontSize(10).fillColor(NAVY).font(abf || "Helvetica-Bold")
        .text("صاحب العمل", M, y + 10, { width: boxW, align: "center" })
        .text("الموظف", M + boxW + 20, y + 10, { width: boxW, align: "center" });

      doc.fontSize(8.5).fillColor(GRAY).font(oblFont)
        .text("ROYAL SERVICE LIMITED", M, y + 26, { width: boxW, align: "center" })
        .text(data.employeeName, M + boxW + 20, y + 26, { width: boxW, align: "center" });

      doc.fontSize(8).fillColor(GRAY).font(oblFont)
        .text("التوقيع: ___________________", M + 12, y + 56, { width: boxW - 24, align: "center" })
        .text("التوقيع: ___________________", M + boxW + 32, y + 56, { width: boxW - 24, align: "center" });

      doc.fontSize(8).fillColor(GRAY).font(oblFont)
        .text("الختم الرسمي:", M + 12, y + 72, { width: boxW - 24, align: "center" });

      y += 104;

      // Legal note
      drawRoundedRect(doc, M, y, CW, 38, 6, "#FFF8E1", "#F59E0B");
      doc.fontSize(8.5).fillColor("#92400E").font(oblFont)
        .text("⚠  هذا العقد محرر وفق أحكام قانون العمل الموريتاني رقم 2004-017 وتعديلاته. يُنصح بمراجعة محامٍ مختص قبل التوقيع.", M + 12, y + 11, { width: CW - 24, align: "right" });

      drawFooter(doc, 2, 2);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE INVOICE
// ─────────────────────────────────────────────────────────────────────────────
export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  // Client
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  // Items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    currency?: string;
  }>;
  currency: string;
  taxRate?: number; // percentage e.g. 0 or 18
  notes?: string;
  paymentMethod?: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const arabicFont = getArabicFontPath();
      const arabicBoldFont = getArabicBoldFontPath();

      const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      if (arabicFont) doc.registerFont("Arabic", arabicFont);
      if (arabicBoldFont) doc.registerFont("ArabicBold", arabicBoldFont);

      const af = arabicFont ? "Arabic" : null;
      const abf = arabicBoldFont ? "ArabicBold" : null;

      drawHeader(doc, af, abf);

      let y = 90;

      // Title
      const titleFont = af || "Helvetica-Bold";
      doc.fontSize(24).fillColor(NAVY).font(titleFont)
        .text("فاتورة خدمة", M, y, { width: CW, align: "center" });
      y += 30;
      doc.fontSize(11).fillColor(GRAY).font("Helvetica-Oblique")
        .text("Facture de Service", M, y, { width: CW, align: "center" });
      y += 10;
      drawRect(doc, M + CW / 2 - 40, y, 80, 2, GOLD);
      y += 20;

      // Invoice meta
      drawRoundedRect(doc, M, y, CW, 50, 8, NAVY);
      const metaFont = af || "Helvetica";
      const metaBoldFont = abf || "Helvetica-Bold";
      doc.fontSize(9).fillColor("rgba(255,255,255,0.6)").font(metaFont)
        .text("رقم الفاتورة", M + 12, y + 8, { width: CW / 3 - 24, align: "right" })
        .text("تاريخ الإصدار", M + CW / 3, y + 8, { width: CW / 3 - 8, align: "center" })
        .text("تاريخ الاستحقاق", M + 2 * CW / 3, y + 8, { width: CW / 3 - 12, align: "left" });
      doc.fontSize(13).fillColor(GOLD).font(metaBoldFont)
        .text(data.invoiceNumber, M + 12, y + 24, { width: CW / 3 - 24, align: "right" });
      doc.fontSize(13).fillColor(WHITE).font(metaBoldFont)
        .text(data.date, M + CW / 3, y + 24, { width: CW / 3 - 8, align: "center" })
        .text(data.dueDate || data.date, M + 2 * CW / 3, y + 24, { width: CW / 3 - 12, align: "left" });
      y += 66;

      // Client info
      const halfW = (CW - 16) / 2;

      // Company box
      drawRoundedRect(doc, M, y, halfW, 80, 6, LIGHT, BORDER);
      doc.fontSize(9).fillColor(GOLD).font(metaBoldFont)
        .text("من:", M + 8, y + 8, { width: halfW - 16, align: "right" });
      doc.fontSize(10).fillColor(NAVY).font(metaBoldFont)
        .text("ROYAL SERVICE LIMITED", M + 8, y + 22, { width: halfW - 16, align: "right" });
      doc.fontSize(8.5).fillColor(GRAY).font(metaFont)
        .text("Royal Voyage", M + 8, y + 38, { width: halfW - 16, align: "right" })
        .text("تفرغ زين، نواكشوط", M + 8, y + 50, { width: halfW - 16, align: "right" })
        .text("+222 33 70 00 00", M + 8, y + 62, { width: halfW - 16, align: "right" });

      // Client box
      drawRoundedRect(doc, M + halfW + 16, y, halfW, 80, 6, LIGHT, BORDER);
      doc.fontSize(9).fillColor(GOLD).font(metaBoldFont)
        .text("إلى:", M + halfW + 24, y + 8, { width: halfW - 16, align: "right" });
      doc.fontSize(10).fillColor(NAVY).font(metaBoldFont)
        .text(data.clientName, M + halfW + 24, y + 22, { width: halfW - 16, align: "right" });
      doc.fontSize(8.5).fillColor(GRAY).font(metaFont)
        .text(data.clientPhone || "", M + halfW + 24, y + 38, { width: halfW - 16, align: "right" })
        .text(data.clientEmail || "", M + halfW + 24, y + 50, { width: halfW - 16, align: "right" })
        .text(data.clientAddress || "", M + halfW + 24, y + 62, { width: halfW - 16, align: "right" });

      y += 96;

      // Items table header
      drawRoundedRect(doc, M, y, CW, 26, 4, NAVY);
      doc.fontSize(9).fillColor(WHITE).font(metaBoldFont)
        .text("الإجمالي", M + 8, y + 7, { width: 80, align: "right" })
        .text("سعر الوحدة", M + 96, y + 7, { width: 80, align: "right" })
        .text("الكمية", M + 184, y + 7, { width: 60, align: "right" })
        .text("البيان", M + 252, y + 7, { width: CW - 260, align: "right" });
      y += 26;

      // Items
      let subtotal = 0;
      data.items.forEach((item, i) => {
        const total = item.quantity * item.unitPrice;
        subtotal += total;
        const rowH = 28;
        if (i % 2 === 0) drawRect(doc, M, y, CW, rowH, "#F8FAFC");
        doc.rect(M, y, CW, rowH).strokeColor(BORDER).lineWidth(0.5).stroke();

        doc.fontSize(9.5).fillColor(DARK).font(metaFont)
          .text(`${total.toFixed(0)} ${data.currency}`, M + 8, y + 8, { width: 80, align: "right" })
          .text(`${item.unitPrice.toFixed(0)} ${data.currency}`, M + 96, y + 8, { width: 80, align: "right" })
          .text(`${item.quantity}`, M + 184, y + 8, { width: 60, align: "right" })
          .text(item.description, M + 252, y + 8, { width: CW - 260, align: "right" });
        y += rowH;
      });
      y += 10;

      // Totals
      const tax = data.taxRate ? subtotal * (data.taxRate / 100) : 0;
      const total = subtotal + tax;

      const totalsX = M + CW - 220;
      const totalsW = 220;

      drawRoundedRect(doc, totalsX, y, totalsW, tax > 0 ? 90 : 66, 6, LIGHT, BORDER);

      doc.fontSize(9.5).fillColor(GRAY).font(metaFont)
        .text("المجموع الفرعي:", totalsX + 8, y + 10, { width: totalsW - 16, align: "right" });
      doc.fontSize(9.5).fillColor(DARK).font(metaBoldFont)
        .text(`${subtotal.toFixed(0)} ${data.currency}`, totalsX + 8, y + 10, { width: totalsW / 2 - 8, align: "left" });

      if (tax > 0) {
        doc.fontSize(9.5).fillColor(GRAY).font(metaFont)
          .text(`ضريبة (${data.taxRate}%):`, totalsX + 8, y + 30, { width: totalsW - 16, align: "right" });
        doc.fontSize(9.5).fillColor(DARK).font(metaBoldFont)
          .text(`${tax.toFixed(0)} ${data.currency}`, totalsX + 8, y + 30, { width: totalsW / 2 - 8, align: "left" });
        divider(doc, totalsX + 8, y + 50, totalsW - 16);
        doc.fontSize(12).fillColor(NAVY).font(metaBoldFont)
          .text("الإجمالي:", totalsX + 8, y + 58, { width: totalsW - 16, align: "right" });
        doc.fontSize(14).fillColor(GOLD).font(metaBoldFont)
          .text(`${total.toFixed(0)} ${data.currency}`, totalsX + 8, y + 56, { width: totalsW / 2 - 8, align: "left" });
        y += 104;
      } else {
        divider(doc, totalsX + 8, y + 30, totalsW - 16);
        doc.fontSize(12).fillColor(NAVY).font(metaBoldFont)
          .text("الإجمالي:", totalsX + 8, y + 38, { width: totalsW - 16, align: "right" });
        doc.fontSize(14).fillColor(GOLD).font(metaBoldFont)
          .text(`${total.toFixed(0)} ${data.currency}`, totalsX + 8, y + 36, { width: totalsW / 2 - 8, align: "left" });
        y += 80;
      }

      // Payment method
      if (data.paymentMethod) {
        drawRoundedRect(doc, M, y, CW / 2 - 8, 36, 6, LIGHT, BORDER);
        doc.fontSize(9).fillColor(GOLD).font(metaBoldFont)
          .text("طريقة الدفع:", M + 8, y + 8, { width: CW / 2 - 24, align: "right" });
        doc.fontSize(10).fillColor(DARK).font(metaFont)
          .text(data.paymentMethod, M + 8, y + 22, { width: CW / 2 - 24, align: "right" });
        y += 50;
      }

      // Notes
      if (data.notes) {
        drawRoundedRect(doc, M, y, CW, 50, 6, "#FFF8E1", "#F59E0B");
        doc.fontSize(9).fillColor(GOLD).font(metaBoldFont)
          .text("ملاحظات:", M + 12, y + 8, { width: CW - 24, align: "right" });
        doc.fontSize(9).fillColor("#92400E").font(metaFont)
          .text(data.notes, M + 12, y + 22, { width: CW - 24, align: "right" });
        y += 64;
      }

      // Thank you note
      y += 10;
      doc.fontSize(11).fillColor(NAVY).font(titleFont)
        .text("شكراً لثقتكم بـ Royal Voyage", M, y, { width: CW, align: "center" });

      drawFooter(doc, 1, 1);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTNERSHIP AGREEMENT (Custom)
// ─────────────────────────────────────────────────────────────────────────────
export interface PartnershipData {
  partnerName: string;
  partnerLegal?: string;
  partnerAddress?: string;
  partnerPhone?: string;
  partnerEmail?: string;
  partnerRep?: string;
  commissionRate: string;
  startDate: string;
  duration?: string;
  refNumber?: string;
  date?: string;
}

export async function generatePartnershipPDF(data: PartnershipData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const arabicFont = getArabicFontPath();
      const arabicBoldFont = getArabicBoldFontPath();

      const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      if (arabicFont) doc.registerFont("Arabic", arabicFont);
      if (arabicBoldFont) doc.registerFont("ArabicBold", arabicBoldFont);

      const af = arabicFont ? "Arabic" : null;
      const abf = arabicBoldFont ? "ArabicBold" : null;

      drawHeader(doc, af, abf);

      let y = 90;
      const titleFont = af || "Helvetica-Bold";
      const bodyFont = af || "Helvetica";

      doc.fontSize(22).fillColor(NAVY).font(titleFont)
        .text("اتفاقية شراكة تجارية", M, y, { width: CW, align: "center" });
      y += 28;
      doc.fontSize(11).fillColor(GRAY).font("Helvetica-Oblique")
        .text("Accord de Partenariat Commercial", M, y, { width: CW, align: "center" });
      y += 10;
      drawRect(doc, M + CW / 2 - 40, y, 80, 2, GOLD);
      y += 18;

      // Ref box
      drawRoundedRect(doc, M, y, CW, 36, 6, LIGHT, BORDER);
      doc.fontSize(9).fillColor(GRAY).font(bodyFont)
        .text(`رقم المرجع: ${data.refNumber || "RV-PART-_______________"}`, M + 12, y + 8, { width: CW / 2 - 24, align: "right" })
        .text(`التاريخ: ${data.date || "_______________"}`, M + CW / 2, y + 8, { width: CW / 2 - 12, align: "right" });
      y += 52;

      // Section 1
      y = drawSection(doc, "1  بيانات الأطراف المتعاقدة", y, af);

      doc.fontSize(10).fillColor(NAVY).font(abf || "Helvetica-Bold")
        .text("الطرف الأول — الوكالة", M, y, { width: CW, align: "right" });
      y += 16;

      const party1 = [
        ["الاسم القانوني", "ROYAL SERVICE LIMITED"],
        ["العلامة التجارية", "Royal Voyage"],
        ["العنوان", "تفرغ زين، نواكشوط، موريتانيا"],
        ["البريد الإلكتروني", "suporte@royalvoyage.online"],
        ["الهاتف / واتساب", "+222 33 70 00 00"],
        ["الموقع الإلكتروني", "royalvoyage.online"],
        ["الممثل القانوني", "___________________________"],
      ];
      party1.forEach(([label, value], i) => {
        y = drawRow(doc, label, value, y, af, i % 2 === 0);
      });
      y += 14;

      doc.fontSize(10).fillColor(NAVY).font(abf || "Helvetica-Bold")
        .text("الطرف الثاني — الشريك", M, y, { width: CW, align: "right" });
      y += 16;

      const party2 = [
        ["الاسم القانوني للشركة", data.partnerLegal || data.partnerName],
        ["العلامة التجارية", data.partnerName],
        ["العنوان الكامل", data.partnerAddress || ""],
        ["البريد الإلكتروني", data.partnerEmail || ""],
        ["الهاتف", data.partnerPhone || ""],
        ["الممثل القانوني", data.partnerRep || ""],
      ];
      party2.forEach(([label, value], i) => {
        y = drawRow(doc, label, value, y, af, i % 2 === 0);
      });
      y += 16;

      // Section 2
      y = drawSection(doc, "2  موضوع الاتفاقية", y, af);

      const subject = "تهدف هذه الاتفاقية إلى إقامة علاقة شراكة تجارية استراتيجية بين الطرفين في مجال خدمات السفر والسياحة، وتشمل: تسويق وبيع تذاكر الطيران، حجوزات الفنادق، وباقات السياحة التي تقدمها وكالة Royal Voyage.";
      drawRoundedRect(doc, M, y, CW, 56, 6, LIGHT, BORDER);
      doc.fontSize(9.5).fillColor(DARK).font(bodyFont)
        .text(subject, M + 12, y + 8, { width: CW - 24, align: "right" });
      y += 72;

      // Section 3
      y = drawSection(doc, "3  العمولات والمدفوعات", y, af);

      const commRows = [
        ["نسبة العمولة", `${data.commissionRate}% من قيمة كل حجز مؤكد`],
        ["تاريخ بدء الشراكة", data.startDate],
        ["مدة الاتفاقية", data.duration || "سنة واحدة قابلة للتجديد"],
        ["موعد صرف العمولات", "نهاية كل شهر ميلادي"],
        ["طريقة الدفع", "تحويل بنكي أو واتساب Pay"],
      ];
      commRows.forEach(([label, value], i) => {
        y = drawRow(doc, label, value, y, af, i % 2 === 0);
      });
      y += 16;

      // Signatures
      y = drawSection(doc, "4  التوقيعات", y, af);

      const boxW2 = (CW - 20) / 2;
      drawRoundedRect(doc, M, y, boxW2, 90, 6, LIGHT, BORDER);
      drawRoundedRect(doc, M + boxW2 + 20, y, boxW2, 90, 6, LIGHT, BORDER);

      doc.fontSize(10).fillColor(NAVY).font(abf || "Helvetica-Bold")
        .text("الطرف الأول", M, y + 10, { width: boxW2, align: "center" })
        .text("الطرف الثاني", M + boxW2 + 20, y + 10, { width: boxW2, align: "center" });

      doc.fontSize(8.5).fillColor(GRAY).font(bodyFont)
        .text("ROYAL SERVICE LIMITED", M, y + 26, { width: boxW2, align: "center" })
        .text(data.partnerName, M + boxW2 + 20, y + 26, { width: boxW2, align: "center" });

      doc.fontSize(8).fillColor(GRAY).font(bodyFont)
        .text("التوقيع: ___________________", M + 12, y + 56, { width: boxW2 - 24, align: "center" })
        .text("التوقيع: ___________________", M + boxW2 + 32, y + 56, { width: boxW2 - 24, align: "center" })
        .text("الختم الرسمي:", M + 12, y + 72, { width: boxW2 - 24, align: "center" })
        .text("الختم الرسمي:", M + boxW2 + 32, y + 72, { width: boxW2 - 24, align: "center" });

      drawFooter(doc, 1, 1);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
