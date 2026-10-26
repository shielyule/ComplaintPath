export type Sector = 'financial' | 'energy' | 'data_privacy' | 'parking';

export type SchemeTarget =
  | 'FOS'
  | 'ENERGY_OMBUDSMAN'
  | 'ICO'
  | 'POPLA'
  | 'IAS'
  | 'TPT'
  | 'LONDON_TRIBUNALS'
  | 'FSCS_REDIRECT';

export type ResolutionStatus =
  | 'ELIGIBLE'
  | 'PREMATURE'
  | 'TIME_BARRED'
  | 'REDIRECT_REQUIRED';

export interface BaseInput {
  sector: Sector;
  todayIso?: string; // Defaults to new Date().toISOString()
}

export interface FinancialInput extends BaseInput {
  sector: 'financial';
  firmStatus: 'ACTIVE' | 'IN_DEFAULT' | 'UNKNOWN';
  complaintRaisedDate: string; // ISO: YYYY-MM-DD
  isPaymentServicesComplaint?: boolean; // PSD / EMD 15-day rule
  hasFinalResponseLetter: boolean;
  finalResponseLetterDate?: string;
  hasFosLeafletEnclosed?: boolean;
}

export interface EnergyInput extends BaseInput {
  sector: 'energy';
  complaintRaisedDate: string;
  hasDeadlockLetter: boolean;
  deadlockLetterDate?: string;
}

export interface IcoInput extends BaseInput {
  sector: 'data_privacy';
  raisedWithDpoDate?: string;
  hasDpoFinalResponse: boolean;
  dpoResponseDate?: string;
  seekingFinancialDamagesOnly: boolean;
}

export interface ParkingInput extends BaseInput {
  sector: 'parking';
  landType: 'PRIVATE' | 'COUNCIL';
  locationLondon?: boolean;
  privateTradeBody?: 'BPA' | 'IPC' | 'UNKNOWN';
  operatorRejectionDate?: string;
  hasPoplaCode?: boolean;
  noticeOfRejectionDate?: string;
}

export type ComplaintPayload =
  | FinancialInput
  | EnergyInput
  | IcoInput
  | ParkingInput;

export interface RoutingDecision {
  targetScheme: SchemeTarget | null;
  status: ResolutionStatus;
  reasons: string[];
  actionRequired?: string;
  portalUrl?: string;
  advisoryNote?: string;
}
