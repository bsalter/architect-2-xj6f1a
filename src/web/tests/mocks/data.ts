/**
 * Contains mock data for testing the Interaction Management System, 
 * including sample users, sites, interactions, and authentication responses. 
 * This file serves as a central repository of test fixtures used across the test suite.
 */

import { 
  User, 
  LoginResponse 
} from '../../src/types/auth';
import { 
  Site, 
  SiteUserAssociation, 
  SiteUserRole 
} from '../../src/types/sites';
import { 
  Interaction, 
  InteractionType, 
  InteractionListResponse 
} from '../../src/types/interactions';
import { format, addDays, subDays } from 'date-fns'; // v2.30.0

// Mock Users
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    sites: [], // Will be populated after sites are defined
    lastLogin: '2023-08-01T10:00:00Z'
  },
  {
    id: 2,
    username: 'editor',
    email: 'editor@example.com',
    sites: [],
    lastLogin: '2023-08-02T14:30:00Z'
  },
  {
    id: 3,
    username: 'viewer',
    email: 'viewer@example.com',
    sites: [],
    lastLogin: '2023-08-03T09:15:00Z'
  },
  {
    id: 4,
    username: 'multisite',
    email: 'multisite@example.com',
    sites: [],
    lastLogin: '2023-08-04T16:45:00Z'
  }
];

// Mock Sites
export const mockSites: Site[] = [
  {
    id: 1,
    name: 'Marketing',
    description: 'Marketing department site',
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Sales',
    description: 'Sales department site',
    isActive: true,
    createdAt: '2023-01-02T00:00:00Z'
  },
  {
    id: 3,
    name: 'Support',
    description: 'Customer support site',
    isActive: true,
    createdAt: '2023-01-03T00:00:00Z'
  },
  {
    id: 4,
    name: 'Development',
    description: 'Development team site',
    isActive: false,
    createdAt: '2023-01-04T00:00:00Z'
  }
];

// Mock User-Site Associations
export const mockUserSiteAssociations: SiteUserAssociation[] = [
  {
    userId: 1,
    siteId: 1,
    role: SiteUserRole.ADMINISTRATOR
  },
  {
    userId: 1,
    siteId: 2,
    role: SiteUserRole.ADMINISTRATOR
  },
  {
    userId: 2,
    siteId: 1,
    role: SiteUserRole.EDITOR
  },
  {
    userId: 3,
    siteId: 1,
    role: SiteUserRole.VIEWER
  },
  {
    userId: 4,
    siteId: 1,
    role: SiteUserRole.EDITOR
  },
  {
    userId: 4,
    siteId: 2,
    role: SiteUserRole.EDITOR
  },
  {
    userId: 4,
    siteId: 3,
    role: SiteUserRole.VIEWER
  }
];

// Connect users with their sites
mockUsers.forEach(user => {
  user.sites = mockSites.filter(site => 
    mockUserSiteAssociations.some(
      association => association.userId === user.id && association.siteId === site.id
    )
  );
});

// Mock Interactions
const today = new Date();
const formatDate = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'");

