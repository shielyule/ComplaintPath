/** Deterministic UK scheme gates — never invent FRL dates in the LLM path. */
import type {
  ComplaintPayload,
  RoutingDecision,
  FinancialInput,
  EnergyInput,
  IcoInput,
  ParkingInput,
  SchemeTarget,
} from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return Math.floor((to - from) / MS_PER_DAY);
}

function addMonths(isoDate: string, months: number): Date {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function routeComplaint(payload: ComplaintPayload): RoutingDecision {
  const today = payload.todayIso ?? new Date().toISOString().split('T')[0];
  switch (payload.sector) {
    case 'financial':
      return evaluateFinancial(payload, today);
    case 'energy':
      return evaluateEnergy(payload, today);
    case 'data_privacy':
      return evaluateIco(payload, today);
    case 'parking':
      return evaluateParking(payload, today);
  }
}

function evaluateFinancial(input: FinancialInput, today: string): RoutingDecision {
  if (input.firmStatus === 'IN_DEFAULT') {
    return {
      targetScheme: 'FSCS_REDIRECT',
      status: 'REDIRECT_REQUIRED',
      reasons: [
        'The firm has been declared in default or liquidation. FOS cannot enforce awards.',
      ],
      portalUrl: 'https://app.fscs.org.uk/',
      actionRequired: 'Submit claim to Financial Services Compensation Scheme.',
    };
  }

  if (input.hasFinalResponseLetter) {
    if (!input.finalResponseLetterDate) {
      return {
        targetScheme: null,
        status: 'PREMATURE',
        reasons: [
          'Final response letter indicated, but date is missing. Verification halted to avoid date fabrication.',
        ],
        actionRequired: 'Provide the Final Response Letter date printed on the firm’s letter.',
      };
    }

    const expiryDate = addMonths(input.finalResponseLetterDate, 6);
    if (new Date(today) > expiryDate) {
      return {
        targetScheme: 'FOS',
        status: 'TIME_BARRED',
        reasons: [
          `FRL was issued on ${input.finalResponseLetterDate}. The statutory 6-month window expired on ${expiryDate.toISOString().split('T')[0]}.`,
        ],
        advisoryNote:
          'Can only proceed if firm grants permission or extraordinary circumstances prevented earlier referral.',
      };
    }

    return {
      targetScheme: 'FOS',
      status: 'ELIGIBLE',
      reasons: ['Valid Final Response Letter within the active 6-month statutory window.'],
      portalUrl: 'https://complaintsubmission.financial-ombudsman.org.uk/',
    };
  }

  // No FRL → eight-week (or PSD 15-day) silence clock from complaint raised date
  if (!input.complaintRaisedDate) {
    return {
      targetScheme: null,
      status: 'PREMATURE',
      reasons: [
        'No Final Response Letter, and the date the complaint was raised with the firm is missing.',
      ],
      actionRequired:
        'Wait for a Final Response, or confirm when you first complained so the 8-week clock can be checked.',
    };
  }

  const daysElapsed = daysBetween(input.complaintRaisedDate, today);
  const thresholdDays = input.isPaymentServicesComplaint ? 15 : 56;
  if (daysElapsed < thresholdDays) {
    return {
      targetScheme: null,
      status: 'PREMATURE',
      reasons: [
        `No Final Response yet. Only ${daysElapsed} days since the complaint was raised (${input.complaintRaisedDate}). Firms usually have ${thresholdDays} days before FOS escalation for silence.`,
      ],
      actionRequired: `Wait for a Final Response, or until day ${thresholdDays} from ${input.complaintRaisedDate}, before escalating to FOS.`,
    };
  }

  return {
    targetScheme: 'FOS',
    status: 'ELIGIBLE',
    reasons: [
      `No Final Response, but the statutory waiting period (${thresholdDays} days) since ${input.complaintRaisedDate} has expired — FOS eight-week silence path may be open.`,
    ],
    portalUrl: 'https://complaintsubmission.financial-ombudsman.org.uk/',
  };
}

function evaluateEnergy(input: EnergyInput, today: string): RoutingDecision {
  if (input.hasDeadlockLetter) {
    if (!input.deadlockLetterDate) {
      return {
        targetScheme: null,
        status: 'PREMATURE',
        reasons: [
          'Deadlock letter indicated, but issue date is missing. Cannot construct valid case without verified timestamp.',
        ],
      };
    }

    const expiryDate = addMonths(input.deadlockLetterDate, 12);
    if (new Date(today) > expiryDate) {
      return {
        targetScheme: 'ENERGY_OMBUDSMAN',
        status: 'TIME_BARRED',
        reasons: [
          `Deadlock letter issued on ${input.deadlockLetterDate}. Exceeded 12-month validity window.`,
        ],
        portalUrl: 'https://www.energyombudsman.org/submit-a-complaint',
      };
    }

    return {
      targetScheme: 'ENERGY_OMBUDSMAN',
      status: 'ELIGIBLE',
      reasons: ['Valid deadlock letter issued within the 12-month referral window.'],
      portalUrl: 'https://www.energyombudsman.org/submit-a-complaint',
    };
  }

  const daysElapsed = daysBetween(input.complaintRaisedDate, today);
  if (daysElapsed < 56) {
    return {
      targetScheme: null,
      status: 'PREMATURE',
      reasons: [
        `${daysElapsed} days elapsed. Energy Ombudsman requires 8 weeks (56 days) without deadlock letter.`,
      ],
      actionRequired: 'Await supplier resolution or request an explicit deadlock letter.',
    };
  }

  return {
    targetScheme: 'ENERGY_OMBUDSMAN',
    status: 'ELIGIBLE',
    reasons: ['8-week statutory complaint window exceeded without deadlock letter.'],
    portalUrl: 'https://www.energyombudsman.org/submit-a-complaint',
  };
}

function evaluateIco(input: IcoInput, today: string): RoutingDecision {
  const advisoryNote = input.seekingFinancialDamagesOnly
    ? 'CRITICAL: The ICO investigates GDPR compliance and enforcement. The ICO CANNOT award compensation. For financial loss/distress damages, an Article 82 Letter Before Claim must be issued.'
    : undefined;

  if (!input.raisedWithDpoDate) {
    return {
      targetScheme: null,
      status: 'PREMATURE',
      reasons: [
        'Data privacy issues must first be formally lodged with the organization’s Data Protection Officer (DPO).',
      ],
      actionRequired: 'Submit direct complaint to DPO and allow 30 calendar days.',
      advisoryNote,
    };
  }

  const daysElapsed = daysBetween(input.raisedWithDpoDate, today);
  if (!input.hasDpoFinalResponse && daysElapsed < 30) {
    return {
      targetScheme: null,
      status: 'PREMATURE',
      reasons: [
        `Only ${daysElapsed} days elapsed since DPO complaint. Organization has 30 statutory days to respond.`,
      ],
      actionRequired: 'Wait until day 30 before filing regulatory referral.',
      advisoryNote,
    };
  }

  return {
    targetScheme: 'ICO',
    status: 'ELIGIBLE',
    reasons: [
      input.hasDpoFinalResponse
        ? 'DPO response received and disputed.'
        : '30-day statutory response limit expired without resolution.',
    ],
    portalUrl: 'https://ico.org.uk/make-a-complaint/',
    advisoryNote,
  };
}

function evaluateParking(input: ParkingInput, today: string): RoutingDecision {
  if (input.landType === 'COUNCIL') {
    if (!input.noticeOfRejectionDate) {
      return {
        targetScheme: null,
        status: 'PREMATURE',
        reasons: [
          'Cannot escalate council PCN without a formal Notice of Rejection (NoR) following formal representations.',
        ],
        actionRequired: 'Wait for Council Notice of Rejection.',
      };
    }

    const daysElapsed = daysBetween(input.noticeOfRejectionDate, today);
    if (daysElapsed > 28) {
      return {
        targetScheme: input.locationLondon ? 'LONDON_TRIBUNALS' : 'TPT',
        status: 'TIME_BARRED',
        reasons: [
          `Notice of Rejection was served ${daysElapsed} days ago. Statutory deadline is 28 days.`,
        ],
      };
    }

    const scheme: SchemeTarget = input.locationLondon ? 'LONDON_TRIBUNALS' : 'TPT';
    return {
      targetScheme: scheme,
      status: 'ELIGIBLE',
      reasons: [
        `Statutory council appeal within 28 days of NoR. Jurisdiction: ${input.locationLondon ? 'London' : 'England & Wales'}`,
      ],
      portalUrl: input.locationLondon
        ? 'https://www.londontribunals.gov.uk/'
        : 'https://www.tpt.gov.uk/',
    };
  }

  if (!input.operatorRejectionDate) {
    return {
      targetScheme: null,
      status: 'PREMATURE',
      reasons: [
        'Must lodge first-stage appeal directly with parking operator and receive formal rejection.',
      ],
      actionRequired: 'Appeal to private parking operator directly.',
    };
  }

  const daysElapsed = daysBetween(input.operatorRejectionDate, today);

  if (input.privateTradeBody === 'BPA') {
    if (daysElapsed > 28) {
      return {
        targetScheme: 'POPLA',
        status: 'TIME_BARRED',
        reasons: [
          `POPLA code validity window is 28 days. Rejection date was ${daysElapsed} days ago.`,
        ],
      };
    }
    return {
      targetScheme: 'POPLA',
      status: 'ELIGIBLE',
      reasons: ['BPA operator rejection received within 28-day appeal window.'],
      portalUrl: 'https://www.popla.co.uk/',
    };
  }

  if (input.privateTradeBody === 'IPC') {
    if (daysElapsed > 21) {
      return {
        targetScheme: 'IAS',
        status: 'TIME_BARRED',
        reasons: [
          `IAS standard appeal window is 21 days from operator rejection. ${daysElapsed} days elapsed.`,
        ],
      };
    }
    return {
      targetScheme: 'IAS',
      status: 'ELIGIBLE',
      reasons: ['IPC operator rejection received within 21-day appeal window.'],
      portalUrl: 'https://www.theias.org/',
    };
  }

  return {
    targetScheme: null,
    status: 'PREMATURE',
    reasons: [
      'Unable to determine trade body (BPA vs IPC). Check rejection letter for POPLA or IAS logos.',
    ],
  };
}
