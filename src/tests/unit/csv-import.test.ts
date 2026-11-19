import { describe, it, expect } from "vitest";
import {
  parseMembersCsv,
  normalizeIndianPhone,
  parseFlexibleDate,
} from "../../modules/members/csv-import";

describe("CSV Member Importer", () => {
  it("normalizes Indian phone numbers correctly", () => {
    expect(normalizeIndianPhone("9876543210")).toBe("9876543210");
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianPhone("09876543210")).toBe("9876543210");
    expect(normalizeIndianPhone("919876543210")).toBe("9876543210");
    // Invalid numbers: starts with 2, or fewer digits
    expect(normalizeIndianPhone("123456")).toBeNull();
    expect(normalizeIndianPhone("2876543210")).toBeNull();
  });

  it("parses flexible Indian and ISO date formats", () => {
    expect(parseFlexibleDate("2026-10-25")).toBe("2026-10-25");
    expect(parseFlexibleDate("25/10/2026")).toBe("2026-10-25");
    expect(parseFlexibleDate("05-04-2027")).toBe("2027-04-05");
  });

  it("parses CSV with various headers and detects duplicates in file", () => {
    const csvData = `Full Name,Mobile Number,Email,Gender,Package,Expiry Date,Amount Paid
Aarav Sharma,+91 9876543210,aarav@gmail.com,Male,Annual Pro,2027-10-20,15000
Priya Patel,9823456789,priya@yahoo.com,Female,Quarterly,15/01/2027,5500
Duplicate Aarav,9876543210,aarav2@gmail.com,Male,Monthly,2026-11-20,2500
Invalid Phone User,12345,invalid@test.com,Male,Monthly,2026-11-20,2500`;

    const result = parseMembersCsv(csvData);

    expect(result.totalRows).toBe(4);
    expect(result.validRows).toBe(2);
    expect(result.invalidRows).toBe(2);
    expect(result.duplicatePhonesInFile).toBe(1);

    // Row 1: Valid Aarav Sharma
    expect(result.rows[0].firstName).toBe("Aarav");
    expect(result.rows[0].lastName).toBe("Sharma");
    expect(result.rows[0].phone).toBe("9876543210");
    expect(result.rows[0].gender).toBe("MALE");
    expect(result.rows[0].planName).toBe("Annual Pro");
    expect(result.rows[0].amountPaid).toBe(15000);
    expect(result.rows[0].isValid).toBe(true);

    // Row 2: Valid Priya Patel
    expect(result.rows[1].firstName).toBe("Priya");
    expect(result.rows[1].lastName).toBe("Patel");
    expect(result.rows[1].phone).toBe("9823456789");
    expect(result.rows[1].gender).toBe("FEMALE");
    expect(result.rows[1].endDate).toBe("2027-01-15");
    expect(result.rows[1].isValid).toBe(true);

    // Row 3: Duplicate phone
    expect(result.rows[2].isValid).toBe(false);
    expect(result.rows[2].errors[0]).toContain("Duplicate phone number");

    // Row 4: Invalid phone
    expect(result.rows[3].isValid).toBe(false);
    expect(result.rows[3].errors[0]).toContain("Invalid Indian mobile number");
  });
});
