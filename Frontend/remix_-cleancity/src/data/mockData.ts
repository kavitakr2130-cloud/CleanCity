import { Complaint, Citizen, AppNotification, WorkforceTeam, WardPerformance, ComplaintFeedback, Vehicle } from '../types';

// Citizen User Profile
export const mockCitizen: Citizen = {
  id: 'CITIZEN_4421',
  name: 'Citizen User',
  phoneNumber: '+91 98765 43210',
  cleanPoints: 1240,
  rank: 'SILVER',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
};

// Workforce Teams
export const mockWorkforceTeams: WorkforceTeam[] = [
  {
    id: 'TEAM_DELTA_4',
    name: 'Delta-4 Cleanup Crew',
    leader: 'Sarah J.',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=200',
    memberCount: 5,
    status: 'BUSY',
    vehicleNumber: 'TX-2204'
  },
  {
    id: 'TEAM_ALPHA_1',
    name: 'Alpha-1 Eco Team',
    leader: 'John Davis',
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    memberCount: 4,
    status: 'IDLE',
    vehicleNumber: 'TX-1105'
  },
  {
    id: 'TEAM_OMEGA_3',
    name: 'Omega-3 Rapid Response',
    leader: 'Carlos M.',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=200',
    memberCount: 6,
    status: 'IDLE',
    vehicleNumber: 'TX-8840'
  }
];

// Municipal Vehicles
export const mockVehicles: Vehicle[] = [
  { id: 'V-101', number: 'GV-101', type: 'Garbage Truck', status: 'Available', driverName: 'Rajesh Kumar' },
  { id: 'V-102', number: 'GV-102', type: 'Mini Collection Vehicle', status: 'Available', driverName: 'Sunil Singh' },
  { id: 'V-103', number: 'GV-103', type: 'JCB', status: 'Available', driverName: 'Vikram Lal' },
  { id: 'V-104', number: 'TX-2204', type: 'Garbage Truck', status: 'Assigned', driverName: 'Ramesh Kumar' },
  { id: 'V-105', number: 'TX-1105', type: 'Mini Collection Vehicle', status: 'Available', driverName: 'Anil Dutt' },
  { id: 'V-106', number: 'TX-8840', type: 'JCB', status: 'Available', driverName: 'Mahesh Pal' },
  { id: 'V-107', number: 'GV-107', type: 'Garbage Truck', status: 'Available', driverName: 'Suresh Sharma' },
  { id: 'V-108', number: 'GV-108', type: 'Mini Collection Vehicle', status: 'Available', driverName: 'Amit Gupta' },
  { id: 'V-109', number: 'GV-109', type: 'JCB', status: 'Maintenance', driverName: 'Vijay Verma' },
  { id: 'V-110', number: 'GV-110', type: 'Garbage Truck', status: 'Assigned', driverName: 'Harish Rawat' },
  { id: 'V-111', number: 'GV-111', type: 'Mini Collection Vehicle', status: 'Assigned', driverName: 'Satish Yadav' },
  { id: 'V-112', number: 'GV-112', type: 'Garbage Truck', status: 'Assigned', driverName: 'Sandeep Patil' },
  { id: 'V-113', number: 'GV-113', type: 'Mini Collection Vehicle', status: 'Assigned', driverName: 'Devendra Joshi' },
  { id: 'V-114', number: 'GV-114', type: 'JCB', status: 'Maintenance', driverName: 'Rohit Sen' },
  { id: 'V-115', number: 'GV-115', type: 'Garbage Truck', status: 'Assigned', driverName: 'Manoj Tiwari' },
  { id: 'V-116', number: 'GV-116', type: 'Mini Collection Vehicle', status: 'Available', driverName: 'Pankaj Mishra' },
  { id: 'V-117', number: 'GV-117', type: 'Garbage Truck', status: 'Available', driverName: 'Rahul Dubey' },
  { id: 'V-118', number: 'GV-118', type: 'JCB', status: 'Available', driverName: 'Ajay Chawla' },
];

