// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // If VITE_API_URL is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Always use Railway URL for now (since local server isn't running)
  const url = 'https://edcon-production.up.railway.app/api';
  console.log('🔗 Using API URL:', url);
  return url;
  
  // In development, default to localhost (uncomment when local server is running)
  // return 'http://localhost:5005/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  avatar?: string;
}

export interface Class {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Grade {
  _id?: string;
  studentId: string;
  subject: string;
  assignment: string;
  marksObtained: number;
  maxMarks: number;
  date: string;
  type: 'quiz' | 'test' | 'homework' | 'project' | 'exam';
}

export interface Homework {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  assignedDate: string;
  teacherId: string;
  submitted: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  teacherId: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Attendance {
  date: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'voice';
  content?: string;
  audioSrc?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      // For endpoints that return data directly (not wrapped in data property)
      if (endpoint === '/auth/create') {
        return { success: true, data: data };
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication
  async login(code: string): Promise<ApiResponse<{ user: User }>> {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    
    // Handle both response formats (direct user object or { success: true, user })
    const responseAny = response as any;
    if (responseAny.success && responseAny.user) {
      return response as ApiResponse<{ user: User }>;
    } else if (responseAny.id && responseAny.name && responseAny.role) {
      // Backend returns user object directly
      return { success: true, user: responseAny } as ApiResponse<{ user: User }>;
    } else {
      throw new Error('Invalid response format from login endpoint');
    }
  }

  // Create user (admin only)
  async createUser(user: { name: string; role: string; avatar?: string; [key: string]: any }): Promise<{ code: string; user: User }> {
    console.log('=== API CREATE USER DEBUG ===');
    console.log('Creating user with data:', user);
    console.log('API URL:', `${API_BASE_URL}/auth/create`);
    
    const response = await this.request<{ code: string; user: User }>('/auth/create', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    
    console.log('API response:', response);
    return response.data!;
  }

  // Get user codes (admin only)
  async getUserCodes(role?: string): Promise<User[]> {
    const endpoint = role ? `/auth/codes?role=${role}` : '/auth/codes';
    const response = await this.request<User[]>(endpoint);
    if (Array.isArray(response)) {
      return response;
    }
    return (response as any).data || [];
  }

  // Get all users
  async getAllUsers(): Promise<User[]> {
    const response = await this.request<User[]>('/auth/users');
    if (Array.isArray(response)) {
      return response;
    }
    return (response as any).data || [];
  }

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/auth/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Get all classes
  async getAllClasses(): Promise<Class[]> {
    const response = await this.request<Class[]>('/classes');
    return Array.isArray(response) ? response : (response as any).data || [];
  }

  // Get all subjects
  async getAllSubjects(): Promise<Subject[]> {
    const response = await this.request<Subject[]>('/subjects');
    return Array.isArray(response) ? response : (response as any).data || [];
  }

  // Get all grades
  async getAllGrades(): Promise<Grade[]> {
    const response = await this.request<Grade[]>('/grades');
    return Array.isArray(response) ? response : (response as any).data || [];
  }

  // Get all homework
  async getAllHomework(): Promise<Homework[]> {
    const response = await this.request<Homework[]>('/homework');
    return Array.isArray(response) ? response : (response as any).data || [];
  }

  // Get all announcements
  async getAllAnnouncements(): Promise<Announcement[]> {
    const response = await this.request<Announcement[]>('/announcements');
    return Array.isArray(response) ? response : (response as any).data || [];
  }

  // Get all attendance
  async getAllAttendance(): Promise<Attendance[]> {
    const response = await this.request<Attendance[]>('/attendance');
    return Array.isArray(response) ? response : (response as any).data || [];
  }

  // Get all messages
  async getAllMessages(): Promise<Message[]> {
    const response = await this.request<Message[]>('/messages');
    return Array.isArray(response) ? response : (response as any).data || [];
  }

  // Get student grades
  async getStudentGrades(studentId: string): Promise<Grade[]> {
    const response = await this.request<Grade[]>(`/grades/student/${studentId}`);
    return response.data || [];
  }

  async addGrade(grade: Omit<Grade, '_id'>): Promise<Grade> {
    const response = await this.request<Grade>('/grades', {
      method: 'POST',
      body: JSON.stringify(grade),
    });
    return response.data!;
  }

  async updateGrade(id: string, grade: Partial<Grade>): Promise<Grade> {
    const response = await this.request<Grade>(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grade),
    });
    return response.data!;
  }

  async deleteGrade(id: string): Promise<void> {
    await this.request(`/grades/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/health');
    return response.data!;
  }
}

export default new ApiService(); 