
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, UserRole, Grade, Homework, Announcement, Attendance, Class, Student, Teacher, Subject, Message, TimetableEntry } from './types';
import LoginScreen from './screens/LoginScreen';
import ParentDashboard from './screens/ParentDashboard';
import TeacherDashboard from './screens/TeacherDashboard';
import AdminDashboard from './screens/NewAdminDashboard';
import { translations } from './constants';
import apiService from './services/apiService';

export interface AppContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    lang: string;
    setLang: (lang: string) => void;
    t: (key: string, replacements?: Record<string, string>) => string;
    dir: 'ltr' | 'rtl';
    // Data
    users: User[];
    students: Student[];
    classes: Class[];
    teachers: Teacher[];
    subjects: Subject[];
    grades: Grade[];
    homework: Homework[];
    announcements: Announcement[];
    attendance: Attendance[];
    messages: Message[];
    timetable: TimetableEntry[];
    // Setters
    setUsers: (users: User[]) => void;
    setStudents: (students: Student[]) => void;
    setClasses: (classes: Class[]) => void;
    setTeachers: (teachers: Teacher[]) => void;
    setSubjects: (subjects: Subject[]) => void;
    setGrades: (grades: Grade[]) => void;
    setHomework: (homework: Homework[]) => void;
    setAnnouncements: (announcements: Announcement[]) => void;
    setAttendance: (attendance: Attendance[]) => void;
    setMessages: (messages: Message[]) => void;
    setTimetable: (timetable: TimetableEntry[]) => void;
    updateUserAvatar: (userId: string, avatarDataUrl: string) => void;
    updateUser: (userId: string, updates: Partial<User>) => void;
}

