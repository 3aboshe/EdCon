

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../App';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import { allAvatars } from '../data/avatars';
import { Student, Grade, Homework, Announcement, TimetableEntry } from '../types';
import ProfileImage from '../components/common/ProfileImage';

type StudentTab = 'dashboard' | 'grades' | 'homework' | 'announcements' | 'timetable' | 'profile';

const getStudentTabIcon = (tab: StudentTab): string => {
    const icons: Record<StudentTab, string> = {
        dashboard: 'fa-home',
        grades: 'fa-graduation-cap',
        homework: 'fa-book-open',
        announcements: 'fa-bullhorn',
        timetable: 'fa-calendar-alt',
        profile: 'fa-user-astronaut'
    };
    return icons[tab];
};

const StudentDashboard: React.FC = () => {
    const { user, t, students } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<StudentTab>('dashboard');

    const currentStudent = useMemo(() => {
        console.log('=== STUDENT DASHBOARD DEBUG ===');
        console.log('User:', user);
        console.log('User ID:', user?.id);
        console.log('All students:', students);
        console.log('Student IDs:', students.map(s => s.id));
        
        const found = students.find(s => s.id === user?.id);
        console.log('Found student:', found);
        return found;
    }, [user, students]);
    
    const tabTitles: Record<StudentTab, string> = {
        dashboard: t('dashboard'),
        grades: t('marks'),
        homework: t('homework'),
        announcements: t('announcements'),
        timetable: t('timetable'),
        profile: t('profile'),
    };

    const renderContent = () => {
        if (!currentStudent) return null;
        switch(activeTab) {
            case 'grades': return <GradesView student={currentStudent} />;
            case 'homework': return <HomeworkView student={currentStudent} />;
            case 'announcements': return <AnnouncementsView />;
            case 'timetable': return <TimetableView student={currentStudent} />;
            case 'profile': return <ProfileView student={currentStudent} />;
            default: return <DashboardView student={currentStudent} />;
        }
    };

    if (!currentStudent) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Header title={t('dashboard')} />
                <main className="flex-grow p-4">
                    <p>Could not find student data.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
            {/* Mobile Header - only visible on mobile */}
            <div className="lg:hidden w-full">
                <Header title={tabTitles[activeTab]} />
            </div>

            {/* Desktop Sidebar - only visible on desktop */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
                <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white shadow-lg">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <h1 className="text-xl font-bold text-gray-800">Student Portal</h1>
                    </div>
                    <div className="mt-5 flex-1 flex flex-col">
                        <nav className="flex-1 px-2 space-y-1">
                            {Object.entries(tabTitles).map(([tab, title]) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as StudentTab)}
                                    className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                        activeTab === tab
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <i className={`mr-3 flex-shrink-0 h-6 w-6 fas ${getStudentTabIcon(tab as StudentTab)}`}></i>
                                    {title}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col flex-1 lg:pl-64">
                {/* Desktop Header */}
                <div className="hidden lg:block sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
                    <div className="flex-1 px-4 flex justify-between items-center">
                        <h1 className="text-lg font-medium text-gray-900">{tabTitles[activeTab]}</h1>
                        {currentStudent && (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">Welcome, {currentStudent.name}</span>
                                <img src={currentStudent.avatar} alt={currentStudent.name} className="h-8 w-8 rounded-full" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <main className="flex-grow p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 mb-16 lg:mb-0">
                    {renderContent()}
                </main>
            </div>

            {/* Mobile Bottom Navigation - only visible on mobile */}
            <div className="lg:hidden">
                <StudentTabBar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
        </div>
    );
};

// --- Tab-specific Components ---

const DashboardView: React.FC<{ student: Student }> = ({ student }) => {
    const { t } = useContext(AppContext);
    return (
        <Card className="text-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <ProfileImage 
                name={student.name} 
                avatarUrl={student.avatar} 
                className="w-24 h-24 mx-auto border-4 border-white shadow-lg mb-2"
                textClassName="text-4xl"
            />
            <h1 className="text-2xl font-bold">{t('hello_student').replace('{name}', student.name)}</h1>
        </Card>
    );
};

const GradesView: React.FC<{ student: Student }> = ({ student }) => {
    const { t, grades } = useContext(AppContext);
    const studentGrades = useMemo(() =>
        grades.filter(g => g.studentId === student.id)
              .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [student.id, grades]
    );

    return (
        <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('recent_marks')}</h2>
            {studentGrades.length > 0 ? (
                <ul className="space-y-3">
                    {studentGrades.map(grade => {
                        const percentage = (grade.marksObtained / grade.maxMarks) * 100;
                        const colorClass = percentage >= 80 ? 'bg-green-100 text-green-800' : percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                        return (
                            <li key={grade.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-gray-900">{grade.subject}: {grade.assignment || 'No Assignment'}</p>
                                    <p className="text-sm text-gray-500">{new Date(grade.date).toLocaleDateString()}</p>
                                </div>
                                <div className={`px-3 py-1 text-sm font-bold rounded-full ${colorClass}`}>{grade.marksObtained}/{grade.maxMarks}</div>
                            </li>
                        )
                    })}
                </ul>
            ) : <p className="text-gray-500">{t('no_marks')}</p>}
        </Card>
    );
};

const HomeworkView: React.FC<{ student: Student }> = ({ student }) => {
    const { t, homework } = useContext(AppContext);

    return (
        <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('homework_status')}</h2>
            {homework.length > 0 ? (
                 <ul className="space-y-4">
                     {homework.map(hw => {
                         const isSubmitted = hw.submitted.includes(student.id);
                         return (
                            <li key={hw.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-900">{hw.title} ({hw.subject})</p>
                                        <p className="text-sm text-gray-500">{t('due_date')} {new Date(hw.dueDate).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${isSubmitted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {isSubmitted ? t('submitted') : t('not_submitted')}
                                    </span>
                                </div>
                            </li>
                         )
                     })}
                 </ul>
            ) : <p className="text-gray-500">{t('no_homework')}</p>}
        </Card>
    );
};

const AnnouncementsView: React.FC = () => {
    const { t, announcements, teachers } = useContext(AppContext);
    const priorityClasses = {
        high: 'border-red-500 bg-red-50',
        medium: 'border-yellow-500 bg-yellow-50',
        low: 'border-blue-500 bg-blue-50',
    };

    return (
        <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('announcements')}</h2>
            {announcements.length > 0 ? (
                <ul className="space-y-4">
                    {announcements.map(ann => {
                        const teacher = teachers.find(t => t.id === ann.teacherId);
                        return (
                            <li key={ann.id} className={`p-4 rounded-lg border-l-4 ${priorityClasses[ann.priority]}`}>
                               <h3 className="font-bold text-gray-900">{ann.title}</h3>
                               <p className="text-sm text-gray-500 mb-2">{new Date(ann.date).toLocaleDateString()} - {teacher?.name}</p>
                               <p className="text-gray-700">{ann.content}</p>
                            </li>
                        )
                    })}
                </ul>
            ) : <p className="text-gray-500">{t('no_announcements')}</p>}
        </Card>
    )
};

const TimetableView: React.FC<{ student: Student }> = ({ student }) => {
    const { t, timetable } = useContext(AppContext);
    const studentTimetable = useMemo(() => {
        const schedule = timetable.filter(entry => entry.classId === student.classId);
        const days: ('Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday')[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        
        return days.map(day => ({
            day,
            schedule: schedule.filter(s => s.day === day).sort((a,b) => a.time.localeCompare(b.time))
        }));
    }, [student, timetable]);

    return (
        <Card>
             <h2 className="text-lg font-bold text-gray-800 mb-4">{t('timetable')}</h2>
             <div className="space-y-4">
                {studentTimetable.map(({ day, schedule }) => (
                    <div key={day}>
                        <h3 className="font-bold text-md text-blue-600 border-b-2 border-blue-200 pb-1 mb-2">{t(day.toLowerCase() as any) || day}</h3>
                        {schedule.length > 0 ? (
                            <ul className="space-y-2">
                                {schedule.map(item => (
                                    <li key={`${item.day}-${item.time}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                        <span className="text-sm font-mono text-gray-600">{item.time}</span>
                                        <span className="font-semibold text-gray-800">{item.subject}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 px-2">No classes scheduled.</p>
                        )}
                    </div>
                ))}
             </div>
        </Card>
    );
};

const ProfileView: React.FC<{ student: Student }> = ({ student }) => {
    const { t, setStudents, students } = useContext(AppContext);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSelectAvatar = (avatarUrl: string) => {
        const updatedStudents = students.map(s =>
            s.id === student.id ? { ...s, avatar: avatarUrl } : s
        );
        setStudents(updatedStudents);
        setSuccessMessage(t('character_selected'));
        setTimeout(() => setSuccessMessage(''), 2000);
    };

    return (
        <>
            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">{t('choose_your_character')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {allAvatars.map((avatar, index) => (
                        <div key={index} className="relative" onClick={() => handleSelectAvatar(avatar)}>
                            <img
                                src={avatar}
                                alt={`Avatar ${index + 1}`}
                                className={`w-full h-auto rounded-lg cursor-pointer transition-transform duration-200 hover:scale-110 bg-gray-200 ${student.avatar === avatar ? 'border-4 border-green-500 shadow-lg' : 'border-4 border-transparent'}`}
                            />
                            {student.avatar === avatar && (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full h-6 w-6 flex items-center justify-center">
                                    <i className="fa-solid fa-check"></i>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
            {successMessage && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg">
                    {successMessage}
                </div>
            )}
        </>
    );
};

// --- Tab Bar Component ---
const StudentTabBar: React.FC<{ activeTab: StudentTab, onTabChange: (tab: StudentTab) => void }> = ({ activeTab, onTabChange }) => {
    const { t } = useContext(AppContext);

    const tabs: { id: StudentTab; labelKey: string; icon: string }[] = [
        { id: 'dashboard', labelKey: 'dashboard', icon: 'fa-home' },
        { id: 'grades', labelKey: 'marks', icon: 'fa-graduation-cap' },
        { id: 'homework', labelKey: 'homework', icon: 'fa-book-open' },
        { id: 'timetable', labelKey: 'timetable', icon: 'fa-calendar-alt' },
        { id: 'profile', labelKey: 'profile', icon: 'fa-user-astronaut' },
    ];

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-gray-200">
            <div className="max-w-md mx-auto lg:max-w-none">
            <div className="flex justify-around">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center justify-center w-full py-2 px-1 text-center transition-colors duration-200 ${
                                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                            }`}
                        >
                            <i className={`fas ${tab.icon} text-lg sm:text-xl ${isActive ? 'scale-110' : ''} transition-transform`}></i>
                            <span className="text-xs mt-1 font-medium">{t(tab.labelKey)}</span>
                        </button>
                    );
                })}
            </div>
            </div>
        </footer>
    );
};

export default StudentDashboard;