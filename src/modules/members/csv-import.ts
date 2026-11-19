/**
 * CSV Member Importer with Column Mapping and Duplicate Detection
 */

import Papa from "papaparse";

export interface ParsedMemberRow {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  planName?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  amountPaid?: number;
  tags?: string[];
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicatePhonesInFile: number;
  rows: ParsedMemberRow[];
}

/**
 * Normalizes any Indian phone number to 10-digit format (e.g. "9876543210")
 */
export function normalizeIndianPhone(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^0-9]/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Must be 10 digits starting with 6, 7, 8, or 9 for Indian mobile
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return digits;
  }

  return null;
}

/**
 * Normalizes various date formats to ISO YYYY-MM-DD
 */
export function parseFlexibleDate(dateStr?: string): string | null {
  if (!dateStr || !dateStr.trim()) return null;
  const str = dateStr.trim();

  // 1. YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback to JS Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Fuzzy matches header names to our schema fields
 */
function findHeaderMatch(headers: string[], candidates: string[]): string | undefined {
  const normalizedCandidates = candidates.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const header of headers) {
    const norm = header.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normalizedCandidates.includes(norm)) {
      return header;
    }
  }
  return undefined;
}

export function parseMembersCsv(csvContent: string): ImportSummary {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const headers = parsed.meta.fields || [];

  const phoneHeader = findHeaderMatch(headers, ["phone", "mobile", "contact", "phone number", "mobile number", "cell"]);
  const fullNameHeader = findHeaderMatch(headers, ["full name", "name", "member name"]);
  const firstNameHeader = findHeaderMatch(headers, ["first name", "firstname"]);
  const lastNameHeader = findHeaderMatch(headers, ["last name", "lastname", "surname"]);
  const emailHeader = findHeaderMatch(headers, ["email", "e-mail", "email address"]);
  const genderHeader = findHeaderMatch(headers, ["gender", "sex"]);
  const planHeader = findHeaderMatch(headers, ["plan", "plan name", "package", "membership", "membership type"]);
  const startDateHeader = findHeaderMatch(headers, ["start date", "joining date", "start", "membership start"]);
  const endDateHeader = findHeaderMatch(headers, ["end date", "expiry date", "valid till", "expiry", "membership end"]);
  const amountHeader = findHeaderMatch(headers, ["amount", "fees", "fee", "price", "amount paid"]);
  const tagsHeader = findHeaderMatch(headers, ["tags", "batch", "category", "notes"]);

  const seenPhones = new Set<string>();
  const rows: ParsedMemberRow[] = [];
  let duplicateCount = 0;

  parsed.data.forEach((rawRow, idx) => {
    const rowNumber = idx + 2; // +1 for 0-index, +1 for header line
    const errors: string[] = [];

    // Extract Phone
    const rawPhone = phoneHeader ? rawRow[phoneHeader] : undefined;
    const normalizedPhone = rawPhone ? normalizeIndianPhone(rawPhone) : null;

    if (!normalizedPhone) {
      errors.push(`Invalid Indian mobile number: "${rawPhone || ""}". Must be a 10-digit number starting with 6-9.`);
    } else if (seenPhones.has(normalizedPhone)) {
      duplicateCount++;
      errors.push(`Duplicate phone number in CSV: "${normalizedPhone}".`);
    } else {
      seenPhones.add(normalizedPhone);
    }

    // Extract Name
    let firstName = "";
    let lastName = "";

    if (firstNameHeader && rawRow[firstNameHeader]) {
      firstName = rawRow[firstNameHeader].trim();
      lastName = lastNameHeader && rawRow[lastNameHeader] ? rawRow[lastNameHeader].trim() : "";
    } else if (fullNameHeader && rawRow[fullNameHeader]) {
      const parts = rawRow[fullNameHeader].trim().split(/\s+/);
      firstName = parts[0] || "Member";
      lastName = parts.slice(1).join(" ") || "";
    } else {
      errors.push("Missing member name");
    }

    // Extract Gender
    let gender: "MALE" | "FEMALE" | "OTHER" = "MALE";
    const rawGender = genderHeader && rawRow[genderHeader] ? rawRow[genderHeader].toUpperCase().trim() : "";
    if (rawGender.startsWith("F") || rawGender === "WOMAN" || rawGender === "FEMALE") {
      gender = "FEMALE";
    } else if (rawGender.startsWith("M") || rawGender === "MAN" || rawGender === "MALE") {
      gender = "MALE";
    } else if (rawGender) {
      gender = "OTHER";
    }

    // Dates
    const startDate = startDateHeader ? parseFlexibleDate(rawRow[startDateHeader]) || undefined : undefined;
    const endDate = endDateHeader ? parseFlexibleDate(rawRow[endDateHeader]) || undefined : undefined;

    // Amount
    let amountPaid: number | undefined;
    if (amountHeader && rawRow[amountHeader]) {
      const parsedAmount = parseFloat(rawRow[amountHeader].replace(/[^0-9.]/g, ""));
      if (!isNaN(parsedAmount)) {
        amountPaid = parsedAmount;
      }
    }

    // Tags
    let tags: string[] = [];
    if (tagsHeader && rawRow[tagsHeader]) {
      tags = rawRow[tagsHeader]
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    rows.push({
      firstName: firstName || "Member",
      lastName,
      phone: normalizedPhone || (rawPhone || "INVALID"),
      email: emailHeader && rawRow[emailHeader] ? rawRow[emailHeader].trim() : undefined,
      gender,
      planName: planHeader && rawRow[planHeader] ? rawRow[planHeader].trim() : undefined,
      startDate,
      endDate,
      amountPaid,
      tags,
      rowNumber,
      isValid: errors.length === 0,
      errors,
    });
  });

  const validRows = rows.filter((r) => r.isValid).length;
  const invalidRows = rows.length - validRows;

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    duplicatePhonesInFile: duplicateCount,
    rows,
  };
}
