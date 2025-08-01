

import React, { useState, useContext, useMemo, useEffect, useCallback, useRef } from 'react';
import { AppContext } from '../App';
import { Student, Grade, Homework, Announcement, User, Message, UserRole } from '../types';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import SpeakButton from '../components/common/SpeakButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { generateStudentSummary, generateTop5ParentBriefing, generateAcademicInsights, generateAttendanceAnalysis, generateHomeworkSummary } from '../services/geminiService';
import TabBar from '../components/common/TabBar';
import Modal from '../components/common/Modal';
import ProfileImage from '../components/common/ProfileImage';
import ProfileScreen from './ProfileScreen';
import apiService from '../services/apiService';

type ParentTab = 'dashboard' | 'performance' | 'homework' | 'announcements' | 'messages' | 'profile' | 'codes';

const ParentDashboard: React.FC = () => {
    const { user, t, students } = useContext(AppContext);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ParentTab>('dashboard');

    const parentStudents = useMemo(() => {
        console.log('=== PARENT DASHBOARD DEBUG ===');
        console.log('User:', user);
        console.log('User childrenIds:', user?.childrenIds);
        console.log('All students:', students);
        console.log('Students IDs:', students.map(s => s.id));
        
        const filtered = students.filter(s => user?.childrenIds?.includes(s.id));
        console.log('Parent students:', filtered);
        return filtered;
    }, [user, students]);

    useEffect(() => {
        console.log('Parent students effect:', parentStudents);
        if (parentStudents.length > 0 && !selectedStudentId) {
            setSelectedStudentId(parentStudents[0].id);
            console.log('Selected first student:', parentStudents[0].id);
        }
    }, [parentStudents, selectedStudentId]);

    const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [selectedStudentId, students]);
    
    const handleStudentChange = (id: string) => {
        if (id !== selectedStudentId) {
            setSelectedStudentId(id);
        }
    };

    const tabTitles: Record<ParentTab, string> = {
        dashboard: t('dashboard'),
        performance: t('performance'),
        homework: t('homework'),
        announcements: t('announcements'),
        messages: t('messages'),
        profile: t('profile'),
        codes: t('codes'),
    };

    if (!user) return null;

    if (user.childrenIds && user.childrenIds.length > 0 && !selectedStudent) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Header title={t('dashboard')} />
                <main className="flex-grow p-4">
                    <LoadingSpinner />
                </main>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header title={tabTitles[activeTab]} />
            <main className="flex-grow p-4 space-y-6 mb-20">
                {selectedStudent ? (
                    <SelectedStudentCard 
                        student={selectedStudent} 
                        otherStudents={parentStudents}
                        onSelect={handleStudentChange} 
                    />
                ) : (
                    activeTab !== 'profile' && <Card><p>{t('select_student')}</p></Card>
                )}
                
                {activeTab === 'dashboard' && selectedStudent && (
                    <>
                        <Top5Briefing student={selectedStudent}/>
                        <AIAttendanceAnalysis student={selectedStudent} />
                        <AttendanceSummary student={selectedStudent} />
                        <VideoTutorials />
                    </>
                )}

                                {activeTab === 'performance' && selectedStudent && (
                     <>
                        <AISummary student={selectedStudent} />
                        <AIInsights student={selectedStudent} />
                        <GradesList student={selectedStudent} />
                    </>
                )}

                {activeTab === 'homework' && selectedStudent && (
                    <>
                        <AIHomeworkAnalysis student={selectedStudent} />
                        <HomeworkSummary student={selectedStudent} />
                    </>
                )}

                {activeTab === 'announcements' && selectedStudent && (
                    <AnnouncementsList />
                )}

                {activeTab === 'messages' && selectedStudent && (
                    <ParentMessaging student={selectedStudent} />
                )}

                {activeTab === 'codes' && (
                    <StudentCodesTab students={parentStudents} />
                )}

                {activeTab === 'profile' && (
                    <ProfileScreen />
                )}

            </main>
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
};

// Sub-components for better organization

