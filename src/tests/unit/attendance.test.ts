import { describe, it, expect } from "vitest";
import { validateCheckInAdmission } from "../../modules/attendance";

describe("Attendance Admission Controller", () => {
  const member = {
    id: "mem-01",
    firstName: "Rohan",
    lastName: "Verma",
    phone: "9876543210",
    status: "ACTIVE",
  };

  const today = new Date("2026-10-20");

  it("permits active members with plenty of days remaining", () => {
    const res = validateCheckInAdmission(
      member,
      {
        id: "mship-1",
        planName: "Annual Gold",
        endDate: "2027-04-20",
        status: "ACTIVE",
      },
      today
    );

    expect(res.allowed).toBe(true);
    expect(res.alertType).toBeUndefined();
    expect(res.message).toContain("Check-in successful");
  });

  it("warns when membership expires within 7 days but still allows entry", () => {
    const res = validateCheckInAdmission(
      member,
      {
        id: "mship-2",
        planName: "Monthly Pass",
        endDate: "2026-10-24", // 4 days remaining
        status: "ACTIVE",
      },
      today
    );

    expect(res.allowed).toBe(true);
    expect(res.alertType).toBe("EXPIRING_SOON");
    expect(res.daysRemaining).toBe(4);
    expect(res.message).toContain("expires in 4 day(s)");
  });

  it("blocks entry and flags expired membership", () => {
    const res = validateCheckInAdmission(
      member,
      {
        id: "mship-3",
        planName: "Quarterly Pro",
        endDate: "2026-10-15", // 5 days expired
        status: "EXPIRED",
      },
      today
    );

    expect(res.allowed).toBe(false);
    expect(res.alertType).toBe("MEMBERSHIP_EXPIRED");
    expect(res.message).toContain("expired 5 day(s) ago");
  });

  it("blocks entry when membership is frozen/paused", () => {
    const res = validateCheckInAdmission(
      member,
      {
        id: "mship-4",
        planName: "Annual Gold",
        endDate: "2027-01-20",
        status: "FROZEN",
      },
      today
    );

    expect(res.allowed).toBe(false);
    expect(res.alertType).toBe("MEMBERSHIP_FROZEN");
    expect(res.message).toContain("currently paused/frozen");
  });
});
