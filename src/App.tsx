import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppRoutes from './routes/AppRoutes';
import { User, Student, Class, Teacher, Subject, Grade, Homework, Announcement, Attendance, Message, TimetableEntry, School } from './types';
import apiService from './services/apiService';
import {
  saveUserSession,
  loadUserSession,
  clearUserSession,
  initActivityTracking,
  stopActivityTracking
} from './utils/sessionManager';
import { realTimeManager } from './utils/realTimeManager';
import NavigationHandler from './components/layout/NavigationHandler';
import { AppContext, SessionPayload } from './contexts/AppContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { mapApiUsers, mapApiUserToClient } from './lib/userAdapter';

const App: React.FC = () => {
    const { i18n } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [school, setSchool] = useState<School | null>(null);

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
        if (!user || !apiService.getAuthToken()) {
            return;
        }

        const fetchAllData = async () => {
            try {
                console.log('Fetching scoped data for authenticated user...');
                const [rawUsers, allClasses, allSubjects, allGrades, allHomework, allAnnouncements, allAttendance, allMessages] = await Promise.all([
                    apiService.getAllUsers(),
                    apiService.getAllClasses(),
                    apiService.getAllSubjects(),
                    apiService.getAllGrades(),
                    apiService.getAllHomework(),
                    apiService.getAllAnnouncements(),
                    apiService.getAllAttendance(),
                    apiService.getAllMessages(),
                ]);

                const normalizedUsers = mapApiUsers(rawUsers as any[]);
                setUsers(normalizedUsers);
                setClasses(allClasses);
                setSubjects(allSubjects);
                setGrades(allGrades);
                setHomework(allHomework);
                setAnnouncements(allAnnouncements);
                setAttendance(allAttendance);
                setMessages(allMessages);

                const studentUsers: Student[] = normalizedUsers
                    .filter(u => u.role === 'student')
                    .map(u => ({
                        id: u.id,
                        name: u.name,
                        grade: 1,
                        classId: u.classId || '',
                        parentId: u.parentId || '',
                        avatar: u.avatar || '',
                    }));
                setStudents(studentUsers);

                const teacherUsers: Teacher[] = normalizedUsers
                    .filter(u => u.role === 'teacher')
                    .map(u => ({
                        id: u.id,
                        name: u.name,
                        subject: u.subject || '',
                        classIds: u.classIds || [],
                    }));
                setTeachers(teacherUsers);

                console.log('Successfully loaded scoped data');
            } catch (error) {
                console.error('Failed to fetch authenticated data', error);
            }
        };

        fetchAllData();
    }, [user]);

    // Session restoration - runs immediately on app start
    useEffect(() => {
        const bootstrapSession = async () => {
            try {
                console.log('App: Attempting to load user session...');
                const storedSession = loadUserSession();

                if (storedSession?.user && storedSession.token) {
                    console.log('App: Restoring session for user:', storedSession.user.name, 'Role:', storedSession.user.role);
                    apiService.setAuthToken(storedSession.token);
                    setUser(storedSession.user);
                    setSchool(storedSession.user.school || null);
                    initActivityTracking();

                    try {
                        const remoteSession: any = await apiService.fetchSession();
                        const remoteUser = remoteSession?.user || remoteSession?.data?.user;
                        if (remoteUser) {
                            const refreshedUser = mapApiUserToClient(remoteUser);
                            const resolvedSchool = remoteSession?.school || remoteSession?.data?.school || refreshedUser.school || null;
                            const updatedUser = { ...refreshedUser, school: resolvedSchool };
                            setUser(updatedUser);
                            setSchool(resolvedSchool);
                            saveUserSession(updatedUser, storedSession.token);
                        }
                    } catch (refreshError) {
                        console.warn('App: Unable to refresh remote session, clearing local state', refreshError);
                        clearUserSession();
                        apiService.setAuthToken(null);
                        setUser(null);
                        setSchool(null);
                    }
                } else {
                    console.log('App: No saved session found');
                }
            } finally {
                // No-op placeholder for future instrumentation
            }
        };

        bootstrapSession();
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

    const handleLogin = (session: SessionPayload) => {
        const normalizedUser = session.user;
        console.log('Login completed for user:', normalizedUser.name, 'role:', normalizedUser.role);

        apiService.setAuthToken(session.token);
        setUser(normalizedUser);
        setSchool(session.school || normalizedUser.school || null);

        saveUserSession(normalizedUser, session.token);

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

        realTimeManager.initializeDataCounts(messages.length, announcements.length);
        realTimeManager.startPolling();
        realTimeManager.requestNotificationPermission();
        initActivityTracking();
    };

    const handleLogout = () => {
        // Clear session and stop real-time updates
        clearUserSession();
        apiService.setAuthToken(null);
        realTimeManager.stopPolling();
        stopActivityTracking();
        setUser(null);
        setSchool(null);
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

    const appContextValue = useMemo(() => ({
        user,
        school,
        login: handleLogin,
        logout: handleLogout,
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
    }), [user, school, users, students, classes, teachers, subjects, grades, homework, announcements, attendance, messages, timetable, handleUpdateUserAvatar, handleUpdateUser]);

    useEffect(() => {
        document.documentElement.lang = i18n.language;
        document.documentElement.dir = i18n.dir(i18n.language);
    }, [i18n, i18n.language]);

    return (
        <TutorialProvider>
            <Suspense fallback="loading">
                <Router>
                    <AppContext.Provider value={appContextValue}>
                        <NavigationHandler>
                            <div dir={i18n.dir(i18n.language)} className="font-sans">
                                <div className="w-full min-h-screen bg-white lg:bg-gray-50">
                                    <div className="max-w-md mx-auto lg:max-w-none lg:mx-0 min-h-screen bg-white lg:bg-transparent">
                                        <AppRoutes />
                                    </div>
                                </div>
                            </div>
                        </NavigationHandler>
                    </AppContext.Provider>
                </Router>
            </Suspense>
        </TutorialProvider>
    );
};
//testing commit
export default App;