const SelectedStudentCard: React.FC<{ student: Student, otherStudents: Student[], onSelect: (id: string) => void }> = ({ student, otherStudents, onSelect }) => {
    const { t } = useContext(AppContext);
    const showSelector = otherStudents.length > 1;

    return (
        <Card className="flex items-center gap-4">
            <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-full object-cover bg-gray-200" />
            <div className="flex-grow">
                {showSelector ? (
                    <select
                        id="student-select"
                        value={student.id || ''}
                        onChange={(e) => onSelect(e.target.value)}
                        className="w-full text-lg font-bold text-gray-800 p-2 border-0 rounded-md shadow-sm focus:ring-0 focus:border-0 bg-transparent -ml-2"
                        aria-label={t('select_student')}
                    >
                        {otherStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                ) : (
                    <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
                )}
                 <p className="text-sm text-gray-500">{t('parent_of')} {student.name.split(' ')[0]}</p>
            </div>
        </Card>
    );
};

const Top5Briefing: React.FC<{student: Student}> = ({student}) => {
    const { t, lang, grades, homework, announcements, attendance } = useContext(AppContext);
    const [briefing, setBriefing] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setBriefing('');
        setIsLoading(true);

        const fetchBriefing = async () => {
            try {
                const studentGrades = grades.filter(g => g.studentId === student.id);
                const studentAttendance = attendance.filter(a => a.studentId === student.id);
                
                const languageMap: Record<string, string> = {
                    'en': 'English',
                    'ku-sorani': 'Sorani Kurdish',
                    'ku-badini': 'Bahdini Kurdish',
                    'ar': 'Arabic',
                    'syr': 'Modern Assyrian'
                };
                const languageName = languageMap[lang] || 'English';

                const briefingText = await generateTop5ParentBriefing({
                    student,
                    grades: studentGrades,
                    homework: homework,
                    announcements: announcements,
                    attendance: studentAttendance,
                }, languageName);
                setBriefing(briefingText);
            } catch (error) {
                setBriefing(t('error_gemini'));
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchBriefing, 100); // Debounce slightly
        return () => clearTimeout(timer);
    }, [student.id, t, lang, grades, homework, announcements, attendance]);

    return (
         <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <h2 className="text-xl font-bold mb-2 flex items-center"><i className="fa-solid fa-star mr-2"></i>{t('top_5_things')}</h2>
            {isLoading ? <LoadingSpinner /> : (
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{__html: briefing.replace(/\*/g, '•').replace(/\n/g, '<br />')}}></div>
            )}
        </Card>
    )
}

const AIInsights: React.FC<{ student: Student }> = ({ student }) => {
    const { t, lang, grades } = useContext(AppContext);
    const [insights, setInsights] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setInsights('');
        setIsLoading(true);
        const fetchInsights = async () => {
            try {
                const studentGrades = grades.filter(g => g.studentId === student.id);
                if (studentGrades.length === 0) {
                    setInsights(t('no_marks'));
                    return;
                }

                const languageMap: Record<string, string> = {
                    'en': 'English',
                    'ku-sorani': 'Sorani Kurdish',
                    'ku-badini': 'Bahdini Kurdish',
                    'ar': 'Arabic',
                    'syr': 'Modern Assyrian'
                };
                const languageName = languageMap[lang] || 'English';
                const insightsText = await generateAcademicInsights(studentGrades, languageName);
                setInsights(insightsText);
            } catch (error) {
                setInsights(t('error_gemini'));
            } finally {
                setIsLoading(false);
            }
        };
        
        const timer = setTimeout(fetchInsights, 100);
        return () => clearTimeout(timer);
    }, [student.id, t, lang, grades]);
    
    return (
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <h2 className="text-lg font-bold mb-2 flex items-center">
                <i className="fas fa-chart-line mr-2"></i>
                AI Academic Insights
            </h2>
            {isLoading ? <LoadingSpinner /> : (
                <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{insights}</div>
                </div>
            )}
        </Card>
    );
}

const AIAttendanceAnalysis: React.FC<{ student: Student }> = ({ student }) => {
    const { t, lang, attendance } = useContext(AppContext);
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setAnalysis('');
        setIsLoading(true);
        const fetchAnalysis = async () => {
            try {
                const studentAttendance = attendance.filter(a => a.studentId === student.id);
                if (studentAttendance.length === 0) {
                    setAnalysis(t('no_attendance'));
                    return;
                }

                const languageMap: Record<string, string> = {
                    'en': 'English',
                    'ku-sorani': 'Sorani Kurdish',
                    'ku-badini': 'Bahdini Kurdish',
                    'ar': 'Arabic',
                    'syr': 'Modern Assyrian'
                };
                const languageName = languageMap[lang] || 'English';
                const analysisText = await generateAttendanceAnalysis(studentAttendance, languageName);
                setAnalysis(analysisText);
            } catch (error) {
                setAnalysis(t('error_gemini'));
            } finally {
                setIsLoading(false);
            }
        };
        
        const timer = setTimeout(fetchAnalysis, 100);
        return () => clearTimeout(timer);
    }, [student.id, t, lang, attendance]);
    
    return (
        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <h2 className="text-lg font-bold mb-2 flex items-center">
                <i className="fas fa-calendar-check mr-2"></i>
                AI Attendance Analysis
            </h2>
            {isLoading ? <LoadingSpinner /> : (
                <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{analysis}</div>
                </div>
            )}
        </Card>
    );
}

