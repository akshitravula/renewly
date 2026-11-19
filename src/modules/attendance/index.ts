/**
 * Attendance & Live Traffic Module
 * Supports QR Check-in, Manual Staff Check-in, and Biometric Webhook
 */

export interface CheckInRequest {
  gymId: string;
  memberId: string;
  method: "QR_SCAN" | "MANUAL_STAFF" | "BIOMETRIC_WEBHOOK";
  deviceIdentifier?: string;
  timestamp?: Date;
}

export interface CheckInStatusResult {
  allowed: boolean;
  alertType?: "MEMBERSHIP_EXPIRED" | "MEMBERSHIP_FROZEN" | "EXPIRING_SOON" | "NO_ACTIVE_MEMBERSHIP";
  message: string;
  daysRemaining?: number;
  member: {
    id: string;
    fullName: string;
    phone: string;
    status: string;
  };
  membership?: {
    id: string;
    planName: string;
    endDate: string;
    status: string;
  };
}

/**
 * Validates member status for admission and generates real-time front desk / turnstile alert.
 */
export function validateCheckInAdmission(
  member: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    status: string;
  },
  activeMembership?: {
    id: string;
    planName: string;
    endDate: string; // YYYY-MM-DD
    status: string;
  },
  currentDate: Date = new Date()
): CheckInStatusResult {
  const fullName = `${member.firstName} ${member.lastName}`.trim();

  if (!activeMembership) {
    return {
      allowed: false,
      alertType: "NO_ACTIVE_MEMBERSHIP",
      message: `${fullName} does not have an active membership on file.`,
      member: {
        id: member.id,
        fullName,
        phone: member.phone,
        status: member.status,
      },
    };
  }

  if (activeMembership.status === "FROZEN") {
    return {
      allowed: false,
      alertType: "MEMBERSHIP_FROZEN",
      message: `${fullName}'s membership is currently paused/frozen.`,
      member: {
        id: member.id,
        fullName,
        phone: member.phone,
        status: member.status,
      },
      membership: activeMembership,
    };
  }

  const todayStr = currentDate.toISOString().split("T")[0];
  const endDateStr = activeMembership.endDate;

  const todayMs = new Date(todayStr).getTime();
  const endMs = new Date(endDateStr).getTime();
  const diffDays = Math.ceil((endMs - todayMs) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      allowed: false,
      alertType: "MEMBERSHIP_EXPIRED",
      message: `${fullName}'s membership expired ${Math.abs(diffDays)} day(s) ago on ${endDateStr}.`,
      daysRemaining: diffDays,
      member: {
        id: member.id,
        fullName,
        phone: member.phone,
        status: member.status,
      },
      membership: activeMembership,
    };
  }

  if (diffDays <= 7) {
    return {
      allowed: true,
      alertType: "EXPIRING_SOON",
      message: `Welcome, ${fullName}! Note: Membership expires in ${diffDays} day(s).`,
      daysRemaining: diffDays,
      member: {
        id: member.id,
        fullName,
        phone: member.phone,
        status: member.status,
      },
      membership: activeMembership,
    };
  }

  return {
    allowed: true,
    message: `Check-in successful! Welcome, ${fullName}.`,
    daysRemaining: diffDays,
    member: {
      id: member.id,
      fullName,
      phone: member.phone,
      status: member.status,
    },
    membership: activeMembership,
  };
}