export const AppContext = React.createContext<AppContextType>({
    user: null,
    login: () => {},
    logout: () => {},
    lang: 'en',
    setLang: () => {},
    t: (key) => key,
    dir: 'ltr',
    users: [],
    students: [],
    classes: [],
    teachers: [],
    subjects: [],
    grades: [],
    homework: [],
    announcements: [],
    attendance: [],
    messages: [],
    timetable: [],
    setUsers: () => {},
    setStudents: () => {},
    setClasses: () => {},
    setTeachers: () => {},
    setSubjects: () => {},
    setGrades: () => {},
    setHomework: () => {},
    setAnnouncements: () => {},
    setAttendance: () => {},
    setMessages: () => {},
    setTimetable: () => {},
    updateUserAvatar: () => {},
    updateUser: () => {},
});

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [lang, setLang] = useState<string>('en');

    // Lifted state - all initialized as empty arrays
    const [users, setUsers] = useState<User[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [homework, setHomework] = useState<Homework[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);


    useEffect(() => {
        const fetchAllData = async () => {
            try {
                console.log('Fetching data from PostgreSQL...');
                const [allUsers, allClasses, allSubjects, allGrades, allHomework, allAnnouncements, allAttendance, allMessages] = await Promise.all([
                    apiService.getAllUsers(),
                    apiService.getAllClasses(),
                    apiService.getAllSubjects(),
                    apiService.getAllGrades(),
                    apiService.getAllHomework(),
                    apiService.getAllAnnouncements(),
                    apiService.getAllAttendance(),
                    apiService.getAllMessages(),
                ]);

                console.log('Fetched users with avatars:', allUsers.map(u => ({ 
                    id: u.id, 
                    name: u.name, 
                    avatar: u.avatar ? `has avatar (${u.avatar.length} chars)` : 'no avatar',
                    avatarPreview: u.avatar ? u.avatar.substring(0, 50) + '...' : 'none'
                })));

                console.log('Fetched users:', allUsers.length);
                console.log('Fetched classes:', allClasses.length);
                console.log('Fetched subjects:', allSubjects.length);
                console.log('Fetched grades:', allGrades.length);
                console.log('Fetched homework:', allHomework.length);
                console.log('Fetched announcements:', allAnnouncements.length);
                console.log('Fetched attendance:', allAttendance.length);
                console.log('Fetched messages:', allMessages.length);

                // Always update with PostgreSQL data when available
                setUsers(allUsers);
                setClasses(allClasses);
                setSubjects(allSubjects);
                setGrades(allGrades);
                setHomework(allHomework);
                setAnnouncements(allAnnouncements);
                setAttendance(allAttendance);
                setMessages(allMessages);

                // Process students from PostgreSQL data
                const studentUsers = allUsers.filter(u => u.role?.toLowerCase() === 'student').map(u => ({
                    ...u,
                    grade: 1, // Default grade
                    classId: (u as any).classId || '',
                    parentId: (u as any).parentId || '',
                })) as Student[];
                
                console.log('=== STUDENTS PROCESSING DEBUG ===');
                console.log('All users:', allUsers.length);
                console.log('Student users:', studentUsers.length);
                console.log('Student details:', studentUsers.map(s => ({ id: s.id, name: s.name, classId: s.classId, role: s.role })));
                
                setStudents(studentUsers);

                // Load teachers with their classIds
                const teacherUsers = allUsers.filter(u => u.role?.toLowerCase() === 'teacher').map(u => ({
                    id: u.id,
                    name: u.name,
                    subject: (u as any).subject || '',
                    classIds: (u as any).classIds || [],
                })) as Teacher[];
                setTeachers(teacherUsers);

                console.log('Successfully loaded all data from PostgreSQL');

            } catch (error) {
                console.error("Failed to fetch initial data from PostgreSQL", error);
                // Keep using empty arrays if PostgreSQL fetch fails
            }
        };

        fetchAllData();
    }, []);


    const handleLogin = (newUser: User) => {
        // Find the full user data from the users array
        const fullUser = users.find(u => u.id === newUser.id) || newUser;
        
        console.log('Login attempt for user:', newUser.id);
        console.log('Found full user data:', fullUser);
        
        // For teachers, ensure classIds are loaded
        if (fullUser.role === 'teacher') {
            const teacherData = users.find(u => u.id === newUser.id);
            if (teacherData) {
                setUser({
                    ...fullUser,
                    classIds: (teacherData as any).classIds || []
                });
            } else {
                setUser(fullUser);
            }
        } else if (fullUser.role === 'parent') {
            // For parents, ensure childrenIds are loaded
            const parentData = users.find(u => u.id === newUser.id);
            if (parentData) {
                console.log('Parent data with childrenIds:', parentData);
                setUser({
                    ...fullUser,
                    childrenIds: (parentData as any).childrenIds || []
                });
            } else {
                setUser(fullUser);
            }
        } else {
            console.log('Setting user for admin/student:', fullUser);
            setUser(fullUser);
        }
        
        console.log('Login completed for user:', fullUser.name);
    };

    const handleLogout = () => {
        setUser(null);
    };

    const handleUpdateUserAvatar = useCallback((userId: string, avatarDataUrl: string) => {
        console.log('=== UPDATE USER AVATAR DEBUG ===');
        console.log('User ID:', userId);
        console.log('Avatar length:', avatarDataUrl.length);
        console.log('Current user ID:', user?.id);
        console.log('Is updating current user:', user?.id === userId);
        
        setUsers(currentUsers => {
            console.log('Previous users count:', currentUsers.length);
            const updated = currentUsers.map(u => u.id === userId ? { ...u, avatar: avatarDataUrl } : u);
            console.log('Updated users count:', updated.length);
            console.log('Updated user avatar:', updated.find(u => u.id === userId)?.avatar ? 'has avatar' : 'no avatar');
            return updated;
        });
        
        // Also update the current user if they are the one being changed
        if(user?.id === userId) {
            console.log('Updating current user avatar');
            setUser(prevUser => prevUser ? { ...prevUser, avatar: avatarDataUrl } : null);
        }
        
        // Also update students array if the user is a student
        setStudents(currentStudents => {
            const updated = currentStudents.map(s => s.id === userId ? { ...s, avatar: avatarDataUrl } : s);
            console.log('Updated students with new avatar:', updated.find(s => s.id === userId)?.avatar ? 'has avatar' : 'no avatar');
            return updated;
        });
        
        console.log('Avatar update completed in App context');
    }, [user?.id]);

    const handleUpdateUser = useCallback((userId: string, updates: Partial<User>) => {
        setUsers(currentUsers => currentUsers.map(u => u.id === userId ? { ...u, ...updates } : u));
        if (user?.id === userId) {
            setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
        }
    }, [user?.id]);

    const t = useCallback((key: string, replacements?: Record<string, string>): string => {
        let translation = translations[lang]?.[key] || translations['en'][key] || key;
        if (replacements) {
            Object.entries(replacements).forEach(([placeholder, value]) => {
                translation = translation.replace(`{${placeholder}}`, value);
            });
        }
        return translation;
    }, [lang]);

    const dir: 'ltr' | 'rtl' = useMemo(() => {
        if (lang.startsWith('ku') || lang === 'ar' || lang === 'syr') {
            return 'rtl';
        }
        return 'ltr';
    }, [lang]);

    const appContextValue = useMemo(() => ({
        user,
        login: handleLogin,
        logout: handleLogout,
        lang,
        setLang,
        t,
        dir,
        users,
        students,
        classes,
        teachers,
        subjects,
        grades,
        homework,
        announcements,
        attendance,
        messages,
        timetable,
        setUsers,
        setStudents,
        setClasses,
        setTeachers,
        setSubjects,
        setGrades,
        setHomework,
        setAnnouncements,
        setAttendance,
        setMessages,
        setTimetable,
        updateUserAvatar: handleUpdateUserAvatar,
        updateUser: handleUpdateUser,
    }), [user, lang, t, dir, users, students, classes, teachers, subjects, grades, homework, announcements, attendance, messages, timetable, handleUpdateUserAvatar, handleUpdateUser]);

    const renderContent = () => {
        if (!user) {
            return <LoginScreen />;
        }
        
        // Convert role to lowercase for comparison
        const userRole = user.role.toLowerCase();
        console.log('Rendering content for role:', userRole);
        
        switch (userRole) {
            case 'parent':
                return <ParentDashboard />;
            case 'teacher':
                return <TeacherDashboard />;
            case 'admin':
                return <AdminDashboard />;
            default:
                console.log('Unknown role:', userRole);
                return <LoginScreen />;
        }
    };
    
    return (
        <AppContext.Provider value={appContextValue}>
           <div dir={dir} className="font-sans">
                <div className="w-full min-h-screen bg-white lg:bg-gray-50">
                    <div className="max-w-md mx-auto lg:max-w-none lg:mx-0 min-h-screen bg-white lg:bg-transparent">
                        {renderContent()}
                    </div>
                </div>
           </div>
        </AppContext.Provider>
    );
};

export default App;