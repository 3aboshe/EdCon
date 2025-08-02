

import React, { useState, useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { Homework, Student, Attendance, Announcement, User, Message, UserRole } from '../types';
import { Grade } from '../services/apiService';
import ProfileImage from '../components/common/ProfileImage';
import ProfileScreen from './ProfileScreen';
import apiService from '../services/apiService';

type Screen = 'dashboard' | 'attendance' | 'homework' | 'announcements' | 'marks' | 'leaderboard' | 'messages' | 'profile';

const SuccessBanner: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-green-100 border-t-4 border-green-500 text-green-700 px-4 py-3 rounded-b-lg shadow-md mb-4" role="alert">
      <div className="flex">
        <div className="py-1"><i className="fa-solid fa-check-circle mr-3"></i></div>
        <div>
          <p className="font-bold">{message}</p>
        </div>
      </div>
    </div>
);

const TeacherDashboard: React.FC = () => {
    const { user, t, students: allStudents, classes } = useContext(AppContext);
    const [screen, setScreen] = useState<Screen>('dashboard');
    const [successMessage, setSuccessMessage] = useState('');

    const teacherClasses = useMemo(() => {
        console.log('=== TEACHER DASHBOARD DEBUG ===');
        console.log('User:', user);
        console.log('User classIds:', user?.classIds);
        console.log('All classes:', classes);
        console.log('Class IDs:', classes.map(c => c.id));
        
        const mapped = user?.classIds?.map(cid => classes.find(c => c.id === cid)).filter(Boolean) as {id: string, name: string}[] || [];
        console.log('Teacher classes:', mapped);
        return mapped;
    }, [user, classes]);
    
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

    useEffect(() => {
        if (teacherClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(teacherClasses[0].id);
        }
    }, [teacherClasses, selectedClassId]);

    const studentsInClass = useMemo(() => allStudents.filter(s => s.classId === selectedClassId), [selectedClassId, allStudents]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 4000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleBack = () => setScreen('dashboard');

    const renderScreen = () => {
        if (screen !== 'dashboard' && screen !== 'messages' && screen !== 'profile' && !selectedClassId) {
            return <Card><p>Please select a class.</p></Card>;
        }
        switch (screen) {
            case 'attendance':
                return <AttendanceManager students={studentsInClass} setSuccessMessage={setSuccessMessage} />;
            case 'homework':
                return <HomeworkManager studentsInClass={studentsInClass} setSuccessMessage={setSuccessMessage} />;
            case 'announcements':
                return <AnnouncementManager setSuccessMessage={setSuccessMessage} onPost={handleBack} />;
            case 'leaderboard':
                return <Leaderboard students={studentsInClass} />;
            case 'marks':
                return <GradeManager studentsInClass={studentsInClass} setSuccessMessage={setSuccessMessage} />;
            case 'messages':
                return <TeacherMessagingInbox />;
            case 'profile':
                return <ProfileScreen />;
            default:
                return <DashboardMenu setScreen={setScreen} teacherName={user?.name || ''} />;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header title={t(screen)} showBackButton={screen !== 'dashboard'} onBack={handleBack} />
            {successMessage && <SuccessBanner message={successMessage} />}
            <main className="p-4 space-y-4 flex-grow">
                 {teacherClasses.length > 1 && screen !== 'dashboard' && screen !== 'messages' && screen !== 'profile' && (
                     <Card>
                        <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-2">{t('select_class')}</label>
                        <select
                            id="class-select"
                            value={selectedClassId || ''}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            {teacherClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </Card>
                 )}
                 <div className={successMessage ? 'mt-0' : ''}>
                    {renderScreen()}
                 </div>
            </main>
        </div>
    );
};

const DashboardMenu: React.FC<{ setScreen: (s: Screen) => void, teacherName: string }> = ({ setScreen, teacherName }) => {
    const { t } = useContext(AppContext);
    const menuItems = [
        { screen: 'attendance', icon: 'fa-user-check', label: 'take_attendance' },
        { screen: 'homework', icon: 'fa-book-medical', label: 'manage_homework' },
        { screen: 'announcements', icon: 'fa-bullhorn', label: 'post_announcement' },
        { screen: 'marks', icon: 'fa-marker', label: 'manage_grades' },
        { screen: 'leaderboard', icon: 'fa-trophy', label: 'leaderboard' },
        { screen: 'messages', icon: 'fa-comments', label: 'messages' },
        { screen: 'profile', icon: 'fa-user-circle', label: 'profile' },
    ] as const;

    return (
        <>
            <h1 className="text-2xl font-bold text-gray-800 px-2">{t('teacher_of')} {teacherName}</h1>
            <div className="grid grid-cols-2 gap-4">
                {menuItems.map(item => (
                    <Card key={item.screen} className="text-center hover:shadow-lg hover:scale-105 transition-transform cursor-pointer" onClick={() => setScreen(item.screen)}>
                        <i className={`fas ${item.icon} text-4xl text-blue-500 mb-4`}></i>
                        <h2 className="font-semibold text-gray-800">{t(item.label)}</h2>
                    </Card>
                ))}
            </div>
        </>
    );
};

const AttendanceManager: React.FC<{ students: Student[], setSuccessMessage: (msg: string) => void }> = ({ students, setSuccessMessage }) => {
    const { t, attendance: allAttendance, setAttendance: setAllAttendance } = useContext(AppContext);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [attendanceUpdates, setAttendanceUpdates] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

    useEffect(() => {
        const newAttendanceState: Record<string, 'present' | 'absent' | 'late'> = {};
        students.forEach(s => {
            const record = allAttendance.find(a => a.studentId === s.id && a.date === selectedDate);
            newAttendanceState[s.id] = record?.status || 'present';
        });
        setAttendanceUpdates(newAttendanceState);
    }, [selectedDate, students, allAttendance]);

    const setStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
        setAttendanceUpdates(prev => ({ ...prev, [studentId]: status }));
    };

    const markAllPresent = () => {
        const allPresentUpdates = students.reduce((acc, student) => {
            acc[student.id] = 'present';
            return acc;
        }, {} as Record<string, 'present' | 'absent' | 'late'>);
        setAttendanceUpdates(allPresentUpdates);
    };

    const handleSave = () => {
        const updatedAttendance = [...allAttendance];
        Object.entries(attendanceUpdates).forEach(([studentId, status]) => {
            const recordIndex = updatedAttendance.findIndex(a => a.studentId === studentId && a.date === selectedDate);
    
            if (recordIndex !== -1) {
                if(updatedAttendance[recordIndex].status !== status) updatedAttendance[recordIndex] = { ...updatedAttendance[recordIndex], status: status };
            } else {
                updatedAttendance.push({ date: selectedDate, studentId, status });
            }
        });
        setAllAttendance(updatedAttendance);
        setSuccessMessage(t('attendance_saved_success'));
    };

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">{t('take_attendance')}</h2>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <button onClick={markAllPresent} className="w-full bg-green-100 text-green-700 font-semibold py-2 rounded-lg hover:bg-green-200 transition mb-4">
                <i className="fa-solid fa-check-double mr-2"></i>{t('mark_all_present')}
            </button>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {students.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-100">
                        <p className="font-medium text-slate-800">{student.name}</p>
                        <div className="flex gap-1">
                            {(['present', 'absent', 'late'] as const).map(status => (
                                <button key={status} onClick={() => setStatus(student.id, status)}
                                    className={`px-3 py-1 text-sm rounded-full transition ${ attendanceUpdates[student.id] === status ? { present: 'bg-green-500 text-white', absent: 'bg-red-500 text-white', late: 'bg-yellow-500 text-white' }[status] : 'bg-gray-200 text-gray-600 hover:bg-gray-300' }`}>
                                    {t(status)}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={handleSave} className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
                {t('update_attendance')}
            </button>
        </Card>
    );
};

const HomeworkManager: React.FC<{ studentsInClass: Student[], setSuccessMessage: (msg: string) => void }> = ({ studentsInClass, setSuccessMessage }) => {
    const { t, user, homework: allHomework, setHomework: setAllHomework, subjects } = useContext(AppContext);
    const [isSubmissionsModalOpen, setSubmissionsModalOpen] = useState(false);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [homeworkToDelete, setHomeworkToDelete] = useState<Homework | null>(null);
    const [homeworkToMark, setHomeworkToMark] = useState<Homework | null>(null);
    const [submissions, setSubmissions] = useState<string[]>([]);
    
    // State for new homework
    const [newHwTitle, setNewHwTitle] = useState('');
    const [newHwSubject, setNewHwSubject] = useState(subjects[0]?.name || '');
    const [newHwDueDate, setNewHwDueDate] = useState('');

    const openSubmissionModal = (hw: Homework) => {
        setHomeworkToMark(hw);
        setSubmissions(hw.submitted);
        setSubmissionsModalOpen(true);
    };
    
    const openDeleteModal = (hw: Homework) => {
        setHomeworkToDelete(hw);
        setIsDeleteModalOpen(true);
    };

    const handleSaveSubmissions = async () => {
        if (!homeworkToMark) return;
        
        try {
            await apiService.updateHomework(homeworkToMark.id, { submitted: submissions });
            setAllHomework(allHomework.map(hw => hw.id === homeworkToMark.id ? { ...hw, submitted: submissions } : hw));
            setSubmissionsModalOpen(false);
            setHomeworkToMark(null);
            setSuccessMessage(t('submissions_saved_success'));
        } catch (error) {
            console.error('Error saving submissions:', error);
            setSuccessMessage(t('error_saving_submissions'));
        }
    };
    
    const handleAssignHomework = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newHwTitle || !newHwSubject || !newHwDueDate || !user) return;
        
        try {
            const newHomework = await apiService.createHomework({
                title: newHwTitle,
                subject: newHwSubject,
                dueDate: newHwDueDate,
                assignedDate: new Date().toISOString().slice(0, 10),
                teacherId: user.id,
                submitted: []
            });
            
            setAllHomework([...allHomework, newHomework]);
            setCreateModalOpen(false);
            setNewHwTitle('');
            setNewHwSubject(subjects[0]?.name || '');
            setNewHwDueDate('');
            setSuccessMessage(t('homework_assigned_success'));
        } catch (error) {
            console.error('Error creating homework:', error);
            setSuccessMessage(t('error_creating_homework'));
        }
    };

    const handleConfirmDelete = async () => {
        if (!homeworkToDelete) return;
        
        try {
            await apiService.deleteHomework(homeworkToDelete.id);
            setAllHomework(allHomework.filter(hw => hw.id !== homeworkToDelete.id));
            setIsDeleteModalOpen(false);
            setHomeworkToDelete(null);
            setSuccessMessage(t('homework_deleted_success'));
        } catch (error) {
            console.error('Error deleting homework:', error);
            setSuccessMessage(t('error_deleting_homework'));
        }
    };

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-bold text-gray-800">{t('manage_homework')}</h2>
                     <button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{t('assign_new_homework')}</button>
                </div>
                <div className="space-y-4">
                    {allHomework.map(hw => (
                        <div key={hw.id} className="p-3 rounded-lg bg-gray-100 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-slate-800">{hw.title} ({hw.subject})</p>
                                <p className="text-sm text-gray-500">{t('due_date')}: {hw.dueDate}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <button onClick={() => openSubmissionModal(hw)} className="text-blue-600 text-sm hover:underline">
                                    {t('submissions')} ({hw.submitted.length}/{studentsInClass.length})
                                </button>
                                <button onClick={() => openDeleteModal(hw)} className="text-red-600 text-sm hover:underline ml-4 rtl:mr-4">
                                    <i className="fa-solid fa-trash mr-1 rtl:ml-1"></i>{t('delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            
            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title={t('assign_new_homework')}>
                <form onSubmit={handleAssignHomework} className="space-y-4">
                    <div>
                        <label htmlFor="hw-title" className="block text-sm font-medium text-gray-700">{t('title')}</label>
                        <input id="hw-title" type="text" value={newHwTitle} onChange={e => setNewHwTitle(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="hw-subject" className="block text-sm font-medium text-gray-700">{t('subject')}</label>
                        <select id="hw-subject" value={newHwSubject} onChange={e => setNewHwSubject(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required>
                            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="hw-due-date" className="block text-sm font-medium text-gray-700">{t('due_date_label')}</label>
                        <input id="hw-due-date" type="date" value={newHwDueDate} onChange={e => setNewHwDueDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">{t('assign_new_homework')}</button>
                </form>
            </Modal>
            
            <Modal isOpen={isSubmissionsModalOpen} onClose={() => setSubmissionsModalOpen(false)} title={t('homework_submission_title')}>
                <p className="text-gray-600 mb-4">{t('homework_submission_desc')}</p>
                <div className="flex gap-2 mb-4">
                    <button onClick={() => setSubmissions(studentsInClass.map(s => s.id))} className="flex-1 bg-green-100 text-green-700 text-sm p-2 rounded-md">{t('select_all')}</button>
                    <button onClick={() => setSubmissions([])} className="flex-1 bg-red-100 text-red-700 text-sm p-2 rounded-md">{t('deselect_all')}</button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {studentsInClass.map(student => (
                        <div key={student.id} className="flex items-center p-2 border rounded-md">
                            <input type="checkbox" id={`student-${student.id}`} checked={submissions.includes(student.id)} onChange={() => setSubmissions(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id])} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                            <label htmlFor={`student-${student.id}`} className="ml-3 min-w-0 flex-1 text-slate-800">{student.name}</label>
                        </div>
                    ))}
                </div>
                <button onClick={handleSaveSubmissions} className="mt-6 w-full bg-blue-600 text-white font-bold py-2 rounded-lg">{t('save')}</button>
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('confirm_delete_title')}>
                <p className="mb-6 text-gray-700">{t('confirm_delete_homework_message')}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">{t('cancel')}</button>
                    <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">{t('delete')}</button>
                </div>
            </Modal>
        </>
    );
};

const AnnouncementManager: React.FC<{ setSuccessMessage: (msg: string) => void, onPost: () => void }> = ({ setSuccessMessage, onPost }) => {
    const { t, user, announcements, setAnnouncements } = useContext(AppContext);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!title || !content || !user) return;
        const newAnnouncement: Announcement = {
            id: `AN${Date.now()}`,
            title, content, priority,
            teacherId: user.id,
            date: new Date().toISOString().slice(0, 10)
        };
        setAnnouncements([newAnnouncement, ...announcements]);
        setSuccessMessage(t('announcement_posted_success'));
        onPost();
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('post_announcement')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="text-sm font-medium text-gray-700">{t('title')}</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required/>
                </div>
                 <div>
                    <label className="text-sm font-medium text-gray-700">{t('content')}</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full mt-1 p-2 border rounded-md" rows={4} required></textarea>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">{t('priority')}</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full mt-1 p-2 border rounded-md">
                        <option value="low">{t('low_priority')}</option>
                        <option value="medium">{t('medium_priority')}</option>
                        <option value="high">{t('high_priority')}</option>
                    </select>
                </div>
                 <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">{t('post_announcement')}</button>
            </form>
        </Card>
    );
};

type AssignmentIdentifier = { title: string; subject: string; date: string };

const GradeManager: React.FC<{ studentsInClass: Student[], setSuccessMessage: (msg: string) => void }> = ({ studentsInClass, setSuccessMessage }) => {
    const { user } = useContext(AppContext);
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentIdentifier | null>(null);

    const handleEdit = (assignment: AssignmentIdentifier) => {
        setSelectedAssignment(assignment);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedAssignment(null);
        setView('edit');
    };

    const handleSave = (message: string) => {
        setView('list');
        setSuccessMessage(message);
    };

    if (view === 'edit') {
        return <GradeEditor assignment={selectedAssignment} onSave={handleSave} teacherId={user!.id} students={studentsInClass} />;
    }
    
    return <AssignmentList studentsInClass={studentsInClass} onEdit={handleEdit} onCreate={handleCreate} setSuccessMessage={setSuccessMessage} />;
};

interface AssignmentListProps {
    studentsInClass: Student[];
    onEdit: (a: AssignmentIdentifier) => void;
    onCreate: () => void;
    setSuccessMessage: (msg: string) => void;
}

const AssignmentList: React.FC<AssignmentListProps> = ({ studentsInClass, onEdit, onCreate, setSuccessMessage }) => {
    const { t, grades: allGrades, setGrades } = useContext(AppContext);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentIdentifier | null>(null);
    
    const assignments = useMemo(() => {
        const studentIds = new Set(studentsInClass.map(s => s.id));
        const gradesForClass = allGrades.filter(g => studentIds.has(g.studentId));
        const grouped: Record<string, AssignmentIdentifier> = {};
        gradesForClass.forEach(grade => {
            const key = `${grade.assignment}|${grade.subject}`;
            if (!grouped[key]) {
                grouped[key] = { 
                    title: grade.assignment, 
                    subject: grade.subject, 
                    date: grade.date 
                };
            }
        });
        return Object.values(grouped).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [studentsInClass, allGrades]);
    
    const openDeleteModal = (assignment: AssignmentIdentifier) => {
        setAssignmentToDelete(assignment);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!assignmentToDelete) return;
        
        try {
            // Delete all grades for this assignment
            const gradesToDelete = allGrades.filter(g => 
                g.assignment === assignmentToDelete.title && g.subject === assignmentToDelete.subject
            );
            
            for (const grade of gradesToDelete) {
                if (grade._id) {
                    await apiService.deleteGrade(grade._id);
                }
            }
            
            setGrades(allGrades.filter(g => 
                !(g.assignment === assignmentToDelete.title && g.subject === assignmentToDelete.subject)
            ));
            setIsDeleteModalOpen(false);
            setAssignmentToDelete(null);
            setSuccessMessage(t('assignment_deleted_success'));
        } catch (error) {
            console.error('Error deleting assignment:', error);
            setSuccessMessage(t('error_deleting_assignment'));
        }
    };

    return (
        <>
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">{t('manage_grades')}</h2>
                <button onClick={onCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">{t('create_new_assignment')}</button>
            </div>
            {assignments.length > 0 ? (
                <div className="space-y-3">
                    {assignments.map(assign => (
                        <div key={`${assign.title}-${assign.subject}`} className="p-4 rounded-lg bg-gray-100 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-slate-800">{assign.title}</p>
                                <p className="text-sm text-gray-500">{assign.subject} - {new Date(assign.date).toLocaleDateString()}</p>
                            </div>
                             <div>
                                <button onClick={() => onEdit(assign)} className="text-blue-600 hover:underline text-sm">{t('edit_grades')}</button>
                                <button onClick={() => openDeleteModal(assign)} className="text-red-600 hover:underline ml-4 text-sm rtl:mr-4">
                                    <i className="fa-solid fa-trash mr-1 rtl:ml-1"></i>{t('delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-500 text-center py-4">{t('no_assignments_yet')}</p>}
        </Card>
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('confirm_delete_title')}>
            <p className="mb-6 text-gray-700">{t('confirm_delete_assignment_message')}</p>
            <div className="flex justify-end gap-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">{t('cancel')}</button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">{t('delete')}</button>
            </div>
        </Modal>
        </>
    );
};

const GradeEditor: React.FC<{ students: Student[], assignment: AssignmentIdentifier | null, onSave: (message: string) => void, teacherId: string }> = ({ students, assignment, onSave, teacherId }) => {
    const { t, grades: allGrades, setGrades, subjects } = useContext(AppContext);
    const [details, setDetails] = useState({
        title: assignment?.title || '',
        subject: assignment?.subject || subjects[0]?.name || '',
        maxMarks: allGrades.find(g => g.assignment === assignment?.title)?.maxMarks || 100,
        date: new Date().toISOString().slice(0,10)
    });
    const [studentGrades, setStudentGrades] = useState<Record<string, number | string>>({});
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (assignment) {
            const gradeMap = allGrades.filter(g => g.assignment === assignment.title && g.subject === assignment.subject)
                .reduce((acc, g) => ({...acc, [g.studentId]: g.marksObtained}), {} as Record<string, number>);
            setStudentGrades(gradeMap);
        }
        inputRefs.current = inputRefs.current.slice(0, students.length);
    }, [assignment, students, allGrades]);

    const handleGradeChange = (studentId: string, value: string) => {
        const marks = value === '' ? '' : parseInt(value, 10);
        if (marks === '' || (!isNaN(marks) && marks >= 0 && marks <= details.maxMarks)) setStudentGrades(prev => ({ ...prev, [studentId]: marks }));
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const nextInput = inputRefs.current[index + 1];
            if (nextInput) {
                nextInput.focus();
            }
        }
    };

    const handleSaveGrades = async () => {
        try {
            // Delete existing grades for this assignment
            const existingGrades = allGrades.filter(g => g.assignment === details.title && g.subject === details.subject);
            for (const grade of existingGrades) {
                if (grade._id) {
                    await apiService.deleteGrade(grade._id);
                }
            }
            
            // Create new grades
            const newGrades = Object.entries(studentGrades).map(([studentId, marks]) => {
                if (marks === '' || marks === undefined) return null;
                return {
                    studentId, 
                    subject: details.subject, 
                    assignment: details.title,
                    marksObtained: marks as number, 
                    maxMarks: details.maxMarks, 
                    date: details.date, 
                    type: 'exam'
                };
            }).filter(Boolean) as Omit<Grade, '_id'>[];

            // Save each grade to database
            const savedGrades = [];
            for (const grade of newGrades) {
                const savedGrade = await apiService.addGrade(grade);
                savedGrades.push(savedGrade);
            }

            // Update local state
            const updatedGrades = allGrades.filter(g => !(g.assignment === details.title && g.subject === details.subject));
            setGrades([...updatedGrades, ...savedGrades]);
            
            // Refresh grades from server to ensure consistency
            const refreshedGrades = await apiService.getAllGrades();
            setGrades(refreshedGrades);
            
            onSave(t('grades_saved_success'));
        } catch (error) {
            console.error('Error saving grades:', error);
            onSave(t('error_saving_grades'));
        }
    };

    return (
        <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{assignment ? t('edit_grades') : t('create_new_assignment')}</h2>
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 mb-6">
                <h3 className="font-semibold text-lg text-gray-700">{t('assignment_details')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('assignment_title')}</label>
                        <input type="text" value={details.title} onChange={e => setDetails({...details, title: e.target.value})} disabled={!!assignment} className="w-full mt-1 p-2 border rounded-md disabled:bg-gray-200" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('subject')}</label>
                        <select value={details.subject} onChange={e => setDetails({...details, subject: e.target.value})} disabled={!!assignment} className="w-full mt-1 p-2 border rounded-md disabled:bg-gray-200">
                             {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('max_marks')}</label>
                        <input type="number" value={details.maxMarks} onChange={e => setDetails({...details, maxMarks: parseInt(e.target.value, 10)})} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">{t('due_date_label')}</label>
                        <input type="date" value={details.date} onChange={e => setDetails({...details, date: e.target.value})} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {students.map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                        <div className="flex items-center gap-3">
                            <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                            <p className="font-medium text-slate-800">{student.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <input 
                                type="number" 
                                value={studentGrades[student.id] ?? ''} 
                                onChange={e => handleGradeChange(student.id, e.target.value)} 
                                onKeyDown={e => handleKeyDown(e, index)}
                                ref={el => { inputRefs.current[index] = el; }}
                                className="w-20 p-1 border rounded-md text-center" 
                                placeholder="N/A" 
                           />
                           <span className="text-gray-500">/ {details.maxMarks}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <button onClick={handleSaveGrades} className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">{t('save_grades')}</button>
        </Card>
    );
};

const Leaderboard: React.FC<{ students: Student[] }> = ({ students }) => {
    const { t, grades: allGrades } = useContext(AppContext);
    const leaderboardData = useMemo(() => {
        return students.map(student => {
            const studentGrades = allGrades.filter(g => g.studentId === student.id);
            if (studentGrades.length === 0) return { ...student, avg: 0 };
            const totalMarks = studentGrades.reduce((sum, g) => sum + (g.marksObtained / g.maxMarks) * 100, 0);
            return { ...student, avg: totalMarks / studentGrades.length };
        }).sort((a, b) => b.avg - a.avg);
    }, [students, allGrades]);

    return (
        <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('leaderboard_title')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th className="p-3">{t('rank')}</th>
                            <th className="p-3">{t('student_name')}</th>
                            <th className="p-3 text-right">{t('average_marks')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboardData.map((s, index) => (
                             <tr key={s.id} className={`border-b ${index < 3 ? 'bg-yellow-50' : 'bg-white'}`}>
                                <td className="p-3 font-bold text-lg text-gray-700 text-center w-12">
                                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                                </td>
                                <td className="p-3 font-medium text-gray-900">
                                    <div className="flex items-center gap-3">
                                        <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                                        <span>{s.name}</span>
                                    </div>
                                </td>
                                <td className="p-3 font-semibold text-right text-gray-700">{s.avg.toFixed(1)}%</td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const TeacherMessagingInbox: React.FC = () => {
    const { t, user, users, messages, setMessages } = useContext(AppContext);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedParent, setSelectedParent] = useState<User | null>(null);

    const conversations = useMemo(() => {
        if (!user) return [];
        const parentIds = new Set(messages.flatMap(m => m.senderId === user.id ? [m.receiverId] : m.receiverId === user.id ? [m.senderId] : []));
        
        return Array.from(parentIds).map(parentId => {
            const parent = users.find(u => u.id === parentId);
            const convMessages = messages.filter(m => (m.senderId === parentId && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === parentId));
            const lastMessage = convMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            const unreadCount = convMessages.filter(m => m.receiverId === user.id && !m.isRead).length;
            return { parent, lastMessage, unreadCount };
        }).filter(c => c.parent); // Ensure parent exists
    }, [user, messages, users]);

    const handleOpenChat = (parent: User) => {
        setSelectedParent(parent);
        setIsChatOpen(true);
        // Mark messages as read
        const updatedMessages = messages.map(m => 
            (m.senderId === parent.id && m.receiverId === user?.id) ? { ...m, isRead: true } : m
        );
        setMessages(updatedMessages);
    };

    const handleCloseChat = () => {
        setIsChatOpen(false);
        setSelectedParent(null);
    };

    return (
        <>
            <Card>
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('messages')}</h2>
                <div className="space-y-3">
                    {conversations.map(({ parent, lastMessage, unreadCount }) => (
                        parent && <div key={parent.id} onClick={() => handleOpenChat(parent)} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                             <div className="relative">
                                <ProfileImage name={parent.name} avatarUrl={parent.avatar} />
                                {unreadCount > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-500 border-2 border-white"></span>}
                            </div>
                            <div className="ml-4 rtl:mr-4 flex-grow">
                                <p className="font-semibold text-gray-800">{parent.name}</p>
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
            {selectedParent && <ChatModal isOpen={isChatOpen} onClose={handleCloseChat} otherParty={selectedParent} />}
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

export default TeacherDashboard;