
export type UserRole = 'parent' | 'teacher' | 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  childrenIds?: string[];
  classIds?: string[];
  subject?: string;
  messagingAvailability?: {
    startTime: string;
    endTime: string;
  };
}

export interface Student {
  id: string;
  name: string;
  grade: number;
  classId: string;
  parentId: string;
  avatar: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  classIds?: string[];
  currentWorkload?: number;
}

export interface Grade {
  id?: string;
  studentId: string;
  subject: string;
  assignment: string;
  marksObtained: number;
  maxMarks: number;
  date: string;
  type?: 'quiz' | 'test' | 'homework' | 'project' | 'exam';
  teacherId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  teacherId: string;
  priority: 'high' | 'medium' | 'low';
  classIds?: string[];
}

export interface Homework {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  assignedDate: string;
  teacherId: string;
  submitted: string[]; // list of student IDs who submitted
}

export interface Attendance {
  date: string; // YYYY-MM-DD
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface Class {
    id: string;
    name: string;
    subjectIds?: string[];
}

export interface Subject {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  timestamp: string; // ISO string
  isRead: boolean;
  type: 'text' | 'voice' | 'file';
  content?: string;
  audioSrc?: string;
  attachments?: any; // For file attachments
}

export interface TimetableEntry {
  classId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  time: string; // e.g., '09:00 - 10:00'
  subject: string;
}

// Automation types for Phase 1
export interface AutomationSuggestion {
  id: number;
  entityType: string;
  entityId?: string;
  suggestionType: string;
  suggestionData: any;
  confidenceScore: number;
  accepted: boolean;
  createdAt: string;
  appliedAt?: string;
}

export interface WorkflowExecution {
  id: number;
  workflowType: string;
  triggerData: any;
  executionStatus: string;
  stepsCompleted: any[];
  resultData?: any;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface LearnedPattern {
  id: number;
  patternType: string;
  patternData: any;
  successCount: number;
  failureCount: number;
  confidenceScore: number;
  lastApplied?: string;
  createdAt: string;
}

export interface BulkOperation {
  id: number;
  operationType: string;
  entityType: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  operationData?: any;
  status: string;
  createdBy?: string;
  createdAt: string;
  completedAt?: string;
}

// Workflow types
export interface StudentCreationWorkflow {
  studentData: Partial<Student>;
  suggestedClass?: Class;
  potentialParents?: User[];
  recommendedSubjects?: Subject[];
}

export interface TeacherAssignmentWorkflow {
  teacherData: Partial<Teacher>;
  relevantClasses?: Class[];
  workloadBalance?: any;
  scheduleConflicts?: any[];
}

export interface ClassConfigurationWorkflow {
  classData: {
    name: string;
    subjectIds: string[];
    description?: string;
    maxCapacity?: string;
    roomNumber?: string;
  };
  suggestedSubjects?: Subject[];
  recommendedTeachers?: Teacher[];
  assessmentFrameworks?: any[];
  communicationTemplates?: any[];
}

// Smart form types
export type SmartFormMode = 'simple' | 'advanced' | 'wizard' | 'bulk';

export interface SmartFormConfig {
  mode: SmartFormMode;
  currentStep?: number;
  totalSteps?: number;
}

export interface FormValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  confidence: number;
  transformation?: string;
}

export interface BulkImportResult {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  operationId?: string;
}