// Ward Efficiency Statistics
export const mockWardPerformance: WardPerformance[] = [
  { ward: 'Ward 04', efficiency: 98, totalComplaints: 284, pending: 15, resolved: 269 },
  { ward: 'Ward 12', efficiency: 82, totalComplaints: 195, pending: 35, resolved: 160 },
  { ward: 'Ward 19', efficiency: 91, totalComplaints: 142, pending: 12, resolved: 130 },
  { ward: 'Ward 02', efficiency: 77, totalComplaints: 110, pending: 25, resolved: 85 },
  { ward: 'Ward 07', efficiency: 65, totalComplaints: 130, pending: 45, resolved: 85 }
];

// Initial List of Complaints
export const mockComplaints: Complaint[] = [
  {
    id: 'CC-9821',
    title: 'Illegal Waste Dumping',
    description: 'Illegal Waste Dumping near Central Park North Entrance - pile of plastic bottles, garbage bags, and discarded cardboard boxes.',
    category: 'Plastic',
    status: 'ASSIGNED',
    priority: 'HIGH',
    latitude: 40.7968,
    longitude: -73.9548,
    address: 'Central Park North Entrance, 110th St, New York, NY',
    beforeImage: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800',
    submitTime: 'Oct 24, 2023, 09:15 AM',
    verifyTime: 'Oct 24, 2023, 11:30 AM',
    assignTime: 'Oct 25, 2023, 08:45 AM',
    citizenId: 'CITIZEN_4421',
    citizenName: 'Citizen User',
    assignedTeamId: 'TEAM_DELTA_4',
    assignedTeamName: 'Delta-4 Cleanup Crew',
    assignedVehicle: { id: 'V-104', number: 'TX-2204', type: 'Garbage Truck', status: 'Assigned', driverName: 'Ramesh Kumar' },
    liveUpdates: [
      { time: '08:45 AM', text: 'Team Delta-4 has reached the site and is beginning the cleanup process.' },
      { time: '07:20 AM', text: 'Work order #CC-9821 scheduled for morning shift dispatch.' },
      { time: 'Yesterday, 11:30 AM', text: 'Complaint verified. Categorized as "Public Hazard - Illegal Dumping".' },
      { time: 'Yesterday, 09:15 AM', text: 'New complaint submitted via Citizen App by User ID #4421.' }
    ],
    comments: [
      {
        id: 'c1',
        authorName: 'Sarah J. (Crew Lead)',
        text: 'Crew is 200m away from site. Setting up cleaning materials now.',
        time: 'Oct 25, 08:35 AM',
        isAdmin: true
      }
    ],
    aiAnalysis: {
      confidence: 94,
      detectedCategory: 'Plastic',
      suggestedPriority: 'HIGH',
      severityScore: 78
    }
  },
  {
    id: 'CC-9210',
    title: 'Overflowing Bin',
    description: 'A public trash receptacle on the corner is overflowing, scattering trash onto the sidewalk and attracting rodents.',
    category: 'Household',
    status: 'SUBMITTED',
    priority: 'HIGH',
    latitude: 40.7580,
    longitude: -73.9855,
    address: '42nd Ave, Market St.',
    beforeImage: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800',
    submitTime: 'Oct 26, 2023, 09:40 AM',
    citizenId: 'CITIZEN_4421',
    citizenName: 'Citizen User',
    liveUpdates: [
      { time: '09:40 AM', text: 'Complaint submitted successfully. AI auto-validation in progress.' }
    ],
    comments: [],
    aiAnalysis: {
      confidence: 88,
      detectedCategory: 'Household',
      suggestedPriority: 'HIGH',
      severityScore: 82
    }
  },
  {
    id: 'CC-9208',
    title: 'Clogged Drain',
    description: 'The street drain near the park entrance is blocked with leaves and trash, causing minor flooding across the walking path.',
    category: 'Construction',
    status: 'SUBMITTED',
    priority: 'MEDIUM',
    latitude: 40.7829,
    longitude: -73.9654,
    address: 'Greenway Park Entrance',
    beforeImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800',
    submitTime: 'Oct 26, 2023, 08:22 AM',
    citizenId: 'CITIZEN_OTHER',
    citizenName: 'Jane Smith',
    liveUpdates: [
      { time: '08:22 AM', text: 'Complaint submitted by Jane Smith.' }
    ],
    comments: [],
    aiAnalysis: {
      confidence: 76,
      detectedCategory: 'Construction',
      suggestedPriority: 'MEDIUM',
      severityScore: 54
    }
  },
  {
    id: 'CC-9195',
    title: 'Green Waste Dump',
    description: 'A large pile of tree branches and grass clippings has been dumped on the public square.',
    category: 'Other',
    status: 'RESOLVED',
    priority: 'LOW',
    latitude: 40.7282,
    longitude: -73.9942,
    address: 'Old Town Square',
    beforeImage: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=800',
    afterImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800',
    submitTime: 'Oct 24, 2023, 11:15 PM',
    verifyTime: 'Oct 25, 2023, 08:15 AM',
    assignTime: 'Oct 25, 2023, 09:00 AM',
    resolveTime: 'Oct 25, 2023, 03:00 PM',
    citizenId: 'CITIZEN_4421',
    citizenName: 'Citizen User',
    assignedTeamId: 'TEAM_ALPHA_1',
    assignedTeamName: 'Alpha-1 Eco Team',
    assignedVehicle: { id: 'V-105', number: 'TX-1105', type: 'Mini Collection Vehicle', status: 'Completed', driverName: 'Anil Dutt' },
    liveUpdates: [
      { time: '03:00 PM', text: 'Area fully cleared and washed. Complaint marked as Resolved.' },
      { time: '09:00 AM', text: 'Alpha-1 Eco Team dispatched to site.' },
      { time: '08:15 AM', text: 'Complaint verified as Non-Hazardous Organic waste.' },
      { time: 'Yesterday, 11:15 PM', text: 'Complaint submitted via web portal.' }
    ],
    comments: [],
    aiAnalysis: {
      confidence: 90,
      detectedCategory: 'Other',
      suggestedPriority: 'LOW',
      severityScore: 35
    }
  }
];

