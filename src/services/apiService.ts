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
  id?: string;
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
  status: 'present' | 'absent' | 'late' | 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'voice' | 'file';
  content?: string;
  audioSrc?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    mimetype: string;
    size: number;
    url: string;
  }>;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log('Making API request:', {
        url: `${API_BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        hasBody: !!options.body,
        bodyType: options.body ? (options.body instanceof FormData ? 'FormData' : 'JSON') : 'none'
      });

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...options.headers,
        },
        ...options,
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request error:', {
          status: response.status,
          statusText: response.statusText,
          url: `${API_BASE_URL}${endpoint}`,
          errorText
        });
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

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

  // Create a new class
  async createClass(name: string): Promise<Class> {
    console.log('=== CREATE CLASS API DEBUG ===');
    console.log('Class name:', name);
    
    const response = await this.request<{success: boolean, class: Class}>('/classes', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    
    console.log('Raw API response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response));
    
    // The server returns {success: true, class: {...}}
    // But response.data might be undefined, so check the response directly
    if (response && response.class) {
      console.log('Extracted class from response:', response.class);
      return response.class;
    } else if (response.data && response.data.class) {
      console.log('Extracted class from response.data:', response.data.class);
      return response.data.class;
    } else {
      console.error('Invalid response format:', response);
      throw new Error('Invalid response format from server');
    }
  }

  // Get all subjects
  async getAllSubjects(): Promise<Subject[]> {
    const response = await this.request<Subject[]>('/subjects');
    return Array.isArray(response) ? response : (response as any).data || [];
  }

  // Create a new subject
  async createSubject(name: string): Promise<Subject> {
    console.log('=== CREATE SUBJECT API DEBUG ===');
    console.log('Subject name:', name);
    
    const response = await this.request<{success: boolean, subject: Subject}>('/subjects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    
    console.log('Raw API response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response));
    
    // The server returns {success: true, subject: {...}}
    // But response.data might be undefined, so check the response directly
    if (response && response.subject) {
      console.log('Extracted subject from response:', response.subject);
      return response.subject;
    } else if (response.data && response.data.subject) {
      console.log('Extracted subject from response.data:', response.data.subject);
      return response.data.subject;
    } else {
      console.error('Invalid response format:', response);
      throw new Error('Invalid response format from server');
    }
  }

  // Delete a class
  async deleteClass(classId: string): Promise<void> {
    await this.request(`/classes/${classId}`, {
      method: 'DELETE',
    });
  }

  // Delete a subject
  async deleteSubject(subjectId: string): Promise<void> {
    await this.request(`/subjects/${subjectId}`, {
      method: 'DELETE',
    });
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

  // Create new homework
  async createHomework(homework: Omit<Homework, 'id'>): Promise<Homework> {
    const response = await this.request<Homework>('/homework', {
      method: 'POST',
      body: JSON.stringify(homework),
    });
    return response.data || response as Homework;
  }

  // Update homework
  async updateHomework(id: string, homework: Partial<Homework>): Promise<Homework> {
    const response = await this.request<Homework>(`/homework/${id}`, {
      method: 'PUT',
      body: JSON.stringify(homework),
    });
    return response.data || response as Homework;
  }

  // Delete homework
  async deleteHomework(id: string): Promise<void> {
    await this.request(`/homework/${id}`, {
      method: 'DELETE',
    });
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

  // Add attendance record
  async addAttendance(attendance: Omit<Attendance, 'id'>): Promise<Attendance> {
    const response = await this.request<Attendance>('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendance),
    });
    return response.data!;
  }

  // Update attendance record
  async updateAttendance(id: string, attendance: Partial<Attendance>): Promise<Attendance> {
    const response = await this.request<Attendance>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendance),
    });
    return response.data!;
  }

  // Get all messages
  async getAllMessages(): Promise<Message[]> {
    const response = await this.request<Message[]>('/messages');
    return Array.isArray(response) ? response : (response as any).data || [];
  }

  // Send a message
  async sendMessage(message: Omit<Message, 'id'> & { files?: File[] }): Promise<Message> {
    const formData = new FormData();
    
    // Add message data
    formData.append('senderId', message.senderId);
    formData.append('receiverId', message.receiverId);
    formData.append('timestamp', message.timestamp);
    formData.append('isRead', message.isRead.toString());
    formData.append('type', message.type);
    if (message.content) {
      formData.append('content', message.content);
    }
    
    // Add files if any
    if (message.files) {
      message.files.forEach(file => {
        formData.append('files', file);
      });
    }
    
    const response = await this.request<Message>('/messages', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
    return response.data || response as Message;
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

  // Update user
  async updateUser(userId: string, updates: { avatar?: string; name?: string; messagingAvailability?: any }): Promise<User> {
    console.log('=== API UPDATE USER DEBUG ===');
    console.log('User ID:', userId);
    console.log('Updates:', updates);
    console.log('Has avatar update:', !!updates.avatar);
    if (updates.avatar) {
      console.log('Avatar length:', updates.avatar.length);
      console.log('Avatar preview:', updates.avatar.substring(0, 100) + '...');
    }
    
    const response = await this.request<User>(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    console.log('API response:', response);
    return response.data!;
  }

  // Health check
  async healthCheck(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/health');
    return response.data!;
  }

  // Backup functionality
  async createBackup(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/backup/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to create backup');
    }
    
    return response.blob();
  }

  async getBackupStats(): Promise<any> {
    const response = await this.request<any>('/backup/stats');
    return response.data || response;
  }
}

export default new ApiService(); 