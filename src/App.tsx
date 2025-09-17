import React, { useState, useEffect, createContext, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { User, Student, Class, Teacher, Subject, Grade, Homework, Announcement, Attendance, Message, TimetableEntry } from './types';
import apiService from './services/apiService';
import { translations } from './constants';
import { 
  saveUserSession, 
  loadUserSession, 
  clearUserSession, 
  initActivityTracking, 
  stopActivityTracking 
} from './utils/sessionManager';
import { realTimeManager } from './utils/realTimeManager';
import NavigationHandler from './components/layout/NavigationHandler';
import { AppContext, AppContextType } from './contexts/AppContext';

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
                console.log('Student details:', studentUsers.map(s => ({ id: s.id, name: s.name, classId: s.classId, parentId: s.parentId })));
                console.log('Students with parentId:', studentUsers.filter(s => s.parentId).length);
                
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

    // Session restoration - runs immediately on app start
    useEffect(() => {
        const savedUser = loadUserSession();
        if (savedUser) {
            console.log('Restoring session for user:', savedUser.name);
            setUser(savedUser);
            
            // Start activity tracking immediately
            initActivityTracking();
        }
    }, []);

    // Real-time setup - runs when user is set and data is loaded
    useEffect(() => {
        if (user && messages.length >= 0 && announcements.length >= 0) {
            // Initialize real-time manager
            realTimeManager.setCallbacks({
                onMessagesUpdate: (newMessages) => {
                    console.log('Real-time: Messages updated');
                    setMessages(newMessages);
                },
                onAnnouncementsUpdate: (newAnnouncements) => {
                    console.log('Real-time: Announcements updated');
                    setAnnouncements(newAnnouncements);
                }
            });
            
            // Initialize data counts for change detection
            realTimeManager.initializeDataCounts(messages.length, announcements.length);
            
            // Start real-time polling
            realTimeManager.startPolling();
            
            // Request notification permission
            realTimeManager.requestNotificationPermission();
        }

        // Cleanup on unmount or user change
        return () => {
            if (!user) {
                realTimeManager.stopPolling();
                stopActivityTracking();
            }
        };
    }, [user, messages.length, announcements.length]);

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
        
        // Save session and start real-time updates
        saveUserSession(fullUser);
        
        // Initialize real-time manager
        realTimeManager.setCallbacks({
            onMessagesUpdate: (newMessages) => {
                console.log('Real-time: Messages updated');
                setMessages(newMessages);
            },
            onAnnouncementsUpdate: (newAnnouncements) => {
                console.log('Real-time: Announcements updated');
                setAnnouncements(newAnnouncements);
            }
        });
        
        // Initialize data counts for change detection
        realTimeManager.initializeDataCounts(messages.length, announcements.length);
        
        // Start real-time polling
        realTimeManager.startPolling();
        
        // Request notification permission
        realTimeManager.requestNotificationPermission();
        
        // Start activity tracking
        initActivityTracking();
        
        console.log('Login completed for user:', fullUser.name);
    };

    const handleLogout = () => {
        // Clear session and stop real-time updates
        clearUserSession();
        realTimeManager.stopPolling();
        stopActivityTracking();
        setUser(null);
        console.log('User logged out and session cleared');
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

    // Update HTML direction attribute when language changes
    useEffect(() => {
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
    }, [dir, lang]);

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

    return (
        <Router>
            <AppContext.Provider value={appContextValue}>
                <NavigationHandler>
                    <div dir={dir} className="font-sans">
                        <div className="w-full min-h-screen bg-white lg:bg-gray-50">
                            <div className="max-w-md mx-auto lg:max-w-none lg:mx-0 min-h-screen bg-white lg:bg-transparent lg:p-4">
                                <div className="lg:max-w-7xl lg:mx-auto">
                                    <AppRoutes />
                                </div>
                            </div>
                        </div>
                    </div>
                </NavigationHandler>
            </AppContext.Provider>
        </Router>
    );
};

export default App;