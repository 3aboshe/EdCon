
import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../App';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Teacher, UserRole, Subject, User, Student } from '../types';
import ProfileImage from '../components/common/ProfileImage';
import apiService from '../services/apiService';
import { allAvatars } from '../data/avatars';

type AdminTab = 'overview' | 'students' | 'teachers' | 'management';

const generateUniqueCode = (prefix: 'P' | 'T' | 'S', existingIds: string[]): string => {
    let code = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    do {
        code = prefix + '-';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (existingIds.includes(code));
    return code;
};

const getRandomAvatar = (): string => {
    return allAvatars[Math.floor(Math.random() * allAvatars.length)];
};

const SuccessBanner: React.FC<{ message: string, onClear: () => void }> = ({ message, onClear }) => (
    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg flex justify-between items-center shadow">
        <p className="font-semibold" dangerouslySetInnerHTML={{ __html: message }}></p>
        <button onClick={onClear} className="text-lg">&times;</button>
    </div>
);

const AdminDashboard: React.FC = () => {
    const { t, classes: classList } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000); // Increased duration to see code
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const renderContent = () => {
        switch (activeTab) {
            case 'students':
                return <StudentsTab selectedClassId={selectedClassId} />;
            case 'teachers':
                return <TeachersTab selectedClassId={selectedClassId} />;
            case 'management':
                return <ManagementTab setSuccessMessage={setSuccessMessage} />;
            default:
                return <OverviewTab selectedClassId={selectedClassId} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title={t('admin')} />
            <main className="p-2 sm:p-4 space-y-4">
                 {successMessage && <SuccessBanner message={successMessage} onClear={() => setSuccessMessage('')} />}
                 <Card>
                    <label htmlFor="class-select-admin" className="block text-sm font-medium text-gray-700 mb-2">{t('view_stats_for')}</label>
                    <select
                        id="class-select-admin"
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">{t('school_wide')}</option>
                        {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </Card>

                <div className="bg-slate-100 rounded-lg shadow-inner p-1">
                    <nav className="flex space-x-1 sm:space-x-2">
                        {(['overview', 'students', 'teachers', 'management'] as AdminTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                    activeTab === tab 
                                        ? 'bg-blue-600 text-white shadow' 
                                        : 'text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {t(tab)}
                            </button>
                        ))}
                    </nav>
                </div>
                
                {renderContent()}
            </main>
        </div>
    );
};


// --- SUB-COMPONENTS FOR EACH TAB ---

interface TabProps {
    selectedClassId: string;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: string; color: string; gradient: string }> = ({ title, value, icon, color, gradient }) => {
    return (
        <div className={`relative overflow-hidden rounded-2xl shadow-lg p-6 ${gradient} text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className="w-full h-full bg-white rounded-full transform translate-x-8 -translate-y-8"></div>
            </div>
            
            {/* Icon Container */}
            <div className="relative z-10 mb-4">
                <div className={`w-16 h-16 rounded-2xl ${color} bg-opacity-20 backdrop-blur-sm flex items-center justify-center border border-white border-opacity-30`}>
                    <i className={`fas ${icon} text-2xl text-white`}></i>
                </div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
                <p className="text-4xl font-bold mb-1 tracking-tight">{value}</p>
                <p className="text-sm font-medium opacity-90 uppercase tracking-wide">{title}</p>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute bottom-2 right-2 w-8 h-8 opacity-20">
                <div className="w-full h-full border-2 border-white rounded-full"></div>
            </div>
        </div>
    );
};

const OverviewTab: React.FC<TabProps> = ({ selectedClassId }) => {
    const { t, users, students, grades, homework, announcements, teachers } = useContext(AppContext);

    const filteredStudents = useMemo(() => 
        selectedClassId === 'all' ? students : students.filter(s => s.classId === selectedClassId),
        [selectedClassId, students]
    );

    const totalTeachers = useMemo(() => users.filter(u => u.role?.toLowerCase() === 'teacher').length, [users]);

    const recentActivity = useMemo(() => {
        const homeworkActivities = homework.map(h => ({ ...h, type: 'homework', date: h.assignedDate }));
        const announcementActivities = announcements.map(a => ({ ...a, type: 'announcement' }));
        return [...homeworkActivities, ...announcementActivities]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [homework, announcements]);

    const GRADE_COLORS = { A: '#22c55e', B: '#84cc16', C: '#facc15', D: '#fb923c', F: '#ef4444' };

    // Calculate letter grades from marks
    const calculateLetterGrade = (marks: number, maxMarks: number): string => {
        const percentage = (marks / maxMarks) * 100;
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    // Process grades for distribution
    const gradeDistribution = useMemo(() => {
        const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        grades.forEach(grade => {
            const letterGrade = calculateLetterGrade(grade.marksObtained, grade.maxMarks);
            distribution[letterGrade]++;
        });
        return Object.entries(distribution).map(([grade, count]) => ({ name: grade, value: count }));
    }, [grades]);

    return (
        <div className="space-y-8">
            {/* Stats Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">School Overview</h2>
                <p className="text-gray-600">Monitor key metrics and performance indicators</p>
            </div>
            
            <div className="relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl opacity-50"></div>
                <div className="relative p-6 rounded-3xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <StatCard 
                            title={t('total_students')} 
                            value={filteredStudents.length} 
                            icon="fa-user-graduate" 
                            color="bg-blue-500" 
                            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                        />
                        <StatCard 
                            title={t('total_teachers')} 
                            value={totalTeachers} 
                            icon="fa-chalkboard-teacher" 
                            color="bg-teal-500" 
                            gradient="bg-gradient-to-br from-teal-500 to-teal-600"
                        />
                        <StatCard 
                            title={t('graded_assignments')} 
                            value={new Set(grades.map(g => `${g.assignment}|${g.subject}`)).size} 
                            icon="fa-clipboard-check" 
                            color="bg-indigo-500" 
                            gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
                        />
                        <StatCard 
                            title={t('total_submissions')} 
                            value={homework.reduce((sum, hw) => sum + hw.submitted.filter(sid => filteredStudents.some(s => s.id === sid)).length, 0)} 
                            icon="fa-file-lines" 
                            color="bg-rose-500" 
                            gradient="bg-gradient-to-br from-rose-500 to-rose-600"
                        />
                    </div>
                </div>
            </div>
            
            <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('grade_distribution')}</h2>
                {gradeDistribution.some(g => g.value > 0) ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={gradeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                 {gradeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.name as keyof typeof GRADE_COLORS] || '#cccccc'} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500 text-center py-8">{t('no_grades_yet')}</p>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                    <Card>
                        <h3 className="font-bold text-gray-800 mb-2">{t('activity_by_teacher')}</h3>
                        {teachers.length > 0 ? (
                            <ul className="space-y-2">
                                {teachers.map(teacher => {
                                    const teacherHomework = homework.filter(h => h.teacherId === teacher.id).length;
                                    const teacherAnnouncements = announcements.filter(a => a.teacherId === teacher.id).length;
                                    const teacherGrades = grades.filter(g => g.teacherId === teacher.id).length;
                                    return (
                                        <li key={teacher.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                                            <strong>{teacher.name}</strong> ({teacher.subject})
                                            <div className="mt-1 text-xs text-gray-500">
                                                • {teacherHomework} {t('homework_assigned')}
                                                • {teacherAnnouncements} {t('announcements')}
                                                • {teacherGrades} {t('grades_assigned')}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center py-4">{t('no_teachers_yet')}</p>
                        )}
                    </Card>
                </div>
            </div>

            <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('recent_activity')}</h2>
                <ul className="space-y-3">
                    {recentActivity.map(item => {
                        const teacherUser = users.find(u => u.id === item.teacherId);
                        return (
                            <li key={`${item.id}-${item.type}`} className="flex items-center space-x-3 rtl:space-x-reverse p-2 bg-gray-50 rounded-lg">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'announcement' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                                    {item.type === 'announcement' ? (
                                        <i className="fas fa-bullhorn text-yellow-600 text-lg"></i>
                                    ) : (
                                        <i className="fas fa-book text-green-600 text-lg"></i>
                                    )}
                                </div>
                                <div className="flex-1 text-sm">
                                    <p className="text-gray-800">
                                        <span className="font-bold">{teacherUser?.name}</span> {item.type === 'announcement' ? t('posted_announcement') : t('posted_homework')}: <span className="italic">"{item.title}"</span>
                                    </p>
                                    <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </Card>
        </div>
    );
};

const StudentsTab: React.FC<TabProps> = ({ selectedClassId }) => {
    const { t, users, students: allStudents, classes, setUsers, setStudents } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDeleteStudent = async (studentId: string) => {
        try {
            await apiService.deleteUser(studentId);
            setUsers(users.filter(u => u.id !== studentId));
            setStudents(allStudents.filter(s => s.id !== studentId));
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    const parentMap = useMemo(() => {
        const map = new Map<string, string>();
        const parents = users.filter(u => u.role?.toLowerCase() === 'parent');
        console.log('Creating parent map from parents:', parents);
        parents.forEach(p => {
            console.log(`Parent ${p.name} has children:`, p.childrenIds);
            p.childrenIds?.forEach(childId => {
                map.set(childId, p.name);
                console.log(`Mapped child ${childId} to parent ${p.name}`);
            });
        });
        console.log('Final parent map:', Object.fromEntries(map));
        return map;
    }, [users]);
    
    const filteredStudents = useMemo(() => {
        const studentsInClass = selectedClassId === 'all' ? allStudents : allStudents.filter(s => s.classId === selectedClassId);
        if (!searchTerm) return studentsInClass;

        return studentsInClass.filter(student => {
            const parentName = parentMap.get(student.id) || '';
            return student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   parentName.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [searchTerm, parentMap, selectedClassId, allStudents]);
    
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    return (
        <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('students')}</h2>
            <input 
                type="text"
                placeholder={t('search_students')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
            />
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th className="p-3">Avatar</th>
                            <th className="p-3">{t('student_name')}</th>
                            <th className="p-3">{t('class')}</th>
                            <th className="p-3">{t('parent')}</th>
                            <th className="p-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => (
                             <tr key={student.id} className="bg-white border-b">
                                <td className="p-2">
                                    <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                                </td>
                                <td className="p-3 font-medium text-gray-900">{student.name}</td>
                                <td className="p-3">{classMap.get(student.classId) || student.classId}</td>
                                <td className="p-3">{parentMap.get(student.id) || 'N/A'}</td>
                                <td className="p-3">
                                    <button
                                        onClick={() => handleDeleteStudent(student.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                        title={t('delete')}
                                    >
                                        <i className="fas fa-trash text-lg"></i>
                                    </button>
                                </td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const TeachersTab: React.FC<TabProps> = ({ selectedClassId }) => {
    const { t, users, classes, setUsers, setTeachers } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDeleteTeacher = async (teacherId: string) => {
        try {
            await apiService.deleteUser(teacherId);
            setUsers(users.filter(u => u.id !== teacherId));
            setTeachers(currentTeachers => currentTeachers.filter(t => t.id !== teacherId));
        } catch (error) {
            console.error('Error deleting teacher:', error);
        }
    };

    const teacherUsers = useMemo(() => users.filter(u => u.role?.toLowerCase() === 'teacher'), [users]);

    const filteredTeachers = useMemo(() => {
        const teachersInScope = selectedClassId === 'all' 
            ? teacherUsers
            : teacherUsers.filter(t => t.classIds?.includes(selectedClassId));
        
        if (!searchTerm) return teachersInScope;

        return teachersInScope.filter(teacher =>
            teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, selectedClassId, teacherUsers]);

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    return (
        <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('teachers')}</h2>
            <input 
                type="text"
                placeholder={t('search_teachers')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
            />
            <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th className="p-3">Avatar</th>
                            <th className="p-3">{t('teacher_of')}</th>
                            <th className="p-3">{t('classes')}</th>
                            <th className="p-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.map(teacher => (
                             <tr key={teacher.id} className="bg-white border-b">
                                <td className="p-2">
                                    <ProfileImage name={teacher.name} avatarUrl={teacher.avatar} className="w-10 h-10" textClassName="text-base" />
                                </td>
                                <td className="p-3 font-medium text-gray-900">{teacher.name}</td>
                                <td className="p-3 text-xs">{(teacher.classIds || []).map(cid => classMap.get(cid) || cid).join(', ')}</td>
                                <td className="p-3">
                                    <button
                                        onClick={() => handleDeleteTeacher(teacher.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                        title={t('delete')}
                                    >
                                        <i className="fas fa-trash text-lg"></i>
                                    </button>
                                </td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const ManagementTab: React.FC<{ setSuccessMessage: (msg: string) => void }> = ({ setSuccessMessage }) => {
    const { t, classes, setClasses, users, setUsers, students, setStudents, teachers, setTeachers, subjects, setSubjects } = useContext(AppContext);
    
    // Form states
    const [newClassName, setNewClassName] = useState('');
    const [newStudentName, setNewStudentName] = useState('');
    const [selectedClassForStudent, setSelectedClassForStudent] = useState<string>('');
    const [selectedParentForStudent, setSelectedParentForStudent] = useState<string>('');
    const [newTeacherName, setNewTeacherName] = useState('');
    const [newTeacherSubject, setNewTeacherSubject] = useState(subjects[0]?.id || '');
    const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newParentName, setNewParentName] = useState('');
    
    // Codes states
    const [codes, setCodes] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>('all');

    // Initialize form selections when data is available
    useEffect(() => {
        if (classes.length > 0 && !selectedClassForStudent) {
            setSelectedClassForStudent(classes[0].id);
        }
    }, [classes, selectedClassForStudent]);

    useEffect(() => {
        const parentUsers = users.filter(u => u.role?.toLowerCase() === 'parent');
        console.log('ManagementTab - Available parents:', parentUsers);
        console.log('ManagementTab - Selected parent:', selectedParentForStudent);
        console.log('ManagementTab - All users:', users.filter(u => u.role?.toLowerCase() === 'parent'));
        if (parentUsers.length > 0 && !selectedParentForStudent) {
            setSelectedParentForStudent(parentUsers[0].id);
            console.log('Auto-selected first parent:', parentUsers[0].id);
        }
    }, [users]); // Depend on users instead of selectedParentForStudent

    useEffect(() => {
        if (!newTeacherSubject && subjects.length > 0) {
            setNewTeacherSubject(subjects[0].id);
        }
    }, [subjects, newTeacherSubject]);

    const parentUsers = useMemo(() => {
        console.log('=== PARENT DEBUG ===');
        console.log('All users:', users);
        console.log('User roles:', users.map(u => ({ id: u.id, name: u.name, role: u.role })));
        
        // Try different role matching approaches
        // Use case-insensitive matching
        const parents = users.filter(u => u.role?.toLowerCase() === 'parent');
        
        console.log('Available parents:', parents);
        console.log('Parent IDs:', parents.map(p => p.id));
        console.log('Parent names:', parents.map(p => p.name));
        return parents;
    }, [users]);
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const fetchCodes = async (role?: string) => {
        setLoading(true);
        try {
            const userCodes = await apiService.getUserCodes(role === 'all' ? undefined : role);
            setCodes(userCodes);
        } catch (error) {
            console.error('Error fetching codes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes(selectedRole);
    }, [selectedRole]);

    const handleRoleChange = (role: string) => {
        setSelectedRole(role);
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        try {
            await apiService.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            // Also update local codes state to reflect deletion
            setCodes(codes.filter(c => c.id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    const handleAddParent = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newParentName.trim()) return;
        
        try {
            const result = await apiService.createUser({
                name: newParentName.trim(),
                role: 'parent',
                avatar: ''
            });
            
            // Add the new parent to the users list
            const newParent = { ...result.user, childrenIds: [] };
            setUsers(prevUsers => [...prevUsers, newParent]);
            
            // If this is the first parent, select it automatically
            if (parentUsers.length === 0) {
                setSelectedParentForStudent(result.user.id);
            }
            
            setNewParentName('');
            setSuccessMessage(t('parent_added_with_code').replace('{code}', `<b>${result.code}</b>`));
        } catch (error) {
            console.error('Error creating parent:', error);
            setSuccessMessage('Error creating parent. Please try again.');
        }
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newSubjectName.trim()) return;
        
        try {
            console.log('Creating subject:', newSubjectName.trim());
            const response = await apiService.createSubject(newSubjectName.trim());
            console.log('API response:', response);
            
            if (response && response.id) {
                console.log('Created subject:', response);
                setSubjects([...subjects, response]);
                setNewSubjectName('');
                setSuccessMessage(t('subject_added'));
            } else {
                console.error('Invalid subject response:', response);
                setSuccessMessage('Error: Invalid response from server');
            }
        } catch (error) {
            console.error('Error creating subject:', error);
            setSuccessMessage('Error creating subject. Please try again.');
        }
    };

    const handleDeleteSubject = async (subjectId: string) => {
        try {
            await apiService.deleteSubject(subjectId);
            setSubjects(subjects.filter(s => s.id !== subjectId));
            setSuccessMessage('Subject deleted successfully');
        } catch (error) {
            console.error('Error deleting subject:', error);
            setSuccessMessage('Error deleting subject. Please try again.');
        }
    };

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newClassName.trim()) return;
        
        try {
            console.log('Creating class:', newClassName.trim());
            const newClass = await apiService.createClass(newClassName.trim());
            console.log('Created class:', newClass);
            
            setClasses([...classes, newClass]);
            setNewClassName('');
            setSuccessMessage(t('class_added'));
        } catch (error) {
            console.error('Error creating class:', error);
            setSuccessMessage('Error creating class. Please try again.');
        }
    };

    const handleDeleteClass = async (classId: string) => {
        try {
            await apiService.deleteClass(classId);
            setClasses(classes.filter(c => c.id !== classId));
            setSuccessMessage('Class deleted successfully');
        } catch (error) {
            console.error('Error deleting class:', error);
            setSuccessMessage('Error deleting class. Please try again.');
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('=== STUDENT CREATION DEBUG ===');
        console.log('Student name:', newStudentName);
        console.log('Selected class:', selectedClassForStudent);
        console.log('Selected parent:', selectedParentForStudent);
        console.log('Available parents:', parentUsers);
        
        // Validate required fields
        if (!newStudentName.trim()) {
            setSuccessMessage('Please enter a student name.');
            return;
        }
        
        if (!selectedClassForStudent) {
            setSuccessMessage('Please select a class for the student.');
            return;
        }
        
        if (!selectedParentForStudent) {
            setSuccessMessage('Please select a parent for the student.');
            return;
        }

        try {
            console.log('Calling API to create student...');
            const result = await apiService.createUser({
                name: newStudentName.trim(),
                role: 'student',
                classId: selectedClassForStudent,
                parentId: selectedParentForStudent,
                avatar: getRandomAvatar()
            });

            console.log('API response:', result);

            const newStudent: Student = {
                id: result.user.id,
                name: result.user.name,
                grade: 1, // Or get from form
                classId: selectedClassForStudent,
                parentId: selectedParentForStudent,
                avatar: result.user.avatar || ''
            };

            console.log('New student object:', newStudent);

            setStudents(prevStudents => {
                console.log('Previous students:', prevStudents);
                const updated = [...prevStudents, newStudent];
                console.log('Updated students:', updated);
                return updated;
            });
            
            setUsers(prevUsers => {
                console.log('Previous users:', prevUsers);
                const updated = prevUsers.map(u => 
                    u.id === selectedParentForStudent 
                        ? { ...u, childrenIds: [...(u.childrenIds || []), result.user.id] } 
                        : u
                );
                console.log('Updated users with parent link:', updated);
                return [...updated, result.user];
            });

            setNewStudentName('');
            setSelectedParentForStudent(''); // Reset selection
            setSuccessMessage(t('student_added_with_code').replace('{code}', `<b>${result.code}</b>`));
        } catch (error) {
            console.error('Error creating student:', error);
            setSuccessMessage('Error creating student. Please try again.');
        }
    };
    
    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newTeacherName.trim() || !newTeacherSubject) return;

        try {
            const subjectName = subjectMap.get(newTeacherSubject) || '';
            const result = await apiService.createUser({
                name: newTeacherName.trim(),
                role: 'teacher',
                avatar: '',
                subject: subjectName,
                classIds: assignedClassIds
            });

            const newTeacherData: Teacher = { 
                id: result.user.id, 
                name: newTeacherName.trim(), 
                subject: subjectName
            };
            setTeachers(prev => [...prev, newTeacherData]);
            setUsers(prev => [...prev, result.user]);

            setNewTeacherName('');
            setNewTeacherSubject(subjects[0]?.id || '');
            setAssignedClassIds([]);
            setSuccessMessage(t('teacher_added_with_code').replace('{code}', `<b>${result.code}</b>`));
        } catch (error) {
            console.error('Error creating teacher:', error);
            setSuccessMessage('Error creating teacher. Please try again.');
        }
    };

    const handleToggleAssignClass = (classId: string) => {
        setAssignedClassIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
    };
    
    return (
        <div className="space-y-6">
             <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('add_parent')}</h2>
                <form onSubmit={handleAddParent} className="flex gap-2">
                    <input type="text" placeholder={t('parent_name')} value={newParentName} onChange={e => setNewParentName(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-lg" required />
                    <button type="submit" className="bg-cyan-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-700 transition">{t('add_parent')}</button>
                </form>
            </Card>

            <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('add_subject')}</h2>
                <form onSubmit={handleAddSubject} className="flex gap-2">
                    <input type="text" placeholder={t('subject_name')} value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-lg" required />
                    <button type="submit" className="bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 transition">{t('add_subject')}</button>
                </form>
                
                {/* Subjects List */}
                <div className="mt-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Current Subjects</h3>
                    <div className="space-y-2">
                        {subjects.map(subject => (
                            <div key={subject.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="text-gray-800">{subject.name}</span>
                                <button
                                    onClick={() => handleDeleteSubject(subject.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title="Delete subject"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('add_class')}</h2>
                <form onSubmit={handleAddClass} className="flex gap-2">
                    <input type="text" placeholder={t('class_name')} value={newClassName} onChange={e => setNewClassName(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-lg" required />
                    <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">{t('add_class')}</button>
                </form>
                
                {/* Classes List */}
                <div className="mt-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Current Classes</h3>
                    <div className="space-y-2">
                        {classes.map(classItem => (
                            <div key={classItem.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="text-gray-800">{classItem.name}</span>
                                <button
                                    onClick={() => handleDeleteClass(classItem.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title="Delete class"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('add_student')}</h2>
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('student_name_label')}</label>
                        <input type="text" placeholder={t('student_name_label')} value={newStudentName} onChange={e => setNewStudentName(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">{t('class')}</label>
                        <select value={selectedClassForStudent} onChange={e => setSelectedClassForStudent(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">{t('link_to_parent')}</label>
                        <select value={selectedParentForStudent} onChange={e => setSelectedParentForStudent(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required>
                            <option value="">{t('select_parent')}</option>
                            {parentUsers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {parentUsers.length === 0 && (
                            <p className="text-sm text-red-600 mt-1">{t('no_parents_available')}</p>
                        )}
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">{t('add_student')}</button>
                </form>
            </Card>

            <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('add_teacher')}</h2>
                <form onSubmit={handleAddTeacher} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('teacher_name_label')}</label>
                        <input type="text" placeholder={t('teacher_name_label')} value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">{t('subject')}</label>
                        <select value={newTeacherSubject} onChange={e => setNewTeacherSubject(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required >
                           {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('assign_to_classes')}</label>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border p-2 rounded-lg">
                            {classes.map(c => (
                                <div key={c.id} className="flex items-center">
                                    <input type="checkbox" id={`class-check-${c.id}`} checked={assignedClassIds.includes(c.id)} onChange={() => handleToggleAssignClass(c.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    <label htmlFor={`class-check-${c.id}`} className="ml-3 text-sm text-gray-700">{c.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition">{t('add_teacher')}</button>
                </form>
            </Card>

            <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">{t('user_codes')}</h2>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('filter_by_role')}</label>
                    <select
                        value={selectedRole}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">{t('all_roles')}</option>
                        <option value="parent">{t('parents')}</option>
                        <option value="teacher">{t('teachers')}</option>
                        <option value="student">{t('students')}</option>
                    </select>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">{t('loading')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th className="p-3">{t('name')}</th>
                                    <th className="p-3">{t('role')}</th>
                                    <th className="p-3">{t('code')}</th>
                                    <th className="p-3">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {codes.map(user => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-900">{user.name}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                user.role === 'parent' ? 'bg-blue-100 text-blue-800' :
                                                user.role === 'teacher' ? 'bg-green-100 text-green-800' :
                                                user.role === 'student' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {t(user.role)}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono text-lg font-bold text-blue-600">{user.id}</td>
                                        <td className="p-3 space-x-4 flex items-center">
                                            <button
                                                onClick={() => copyToClipboard(user.id)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                                title={t('copy')}
                                            >
                                                <i className="fas fa-copy text-lg"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.name)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                title={t('delete')}
                                            >
                                                <i className="fas fa-trash text-lg"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};



export default AdminDashboard;