// Initial App Notifications
export const mockNotifications: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Complaint Update: CC-9821',
    message: 'Your report "Illegal Waste Dumping" has been assigned to Delta-4 Cleanup Crew and is currently In Progress.',
    time: 'Oct 25, 08:45 AM',
    read: false,
    complaintId: 'CC-9821'
  },
  {
    id: 'notif_2',
    title: 'Points Earned!',
    message: 'Congratulations! You earned 100 Clean Points for resolving your "Green Waste Dump" report.',
    time: 'Oct 25, 03:05 PM',
    read: true,
    complaintId: 'CC-9195'
  },
  {
    id: 'notif_3',
    title: 'Verification complete',
    message: 'Our dispatch team has successfully verified your "Illegal Waste Dumping" complaint.',
    time: 'Oct 24, 11:30 AM',
    read: true,
    complaintId: 'CC-9821'
  }
];

// Helper to access LocalStorage with fallbacks
export const storage = {
  getComplaints: (): Complaint[] => {
    try {
      const data = localStorage.getItem('cleancity_complaints');
      return data ? JSON.parse(data) : mockComplaints;
    } catch {
      return mockComplaints;
    }
  },
  setComplaints: (complaints: Complaint[]) => {
    try {
      localStorage.setItem('cleancity_complaints', JSON.stringify(complaints));
    } catch (e) {
      console.error(e);
    }
  },
  getUser: (): Citizen => {
    try {
      const data = localStorage.getItem('cleancity_user');
      return data ? JSON.parse(data) : mockCitizen;
    } catch {
      return mockCitizen;
    }
  },
  setUser: (user: Citizen) => {
    try {
      localStorage.setItem('cleancity_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  },
  getNotifications: (): AppNotification[] => {
    try {
      const data = localStorage.getItem('cleancity_notifications');
      return data ? JSON.parse(data) : mockNotifications;
    } catch {
      return mockNotifications;
    }
  },
  setNotifications: (notifications: AppNotification[]) => {
    try {
      localStorage.setItem('cleancity_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  },
  getTeams: (): WorkforceTeam[] => {
    try {
      const data = localStorage.getItem('cleancity_teams');
      return data ? JSON.parse(data) : mockWorkforceTeams;
    } catch {
      return mockWorkforceTeams;
    }
  },
  setTeams: (teams: WorkforceTeam[]) => {
    try {
      localStorage.setItem('cleancity_teams', JSON.stringify(teams));
    } catch (e) {
      console.error(e);
    }
  },
  getFeedbacks: (): ComplaintFeedback[] => {
    try {
      const data = localStorage.getItem('cleancity_feedbacks');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setFeedbacks: (feedbacks: ComplaintFeedback[]) => {
    try {
      localStorage.setItem('cleancity_feedbacks', JSON.stringify(feedbacks));
    } catch (e) {
      console.error(e);
    }
  },
  getVehicles: (): Vehicle[] => {
    try {
      const data = localStorage.getItem('cleancity_vehicles');
      return data ? JSON.parse(data) : mockVehicles;
    } catch {
      return mockVehicles;
    }
  },
  setVehicles: (vehicles: Vehicle[]) => {
    try {
      localStorage.setItem('cleancity_vehicles', JSON.stringify(vehicles));
    } catch (e) {
      console.error(e);
    }
  }
};

export interface AuthorityUser {
  employeeId: string;
  email: string;
  password: string;
  name: string;
  subrole: 'Admin' | 'Supervisor' | 'Field Worker';
  avatar: string;
  roleLabel: string;
}

const defaultAuthorityUsers: AuthorityUser[] = [
  {
    employeeId: 'EMP-ADMIN-01',
    email: 'admin@cleancity.gov',
    password: 'adminPassword123',
    name: 'Admin Dispatcher',
    subrole: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    roleLabel: 'Central Control'
  },
  {
    employeeId: 'EMP-SUPER-02',
    email: 'supervisor@cleancity.gov',
    password: 'superPassword123',
    name: 'Supervisor Rajesh',
    subrole: 'Supervisor',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    roleLabel: 'North Zone • Sector 4'
  },
  {
    employeeId: 'EMP-WORKER-03',
    email: 'worker@cleancity.gov',
    password: 'workerPassword123',
    name: 'Crew Leader Amit',
    subrole: 'Field Worker',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    roleLabel: 'Field Crew #4 (Idle)'
  }
];

export const getStoredAuthorityUsers = (): AuthorityUser[] => {
  try {
    const data = localStorage.getItem('cleancity_authority_users');
    return data ? JSON.parse(data) : defaultAuthorityUsers;
  } catch {
    return defaultAuthorityUsers;
  }
};

export const saveStoredAuthorityUsers = (users: AuthorityUser[]) => {
  try {
    localStorage.setItem('cleancity_authority_users', JSON.stringify(users));
  } catch (e) {
    console.error(e);
  }
};

export let mockAuthorityUsers: AuthorityUser[] = getStoredAuthorityUsers();

export const updateAuthorityUserPasswordInMock = (employeeId: string, newPassword: string) => {
  const users = getStoredAuthorityUsers();
  const updated = users.map(u => {
    if (u.employeeId.toLowerCase().trim() === employeeId.toLowerCase().trim()) {
      return { ...u, password: newPassword };
    }
    return u;
  });
  saveStoredAuthorityUsers(updated);
  mockAuthorityUsers = updated;
};