const AIHomeworkAnalysis: React.FC<{ student: Student }> = ({ student }) => {
    const { t, lang, homework } = useContext(AppContext);
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setAnalysis('');
        setIsLoading(true);
        const fetchAnalysis = async () => {
            try {
                if (homework.length === 0) {
                    setAnalysis(t('no_homework'));
                    return;
                }

                const languageMap: Record<string, string> = {
                    'en': 'English',
                    'ku-sorani': 'Sorani Kurdish',
                    'ku-badini': 'Bahdini Kurdish',
                    'ar': 'Arabic',
                    'syr': 'Modern Assyrian'
                };
                const languageName = languageMap[lang] || 'English';
                const analysisText = await generateHomeworkSummary(homework, languageName);
                setAnalysis(analysisText);
            } catch (error) {
                setAnalysis(t('error_gemini'));
            } finally {
                setIsLoading(false);
            }
        };
        
        const timer = setTimeout(fetchAnalysis, 100);
        return () => clearTimeout(timer);
    }, [student.id, t, lang, homework]);
    
    return (
        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <h2 className="text-lg font-bold mb-2 flex items-center">
                <i className="fas fa-book mr-2"></i>
                AI Homework Analysis
            </h2>
            {isLoading ? <LoadingSpinner /> : (
                <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{analysis}</div>
                </div>
            )}
        </Card>
    );
}

const AISummary: React.FC<{ student: Student }> = ({ student }) => {
    const { t, lang, grades } = useContext(AppContext);
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        setSummary('');
        setIsLoading(true);
        const fetchSummary = async () => {
            try {
                const studentGrades = grades.filter(g => g.studentId === student.id);
                if (studentGrades.length === 0) {
                    setSummary(t('no_marks'));
                    return;
                }

                const languageMap: Record<string, string> = {
                    'en': 'English',
                    'ku-sorani': 'Sorani Kurdish',
                    'ku-badini': 'Bahdini Kurdish',
                    'ar': 'Arabic',
                    'syr': 'Modern Assyrian'
                };
                const languageName = languageMap[lang] || 'English';
                const summaryText = await generateStudentSummary(student, studentGrades, languageName);
                setSummary(summaryText);
            } catch (error) {
                setSummary(t('error_gemini'));
            } finally {
                setIsLoading(false);
            }
        };
        
        const timer = setTimeout(fetchSummary, 100); // Debounce slightly
        return () => clearTimeout(timer);
    }, [student.id, t, lang, grades]);
    
    return (
        <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-2">{t('profile_summary').replace('{name}', student.name)}</h2>
            {isLoading ? <LoadingSpinner /> : (
                <div className="flex items-start gap-2">
                    <p className="text-gray-600 whitespace-pre-wrap">{summary}</p>
                    <SpeakButton textToSpeak={summary}/>
                </div>
            )}
        </Card>
    );
};

const GradesList: React.FC<{ student: Student }> = ({ student }) => {
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
                                    <p className="font-semibold text-gray-900">{grade.subject}: {grade.assignment}</p>
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

const HomeworkSummary: React.FC<{ student: Student }> = ({ student }) => {
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
    )
};


const AttendanceSummary: React.FC<{ student: Student }> = ({ student }) => {
    const { t, attendance } = useContext(AppContext);
    const studentAttendance = useMemo(() => attendance.filter(a => a.studentId === student.id), [student.id, attendance]);
    
    const stats = useMemo(() => {
        return studentAttendance.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [studentAttendance]);

    const totalDays = studentAttendance.length;

    if(totalDays === 0) return null;

    return (
        <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('overall_attendance')}</h2>
            <div className="flex justify-around text-center">
                <div>
                    <p className="text-2xl font-bold text-green-600">{stats.present || 0}</p>
                    <p className="text-sm text-gray-500">{t('present')}</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold text-red-600">{stats.absent || 0}</p>
                    <p className="text-sm text-gray-500">{t('absent')}</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.late || 0}</p>
                    <p className="text-sm text-gray-500">{t('late')}</p>
                </div>
            </div>
        </Card>
    );
}

