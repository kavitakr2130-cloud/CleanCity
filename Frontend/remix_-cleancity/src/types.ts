/**
 * CleanCity - Smart Grievance Management System
 * Shared TypeScript Types
 */

export type ComplaintStatus = 'SUBMITTED' | 'VERIFIED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'REOPENED';

export type ComplaintCategory = 'Household' | 'Plastic' | 'Construction' | 'Hazardous' | 'Other';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type VehicleStatus = 'Available' | 'Assigned' | 'On Route' | 'Cleaning' | 'Cleaning in Progress' | 'Completed' | 'Maintenance';

export interface Vehicle {
  id: string; // e.g., 'GV-101'
  number: string; // 'GV-101'
  type: 'Garbage Truck' | 'Mini Collection Vehicle' | 'JCB';
  status: VehicleStatus;
  driverName?: string;
}

export interface LiveUpdate {
  time: string;
  text: string;
  author?: string;
}

export interface ComplaintComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  time: string;
  isAdmin: boolean;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  latitude: number;
  longitude: number;
  address: string;
  beforeImage: string;
  afterImage?: string;
  submitTime: string;
  submitTimestamp?: number;
  isDirectSubmit?: boolean;
  verifyTime?: string;
  assignTime?: string;
  resolveTime?: string;
  citizenId: string;
  citizenName: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedVehicle?: Vehicle;
  vehicleAssignedTime?: string;
  assignedSupervisorId?: string;
  assignedSupervisorName?: string;
  liveUpdates: LiveUpdate[];
  comments: ComplaintComment[];
  rating?: number;
  feedback?: string;
  rejectionReason?: string;
  estimatedCompletionTime?: string;
  remainingSlaTime?: string;
  aiAnalysis?: {
    confidence: number;
    detectedCategory: ComplaintCategory;
    suggestedPriority: ComplaintPriority;
    severityScore: number; // 0 to 100
  };
}

export interface Citizen {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  password?: string;
  cleanPoints: number;
  rank: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  avatar: string;
}

export interface WorkforceTeam {
  id: string;
  name: string;
  leader: string;
  rating: number; // e.g. 4.9
  avatar: string;
  memberCount: number;
  status: 'IDLE' | 'BUSY';
  vehicleNumber: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  complaintId?: string;
}

export interface WardPerformance {
  ward: string;
  efficiency: number; // percentage
  totalComplaints: number;
  pending: number;
  resolved: number;
}

export interface ComplaintFeedback {
  id: string;
  complaintId: string;
  complaintCategory: ComplaintCategory;
  submissionDate: string;
  resolutionQuality: number;
  staffBehaviour: number;
  responseTime: number;
  overallExperience: number;
  citizenComment: string;
  feedbackStatus: string;
  appUsabilityRating?: number;
}