export const mockInteractions: Interaction[] = [
  // Marketing Site Interactions
  {
    id: 1,
    title: 'Client Meeting',
    type: InteractionType.MEETING,
    lead: 'John Smith',
    startDateTime: formatDate(subDays(today, 5)),
    timezone: 'America/New_York',
    endDateTime: formatDate(subDays(today, 5)),
    location: 'Conference Room A',
    description: 'Initial meeting with client to discuss project requirements',
    notes: 'Client seemed interested in our proposal. Follow up next week.',
    siteId: 1,
    site: mockSites[0],
    createdBy: 2,
    createdByName: 'editor',
    createdAt: formatDate(subDays(today, 6)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  {
    id: 2,
    title: 'Team Update',
    type: InteractionType.UPDATE,
    lead: 'Alice Jones',
    startDateTime: formatDate(subDays(today, 4)),
    timezone: 'America/New_York',
    endDateTime: formatDate(subDays(today, 4)),
    location: 'Virtual',
    description: 'Weekly team update meeting',
    notes: 'Discussed campaign progress and upcoming deadlines',
    siteId: 1,
    site: mockSites[0],
    createdBy: 2,
    createdByName: 'editor',
    createdAt: formatDate(subDays(today, 7)),
    updatedBy: 1,
    updatedByName: 'admin',
    updatedAt: formatDate(subDays(today, 3))
  },
  {
    id: 3,
    title: 'Marketing Strategy Call',
    type: InteractionType.CALL,
    lead: 'John Smith',
    startDateTime: formatDate(subDays(today, 3)),
    timezone: 'America/New_York',
    endDateTime: formatDate(subDays(today, 3)),
    location: 'Phone',
    description: 'Discussion about Q4 marketing strategy',
    notes: 'Decided to focus on digital channels for Q4 campaign',
    siteId: 1,
    site: mockSites[0],
    createdBy: 1,
    createdByName: 'admin',
    createdAt: formatDate(subDays(today, 3)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  {
    id: 4,
    title: 'Client Presentation',
    type: InteractionType.MEETING,
    lead: 'Alice Jones',
    startDateTime: formatDate(subDays(today, 2)),
    timezone: 'America/New_York',
    endDateTime: formatDate(subDays(today, 2)),
    location: 'Conference Room B',
    description: 'Final presentation of marketing campaign to client',
    notes: 'Client approved the campaign with minor changes',
    siteId: 1,
    site: mockSites[0],
    createdBy: 2,
    createdByName: 'editor',
    createdAt: formatDate(subDays(today, 2)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  {
    id: 5,
    title: 'Campaign Review',
    type: InteractionType.REVIEW,
    lead: 'John Smith',
    startDateTime: formatDate(subDays(today, 1)),
    timezone: 'America/New_York',
    endDateTime: formatDate(subDays(today, 1)),
    location: 'Meeting Room A',
    description: 'Review of Q3 campaign performance',
    notes: 'Campaign exceeded targets by 15%. Team recognized for excellent work.',
    siteId: 1,
    site: mockSites[0],
    createdBy: 1,
    createdByName: 'admin',
    createdAt: formatDate(subDays(today, 1)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  {
    id: 6,
    title: 'Marketing Tools Training',
    type: InteractionType.TRAINING,
    lead: 'Alice Jones',
    startDateTime: formatDate(today),
    timezone: 'America/New_York',
    endDateTime: formatDate(today),
    location: 'Training Room',
    description: 'Training session on new marketing analytics tools',
    notes: 'All team members to complete follow-up exercises by next week',
    siteId: 1,
    site: mockSites[0],
    createdBy: 2,
    createdByName: 'editor',
    createdAt: formatDate(subDays(today, 7)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  {
    id: 7,
    title: 'Future Marketing Planning',
    type: InteractionType.MEETING,
    lead: 'John Smith',
    startDateTime: formatDate(addDays(today, 1)),
    timezone: 'America/New_York',
    endDateTime: formatDate(addDays(today, 1)),
    location: 'Conference Room A',
    description: 'Planning session for upcoming marketing initiatives',
    notes: 'Draft budget to be ready for review by end of session',
    siteId: 1,
    site: mockSites[0],
    createdBy: 1,
    createdByName: 'admin',
    createdAt: formatDate(subDays(today, 14)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  
  // Sales Site Interactions
  {
    id: 8,
    title: 'Sales Team Meeting',
    type: InteractionType.MEETING,
    lead: 'Robert Davis',
    startDateTime: formatDate(subDays(today, 5)),
    timezone: 'America/Chicago',
    endDateTime: formatDate(subDays(today, 5)),
    location: 'Sales Department',
    description: 'Monthly sales team meeting',
    notes: 'Reviewed targets and assigned territories for new team members',
    siteId: 2,
    site: mockSites[1],
    createdBy: 4,
    createdByName: 'multisite',
    createdAt: formatDate(subDays(today, 6)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  {
    id: 9,
    title: 'Client Contract Negotiation',
    type: InteractionType.MEETING,
    lead: 'Robert Davis',
    startDateTime: formatDate(subDays(today, 3)),
    timezone: 'America/Chicago',
    endDateTime: formatDate(subDays(today, 3)),
    location: 'Client Office',
    description: 'Final contract negotiation with Enterprise client',
    notes: 'Successfully closed $500K annual contract',
    siteId: 2,
    site: mockSites[1],
    createdBy: 1,
    createdByName: 'admin',
    createdAt: formatDate(subDays(today, 4)),
    updatedBy: 4,
    updatedByName: 'multisite',
    updatedAt: formatDate(subDays(today, 2))
  },
  {
    id: 10,
    title: 'Sales Strategy Call',
    type: InteractionType.CALL,
    lead: 'Robert Davis',
    startDateTime: formatDate(subDays(today, 1)),
    timezone: 'America/Chicago',
    endDateTime: formatDate(subDays(today, 1)),
    location: 'Phone',
    description: 'Discussion about Q4 sales strategy',
    notes: 'Targeting 20% growth in enterprise segment',
    siteId: 2,
    site: mockSites[1],
    createdBy: 4,
    createdByName: 'multisite',
    createdAt: formatDate(subDays(today, 1)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  {
    id: 11,
    title: 'Sales Training Session',
    type: InteractionType.TRAINING,
    lead: 'Sarah Wilson',
    startDateTime: formatDate(addDays(today, 2)),
    timezone: 'America/Chicago',
    endDateTime: formatDate(addDays(today, 2)),
    location: 'Training Room',
    description: 'New product training for sales team',
    notes: 'All sales representatives must attend',
    siteId: 2,
    site: mockSites[1],
    createdBy: 1,
    createdByName: 'admin',
    createdAt: formatDate(subDays(today, 10)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  
  // Support Site Interactions
  {
    id: 12,
    title: 'Support Team Update',
    type: InteractionType.UPDATE,
    lead: 'Emily Clark',
    startDateTime: formatDate(subDays(today, 4)),
    timezone: 'America/Los_Angeles',
    endDateTime: formatDate(subDays(today, 4)),
    location: 'Support Office',
    description: 'Weekly support team status update',
    notes: 'Ticket volume down 10% from previous week',
    siteId: 3,
    site: mockSites[2],
    createdBy: 4,
    createdByName: 'multisite',
    createdAt: formatDate(subDays(today, 5)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  {
    id: 13,
    title: 'Customer Support Review',
    type: InteractionType.REVIEW,
    lead: 'Emily Clark',
    startDateTime: formatDate(subDays(today, 2)),
    timezone: 'America/Los_Angeles',
    endDateTime: formatDate(subDays(today, 2)),
    location: 'Conference Room C',
    description: 'Monthly review of customer support metrics',
    notes: 'Customer satisfaction scores improved to 92%',
    siteId: 3,
    site: mockSites[2],
    createdBy: 4,
    createdByName: 'multisite',
    createdAt: formatDate(subDays(today, 3)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
  {
    id: 14,
    title: 'Support Process Training',
    type: InteractionType.TRAINING,
    lead: 'Emily Clark',
    startDateTime: formatDate(addDays(today, 3)),
    timezone: 'America/Los_Angeles',
    endDateTime: formatDate(addDays(today, 3)),
    location: 'Training Room',
    description: 'Training on updated support procedures',
    notes: 'Mandatory for all support staff',
    siteId: 3,
    site: mockSites[2],
    createdBy: 4,
    createdByName: 'multisite',
    createdAt: formatDate(subDays(today, 7)),
    updatedBy: null,
    updatedByName: null,
    updatedAt: null
  },
];

// Mock successful login response
export const mockLoginResponse: LoginResponse = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwic2l0ZXMiOlsxLDJdLCJleHAiOjE2OTMzMjk2MDAsImlhdCI6MTY5MzI0MzIwMH0.8zBmIXrTk-hGE1cZv0Qj9mh8VLCdUaiasnqqjK8cM9c',
  user: mockUsers[0],
  expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
  status: 'success'
};

/**
 * Generates a mock JWT token for testing authentication
 * @param userId User ID to include in the token
 * @param siteIds Array of site IDs the user has access to
 * @returns A fake JWT token string
 */
export function generateMockToken(userId: number, siteIds: number[]): string {
  // Create a fake header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Create a fake payload
  const payload = {
    sub: mockUsers.find(u => u.id === userId)?.username || 'unknown',
    userId: userId,
    sites: siteIds,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Base64 encode the header and payload
  // Using a simplified base64 encoding approach for browser compatibility
  const base64Encode = (obj: any): string => {
    const str = JSON.stringify(obj);
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };
  
  const headerBase64 = base64Encode(header);
  const payloadBase64 = base64Encode(payload);
  
  // Create a fake signature (in a real JWT this would be cryptographically signed)
  const signature = 'fakesignature123456789abcdef';
  
  // Combine to create the token
  return `${headerBase64}.${payloadBase64}.${signature}`;
}

/**
 * Generates a paginated response of interactions based on filters
 * @param params Search parameters including page, pageSize, search term, and filters
 * @returns Paginated interaction response
 */
export function generatePaginatedInteractions(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: {
    title?: string;
    type?: InteractionType;
    lead?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  };
  siteId?: number;
}): InteractionListResponse {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    sortField = 'startDateTime',
    sortDirection = 'desc',
    filters = {},
    siteId
  } = params;
  
  // Filter interactions
  let filteredInteractions = [...mockInteractions];
  
  // Apply site filter if provided
  if (siteId !== undefined) {
    filteredInteractions = filteredInteractions.filter(interaction => interaction.siteId === siteId);
  }
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    filteredInteractions = filteredInteractions.filter(interaction => 
      interaction.title.toLowerCase().includes(searchLower) ||
      interaction.lead.toLowerCase().includes(searchLower) ||
      interaction.location.toLowerCase().includes(searchLower) ||
      interaction.description.toLowerCase().includes(searchLower) ||
      interaction.notes.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply specific filters if provided
  if (filters.title) {
    filteredInteractions = filteredInteractions.filter(interaction =>
      interaction.title.toLowerCase().includes(filters.title!.toLowerCase())
    );
  }
  
  if (filters.type) {
    filteredInteractions = filteredInteractions.filter(interaction =>
      interaction.type === filters.type
    );
  }
  
  if (filters.lead) {
    filteredInteractions = filteredInteractions.filter(interaction =>
      interaction.lead.toLowerCase().includes(filters.lead!.toLowerCase())
    );
  }
  
  if (filters.location) {
    filteredInteractions = filteredInteractions.filter(interaction =>
      interaction.location.toLowerCase().includes(filters.location!.toLowerCase())
    );
  }
  
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filteredInteractions = filteredInteractions.filter(interaction =>
      new Date(interaction.startDateTime) >= startDate
    );
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    filteredInteractions = filteredInteractions.filter(interaction =>
      new Date(interaction.endDateTime) <= endDate
    );
  }
  
  // Apply sorting
  filteredInteractions.sort((a: any, b: any) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc' 
      ? (aValue > bValue ? 1 : -1) 
      : (bValue > aValue ? 1 : -1);
  });
  
  // Calculate pagination
  const totalRecords = filteredInteractions.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedInteractions = filteredInteractions.slice(startIndex, endIndex);
  
  // Return paginated result
  return {
    interactions: paginatedInteractions,
    meta: {
      pagination: {
        page,
        pageSize,
        totalPages,
        totalRecords
      }
    }
  };
}