

import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import { Student, Grade, Homework, Announcement, User, Message, UserRole } from '../types';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
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
                        <QuickOverview student={selectedStudent}/>
                        <AttendanceSummary student={selectedStudent} />
                        <RecentAnnouncements />
                    </>
                )}

                {activeTab === 'performance' && selectedStudent && (
                    <>
                        <GradesList student={selectedStudent} />
                        <PerformanceSummary student={selectedStudent} />
                    </>
                )}

                {activeTab === 'homework' && selectedStudent && (
                    <>
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

const QuickOverview: React.FC<{student: Student}> = ({student}) => {
    const { t, grades, homework, attendance } = useContext(AppContext);
    
    const studentGrades = grades.filter(g => g.studentId === student.id);
    const studentAttendance = attendance.filter(a => a.studentId === student.id);
    const recentHomework = homework.slice(0, 3); // Show last 3 homework assignments
    
    const attendanceRate = studentAttendance.length > 0 
        ? (studentAttendance.filter(a => a.status === 'present').length / studentAttendance.length * 100).toFixed(1)
        : 0;
    
    const averageGrade = studentGrades.length > 0
        ? (studentGrades.reduce((sum, g) => sum + (g.marksObtained / g.maxMarks * 100), 0) / studentGrades.length).toFixed(1)
        : 0;

    return (
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <i className="fa-solid fa-chart-line mr-2"></i>
                {t('quick_overview')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold">{averageGrade}%</div>
                    <div className="text-sm opacity-90">{t('average_grade')}</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold">{attendanceRate}%</div>
                    <div className="text-sm opacity-90">{t('attendance_rate')}</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold">{recentHomework.length}</div>
                    <div className="text-sm opacity-90">{t('recent_homework')}</div>
                </div>
            </div>
        </Card>
    );
};

const PerformanceSummary: React.FC<{ student: Student }> = ({ student }) => {
    const { t, grades } = useContext(AppContext);
    const studentGrades = grades.filter(g => g.studentId === student.id);
    
    if (studentGrades.length === 0) {
        return (
            <Card>
                <h2 className="text-lg font-bold mb-4">{t('performance_summary')}</h2>
                <p className="text-gray-600">{t('no_marks')}</p>
            </Card>
        );
    }

    const subjects = [...new Set(studentGrades.map(g => g.subject))];
    const subjectAverages = subjects.map(subject => {
        const subjectGrades = studentGrades.filter(g => g.subject === subject);
        const average = subjectGrades.reduce((sum, g) => sum + (g.marksObtained / g.maxMarks * 100), 0) / subjectGrades.length;
        return { subject, average: average.toFixed(1) };
    });

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">{t('performance_summary')}</h2>
            <div className="space-y-3">
                {subjectAverages.map(({ subject, average }) => (
                    <div key={subject} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{subject}</span>
                        <span className="text-lg font-bold text-blue-600">{average}%</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const GradesList: React.FC<{ student: Student }> = ({ student }) => {
    const { t, grades } = useContext(AppContext);
    const studentGrades = grades.filter(g => g.studentId === student.id);

    if (studentGrades.length === 0) {
        return (
            <Card>
                <h2 className="text-lg font-bold mb-4">{t('recent_marks')}</h2>
                <p className="text-gray-600">{t('no_marks')}</p>
            </Card>
        );
    }

    const sortedGrades = studentGrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">{t('recent_marks')}</h2>
            <div className="space-y-3">
                {sortedGrades.slice(0, 10).map((grade, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                            <div className="font-medium">{grade.assignment || 'No Assignment'}</div>
                            <div className="text-sm text-gray-600">{grade.subject} • {new Date(grade.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{grade.marksObtained}/{grade.maxMarks}</div>
                            <div className="text-sm text-gray-600">{((grade.marksObtained / grade.maxMarks) * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const HomeworkSummary: React.FC<{ student: Student }> = ({ student }) => {
    const { t, homework } = useContext(AppContext);
    
    if (homework.length === 0) {
        return (
            <Card>
                <h2 className="text-lg font-bold mb-4">{t('homework_status')}</h2>
                <p className="text-gray-600">{t('no_homework')}</p>
            </Card>
        );
    }

    const sortedHomework = homework.sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">{t('homework_status')}</h2>
            <div className="space-y-3">
                {sortedHomework.slice(0, 10).map((hw, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{hw.title}</div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                hw.submitted.includes(student.id) 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {hw.submitted.includes(student.id) ? t('submitted') : t('not_submitted')}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600">
                            {hw.subject} • {t('due_date')}: {new Date(hw.dueDate).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const AttendanceSummary: React.FC<{ student: Student }> = ({ student }) => {
    const { t, attendance } = useContext(AppContext);
    const studentAttendance = attendance.filter(a => a.studentId === student.id);

    if (studentAttendance.length === 0) {
        return (
            <Card>
                <h2 className="text-lg font-bold mb-4">{t('overall_attendance')}</h2>
                <p className="text-gray-600">{t('no_attendance')}</p>
            </Card>
        );
    }

    const recentAttendance = studentAttendance
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7);

    const statusCounts = {
        present: studentAttendance.filter(a => a.status === 'present').length,
        absent: studentAttendance.filter(a => a.status === 'absent').length,
        late: studentAttendance.filter(a => a.status === 'late').length
    };

    const totalDays = studentAttendance.length;
    const attendanceRate = totalDays > 0 ? (statusCounts.present / totalDays * 100).toFixed(1) : 0;

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">{t('overall_attendance')}</h2>
            <div className="mb-4">
                <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
                <div className="text-sm text-gray-600">{t('attendance_rate')}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{statusCounts.present}</div>
                    <div className="text-sm text-gray-600">{t('present')}</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{statusCounts.absent}</div>
                    <div className="text-sm text-gray-600">{t('absent')}</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{statusCounts.late}</div>
                    <div className="text-sm text-gray-600">{t('late')}</div>
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-700">{t('recent_attendance')}</h3>
                {recentAttendance.map((record, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span>{new Date(record.date).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {t(record.status)}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const RecentAnnouncements: React.FC = () => {
    const { t, announcements } = useContext(AppContext);
    
    if (announcements.length === 0) {
        return (
            <Card>
                <h2 className="text-lg font-bold mb-4">{t('recent_announcements')}</h2>
                <p className="text-gray-600">{t('no_announcements')}</p>
            </Card>
        );
    }

    const recentAnnouncements = announcements
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">{t('recent_announcements')}</h2>
            <div className="space-y-3">
                {recentAnnouncements.map((announcement, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{announcement.title}</div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
                                announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                                {t(announcement.priority + '_priority')}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">{announcement.content}</div>
                        <div className="text-xs text-gray-500">{new Date(announcement.date).toLocaleDateString()}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const AnnouncementsList: React.FC = () => {
    const { t, announcements } = useContext(AppContext);
    
    if (announcements.length === 0) {
        return (
            <Card>
                <h2 className="text-lg font-bold mb-4">{t('announcements')}</h2>
                <p className="text-gray-600">{t('no_announcements')}</p>
            </Card>
        );
    }

    const sortedAnnouncements = announcements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">{t('announcements')}</h2>
            <div className="space-y-4">
                {sortedAnnouncements.map((announcement, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg">{announcement.title}</h3>
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                                announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
                                announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                            }`}>
                                {t(announcement.priority + '_priority')}
                            </span>
                        </div>
                        <p className="text-gray-700 mb-3">{announcement.content}</p>
                        <div className="text-sm text-gray-500">{new Date(announcement.date).toLocaleDateString()}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const ParentMessaging: React.FC<{ student: Student }> = ({ student }) => {
    const { t, user, users, messages, setMessages } = useContext(AppContext);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);

    const teachers = useMemo(() => {
        return users.filter(u => u.role === 'teacher');
    }, [users]);

    const conversations = useMemo(() => {
        if (!user) return [];
        const teacherIds = new Set(messages.flatMap(m => 
            m.senderId === user.id ? [m.receiverId] : m.receiverId === user.id ? [m.senderId] : []
        ));
        
        return Array.from(teacherIds).map(teacherId => {
            const teacher = users.find(u => u.id === teacherId);
            const convMessages = messages.filter(m => 
                (m.senderId === teacherId && m.receiverId === user.id) || 
                (m.senderId === user.id && m.receiverId === teacherId)
            );
            const lastMessage = convMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            const unreadCount = convMessages.filter(m => m.receiverId === user.id && !m.isRead).length;
            return { teacher, lastMessage, unreadCount };
        }).filter(c => c.teacher);
    }, [user, messages, users]);

    const handleOpenChat = (teacher: User) => {
        setSelectedTeacher(teacher);
        setIsChatOpen(true);
        // Mark messages as read
        const updatedMessages = messages.map(m => 
            (m.senderId === teacher.id && m.receiverId === user?.id) ? { ...m, isRead: true } : m
        );
        setMessages(updatedMessages);
    };

    const handleCloseChat = () => {
        setIsChatOpen(false);
        setSelectedTeacher(null);
    };

    return (
        <>
            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('messages')}</h2>
                <div className="space-y-3">
                    {conversations.map(({ teacher, lastMessage, unreadCount }) => (
                        teacher && <div key={teacher.id} onClick={() => handleOpenChat(teacher)} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                             <div className="relative">
                                <ProfileImage name={teacher.name} avatarUrl={teacher.avatar} />
                                {unreadCount > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-500 border-2 border-white"></span>}
                            </div>
                            <div className="ml-4 rtl:mr-4 flex-grow">
                                <p className="font-semibold text-gray-800">{teacher.name}</p>
                                <p className={`text-sm ${unreadCount > 0 ? 'font-bold text-gray-700' : 'text-gray-500'} truncate`}>
                                    {lastMessage?.type === 'voice' ? 'Voice Message' : lastMessage?.content || ''}
                                </p>
                            </div>
                            <span className="text-xs text-gray-400">{lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                    ))}
                    {conversations.length === 0 && <p className="text-center text-gray-500">{t('no_messages_yet')}</p>}
                </div>
            </Card>
            {selectedTeacher && <ChatModal isOpen={isChatOpen} onClose={handleCloseChat} otherParty={selectedTeacher} />}
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
                        const sender = isMe ? user : otherParty;
                        return (
                            <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={isMe ? 'order-2' : 'order-1'}>
                                    <ProfileImage name={sender.name} avatarUrl={sender.avatar} className="w-8 h-8"/>
                                </div>
                                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${isMe ? 'bg-blue-500 text-white order-1' : 'bg-white text-gray-800 shadow-sm order-2'}`}>
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
        // You could add a toast notification here
    };

    return (
        <Card>
            <h2 className="text-lg font-bold mb-4">{t('student_codes')}</h2>
            <p className="text-gray-600 mb-4">{t('student_codes_description')}</p>
            <div className="space-y-3">
                {students.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                            <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-gray-600">{t('student')}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                                {student.id}
                            </span>
                            <button
                                onClick={() => copyToClipboard(student.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                                {t('copy')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default ParentDashboard;