const AnnouncementsList: React.FC = () => {
    const { t, announcements, users } = useContext(AppContext);

    const priorityClasses = {
        high: 'border-red-500 bg-red-50',
        medium: 'border-yellow-500 bg-yellow-50',
        low: 'border-blue-500 bg-blue-50',
    };

    const priorityTextClasses = {
        high: 'text-red-800',
        medium: 'text-yellow-800',
        low: 'text-blue-800',
    };

    return (
        <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('announcements')}</h2>
            {announcements.length > 0 ? (
                <ul className="space-y-4">
                    {announcements.map(ann => {
                        const teacherUser = users.find(u => u.id === ann.teacherId);
                        return (
                            <li key={ann.id} className={`p-4 rounded-lg border-l-4 ${priorityClasses[ann.priority]}`}>
                               <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{ann.title}</h3>
                                        <p className="text-sm text-gray-500">{new Date(ann.date).toLocaleDateString()} - {teacherUser?.name}</p>
                                    </div>
                                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${priorityClasses[ann.priority]} ${priorityTextClasses[ann.priority]}`}>
                                        {t(`${ann.priority}_priority`)}
                                    </span>
                               </div>
                                <p className="mt-2 text-gray-700">{ann.content}</p>
                            </li>
                        )
                    })}
                </ul>
            ) : <p className="text-gray-500">{t('no_announcements')}</p>}
        </Card>
    )
};

const VideoTutorials: React.FC = () => {
    const { t } = useContext(AppContext);

    return (
        <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('video_tutorials')}</h2>
            <div className="flex items-center gap-4">
                <div className="bg-red-500 text-white rounded-lg w-20 h-16 flex items-center justify-center">
                    <i className="fab fa-youtube text-4xl"></i>
                </div>
                <div>
                    <h3 className="font-semibold">{t('how_to_use_app')}</h3>
                    <button className="text-sm text-blue-600 hover:underline">{t('watch_now')}</button>
                </div>
            </div>
        </Card>
    )
}

const ParentMessaging: React.FC<{ student: Student }> = ({ student }) => {
    const { t, users, teachers } = useContext(AppContext);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);

    const studentTeachers = useMemo(() => {
        return users.filter(u => u.role?.toLowerCase() === 'teacher' && u.classIds?.includes(student.classId));
    }, [student.classId, users]);

    const getTeacherDetails = (teacherUser: User) => {
        return teachers.find(t => t.id === teacherUser.id);
    }

    const handleOpenChat = (teacher: User) => {
        setSelectedTeacher(teacher);
        setIsChatOpen(true);
    };

    const handleCloseChat = useCallback(() => {
        setIsChatOpen(false);
        setSelectedTeacher(null);
    }, []);

    useEffect(() => {
        handleCloseChat();
    }, [student.id, handleCloseChat]);

    return (
        <>
            <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('messages')}</h2>
                <div className="space-y-3">
                    {studentTeachers.map(teacherUser => {
                        const teacherDetails = getTeacherDetails(teacherUser);
                        if (!teacherDetails) return null;
                        return (
                            <div key={teacherUser.id} onClick={() => handleOpenChat(teacherUser)} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                                <ProfileImage name={teacherUser.name} avatarUrl={teacherUser.avatar} />
                                <div className="ml-4 rtl:mr-4">
                                    <p className="font-semibold text-gray-800">{teacherUser.name}</p>
                                    <p className="text-sm text-gray-500">{teacherDetails.subject}</p>
                                </div>
                                <div className="text-gray-400 ml-auto rtl:mr-auto w-3 h-3 relative">
                                    <div className="absolute top-1 left-0 w-0 h-0 border-t-2 border-b-2 border-l-3 border-transparent border-l-current"></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
            {selectedTeacher && (
                 <ChatModal isOpen={isChatOpen} onClose={handleCloseChat} otherParty={selectedTeacher} />
            )}
        </>
    );
};


const ChatModal: React.FC<{ isOpen: boolean, onClose: () => void, otherParty: User }> = ({ isOpen, onClose, otherParty }) => {
    const { t, user, messages, setMessages } = useContext(AppContext);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const chatContainerRef = React.useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const conversation = useMemo(() => {
        return messages
            .filter(m => (m.senderId === user?.id && m.receiverId === otherParty.id) || (m.senderId === otherParty.id && m.receiverId === user?.id))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, user, otherParty]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [conversation]);
    
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || !user) return;
        
        setIsUploading(true);
        
        const messageData = {
            senderId: user.id,
            receiverId: otherParty.id,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: (selectedFiles.length > 0 ? 'file' : 'text') as 'text' | 'file',
            content: newMessage.trim() || undefined,
            files: selectedFiles.length > 0 ? selectedFiles : undefined
        };
        
        try {
            console.log('Sending message to database:', {
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                type: messageData.type,
                content: messageData.content,
                fileCount: selectedFiles.length
            });
            
            // Send message to database
            const savedMessage = await apiService.sendMessage(messageData);
            console.log('Message sent successfully:', savedMessage);
            setMessages([...messages, savedMessage]);
            setNewMessage('');
            setSelectedFiles([]);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('conversation_with').replace('{name}', otherParty.name)}>
            <div className="flex flex-col h-[70vh]">
                {/* Teacher Availability Notice */}
                {otherParty.messagingAvailability && (
                    <div className="text-center p-2 bg-blue-50 text-blue-700 text-xs font-semibold">
                        {t('teacher_available', { startTime: otherParty.messagingAvailability.startTime, endTime: otherParty.messagingAvailability.endTime })}
                    </div>
                )}
                
                {/* Chat Messages */}
                <div ref={chatContainerRef} className="flex-grow space-y-4 p-4 overflow-y-auto bg-gray-50 rounded-t-lg">
                    {conversation.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <i className="fas fa-comments text-4xl mb-2 opacity-50"></i>
                            <p>{t('no_messages_yet')}</p>
                        </div>
                    )}
                    {conversation.map(msg => {
                        const isMe = msg.senderId === user?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                     <ProfileImage name={isMe ? user.name : otherParty.name} avatarUrl={isMe ? user.avatar : otherParty.avatar} className="w-8 h-8"/>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${isMe ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                                        {msg.content && <p className="leading-relaxed mb-2">{msg.content}</p>}
                                        
                                        {/* File Attachments */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="space-y-2">
                                                {msg.attachments.map((attachment, index) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                                                        <i className="fas fa-paperclip text-gray-500"></i>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{attachment.filename}</p>
                                                            <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                                                        </div>
                                                        <a 
                                                            href={`https://edcon-production.up.railway.app${attachment.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            <i className="fas fa-download"></i>
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <p className={`text-xs mt-2 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Message Input Area */}
                <div className="p-4 border-t bg-white rounded-b-lg">
                    {/* File Attachments Preview */}
                    {selectedFiles.length > 0 && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <i className="fas fa-paperclip text-blue-600"></i>
                                <span className="text-sm font-medium text-blue-700">Attachments ({selectedFiles.length})</span>
                            </div>
                            <div className="space-y-2">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                                        <i className="fas fa-file text-gray-500"></i>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                        <button 
                                            onClick={() => removeFile(index)}
                                            className="text-red-500 hover:text-red-700"
                                            type="button"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Message Input Form */}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={t('type_a_message')}
                            className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isUploading}
                        />
                        
                        {/* File Attachment Button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="bg-gray-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-600 transition shadow-md disabled:opacity-50"
                            title="Attach files"
                        >
                            <i className="fas fa-paperclip"></i>
                        </button>
                        
                        {/* Send Button */}
                        <button 
                            type="submit" 
                            className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading}
                            title="Send message"
                        >
                            {isUploading ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fas fa-paper-plane"></i>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

const StudentCodesTab: React.FC<{ students: Student[] }> = ({ students }) => {
    const { t } = useContext(AppContext);

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('student_codes')}</h2>
                <p className="text-gray-600 mb-4">{t('student_codes_description')}</p>
                
                <div className="space-y-4">
                    {students.map(student => (
                        <div key={student.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img 
                                        src={student.avatar} 
                                        alt={student.name} 
                                        className="w-12 h-12 rounded-full object-cover bg-gray-200"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                                        <p className="text-sm text-gray-500">{t('student')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="mb-2">
                                        <span className="text-sm text-gray-500">{t('login_code')}:</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-mono text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                                            {student.id}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(student.id)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
                                        >
                                            {t('copy')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default ParentDashboard;