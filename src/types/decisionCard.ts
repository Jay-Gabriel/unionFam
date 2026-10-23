// Life Lab Decision Mode V1.0 & V8.7.5 Specification Types

export interface DecisionOption {
  id: string;
  name: string;
  description?: string;
  expectedBenefits?: string[];
  risks?: string[];
}

export interface DecisionUncertainty {
  id: string;
  question: string;
  verificationMethod?: string;
  stopRule?: string;
}

export interface DecisionExperiment {
  learningQuestion: string;
  action: string;
  durationDays: number;
  observations?: string;
  stopRule?: string;
}

export interface DecisionCardData {
  id: string;
  version: number;
  status: 'DRAFT' | 'USER_REVIEW' | 'CONFIRMED' | 'PAUSED' | 'CLOSED';
  title: string;
  source?: 'conversation_extracted' | 'scenario_template' | 'user_created';
  sourceSnippet?: string;
  scenarioCategory?: 'work_life' | 'purpose' | 'major_decision' | 'custom';
  // 1. Tôi đang quyết định điều gì?
  decisionQuestion: string;
  // 2. Điều quan trọng với tôi (3-5 criteria)
  criteria: string[];
  // 3. Giới hạn (Hard constraints & minimum thresholds)
  hardConstraints: string[];
  // 4. Các hướng đang cân nhắc (2-4 options)
  options: DecisionOption[];
  // 5. Điều còn chưa biết (Critical uncertainties)
  uncertainties: DecisionUncertainty[];
  // 6. Bước thử (Small reversible experiment)
  experiment?: DecisionExperiment;
  // 7. Nhìn lại: [Ngày / Điều kiện]
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GranularMemoryPermissions {
  openDecision: boolean;
  criteriaAndLimits: boolean;
  uncertainties: boolean;
  experimentStep: boolean;
  reviewDate: boolean;
  noMemory: boolean;
}
