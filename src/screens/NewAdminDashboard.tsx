import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../contexts/AppContext';
import Header from '../components/ui/Header';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Teacher, UserRole, Subject, User, Student } from '../types';
import ProfileImage from '../components/ui/ProfileImage';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import apiService from '../services/apiService';
import { allAvatars } from '../data/avatars';

type AdminSection = 'dashboard' | 'analytics' | 'users' | 'academic' | 'system' | 'reports';
type UserManagementTab = 'students' | 'teachers' | 'parents';
type AcademicTab = 'classes' | 'subjects';

const AdminDashboard: React.FC = () => {
    const { classes: classList, users, students, teachers, subjects, grades, homework, announcements, attendance, messages, user, logout } = useContext(AppContext);
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const sections = [
        { id: 'dashboard', label: t('dashboard'), icon: 'fa-tachometer-alt', color: 'blue' },
        { id: 'analytics', label: t('analytics'), icon: 'fa-chart-bar', color: 'purple' },
        { id: 'users', label: t('user_management'), icon: 'fa-users', color: 'green' },
        { id: 'academic', label: t('academic'), icon: 'fa-graduation-cap', color: 'orange' },
        { id: 'system', label: t('system'), icon: 'fa-cogs', color: 'red' },
        { id: 'reports', label: t('reports'), icon: 'fa-file-alt', color: 'teal' }
    ] as const;

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return <DashboardOverview selectedClassId={selectedClassId} />;
            case 'analytics':
                return <AnalyticsSection selectedClassId={selectedClassId} />;
            case 'users':
                return <UserManagementSection setSuccessMessage={setSuccessMessage} />;
            case 'academic':
                return <AcademicManagement selectedClassId={selectedClassId} setSuccessMessage={setSuccessMessage} />;
            case 'system':
                return <SystemSettings setSuccessMessage={setSuccessMessage} />;
            case 'reports':
                return <ReportsSection selectedClassId={selectedClassId} />;
            default:
                return <DashboardOverview selectedClassId={selectedClassId} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} onLogout={logout} />
            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 m-4 rounded-lg shadow">
                    <p className="font-semibold">{successMessage}</p>
                </div>
            )}
            
            <div className="flex flex-col lg:flex-row">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 bg-white shadow-lg">
                    <div className="p-4">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">{t('admin_panel')}</h2>
                        <nav className="space-y-2">
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                        activeSection === section.id
                                            ? `bg-${section.color}-100 text-${section.color}-700 border-l-4 border-${section.color}-500`
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <i className={`fas ${section.icon}`}></i>
                                    <span className="font-medium">{section.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-4 lg:p-6">
                    {/* Class Filter */}
                    {(activeSection === 'dashboard' || activeSection === 'analytics' || activeSection === 'reports') && (
                        <Card className="mb-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h3 className="text-lg font-semibold text-gray-800">{t('filter_by_class')}</h3>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">{t('all_classes')}</option>
                                    {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </Card>
                    )}

                    {/* Render Section Content */}
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// Dashboard Overview Section
const DashboardOverview: React.FC<{ selectedClassId: string }> = ({ selectedClassId }) => {
    const { users, students, grades, homework, announcements, teachers, attendance } = useContext(AppContext);
    const { t } = useTranslation();

    const filteredStudents = useMemo(() => 
        selectedClassId === 'all' ? students : students.filter(s => s.classId === selectedClassId),
        [selectedClassId, students]
    );

    const stats = useMemo(() => {
        const totalTeachers = users.filter(u => u.role?.toLowerCase() === 'teacher').length;
        const totalParents = users.filter(u => u.role?.toLowerCase() === 'parent').length;
        const avgGrade = grades.length > 0 ? 
            (grades.reduce((sum, g) => sum + (g.marksObtained / g.maxMarks * 100), 0) / grades.length).toFixed(1) : 0;
        const attendanceRate = attendance.length > 0 ?
            (attendance.filter(a => a.status?.toLowerCase() === 'present').length / attendance.length * 100).toFixed(1) : 0;

        return {
            totalStudents: filteredStudents.length,
            totalTeachers,
            totalParents,
            totalHomework: homework.length,
            totalAnnouncements: announcements.length,
            avgGrade: parseFloat(avgGrade as string),
            attendanceRate: parseFloat(attendanceRate as string)
        };
    }, [filteredStudents, users, grades, homework, announcements, attendance]);

    const recentActivity = useMemo(() => {
        const activities = [
            ...homework.map(h => ({ ...h, type: 'homework', date: h.assignedDate, title: h.title })),
            ...announcements.map(a => ({ ...a, type: 'announcement', date: a.date, title: a.title }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
        
        return activities;
    }, [homework, announcements]);

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('students')} value={stats.totalStudents} icon="fa-user-graduate" color="blue" />
                <StatCard title={t('teachers')} value={stats.totalTeachers} icon="fa-chalkboard-teacher" color="green" />
                <StatCard title={t('parents')} value={stats.totalParents} icon="fa-users" color="purple" />
                <StatCard title={t('homework')} value={stats.totalHomework} icon="fa-book" color="orange" />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('performance_overview')}</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">{t('average_grade')}</span>
                            <span className="text-xl font-bold text-blue-600">{stats.avgGrade}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">{t('attendance_rate')}</span>
                            <span className="text-xl font-bold text-green-600">{stats.attendanceRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">{t('active_homework')}</span>
                            <span className="text-xl font-bold text-orange-600">{stats.totalHomework}</span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                                <div className={`p-2 rounded-full ${
                                    activity.type === 'homework' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                                }`}>
                                    <i className={`fas ${activity.type === 'homework' ? 'fa-book' : 'fa-bullhorn'} text-sm`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 truncate">{activity.title}</p>
                                    <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Analytics Section
const AnalyticsSection: React.FC<{ selectedClassId: string }> = ({ selectedClassId }) => {
    const { grades, attendance, students, homework } = useContext(AppContext);
    const { t } = useTranslation();

    const gradeDistribution = useMemo(() => {
        const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        grades.forEach(grade => {
            const percentage = (grade.marksObtained / grade.maxMarks) * 100;
            const letter = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
            distribution[letter]++;
        });
        return Object.entries(distribution).map(([grade, count]) => ({ name: grade, value: count }));
    }, [grades]);

    const attendanceTrend = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().slice(0, 10);
        });

        return last7Days.map(date => {
            const dayAttendance = attendance.filter(a => a.date === date);
            const presentCount = dayAttendance.filter(a => a.status?.toLowerCase() === 'present').length;
            const total = dayAttendance.length;
            const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
            
            return {
                date: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
                rate
            };
        });
    }, [attendance]);

    const COLORS = ['#22c55e', '#84cc16', '#facc15', '#fb923c', '#ef4444'];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('analytics_dashboard')}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution */}
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('grade_distribution_chart')}</h3>
                    {gradeDistribution.some(g => g.value > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={gradeDistribution} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={80} 
                                    label
                                >
                                    {gradeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 py-8">{t('no_grade_data_available')}</div>
                    )}
                </Card>

                {/* Attendance Trend */}
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('attendance_trend_chart')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={attendanceTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                            <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};

// User Management Section
const UserManagementSection: React.FC<{ setSuccessMessage: (msg: string) => void }> = ({ setSuccessMessage }) => {
    const [activeTab, setActiveTab] = useState<UserManagementTab>('students');
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'students', label: 'Students', icon: 'fa-user-graduate' },
        { id: 'teachers', label: 'Teachers', icon: 'fa-chalkboard-teacher' },
        { id: 'parents', label: 'Parents', icon: 'fa-users' }
    ] as const;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Tab Navigation */}
            <div className="bg-gray-100 rounded-lg p-1">
                <nav className="flex space-x-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                activeTab === tab.id 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-600 hover:text-blue-600'
                            }`}
                        >
                            <i className={`fas ${tab.icon}`}></i>
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'students' && <StudentsManagement searchTerm={searchTerm} setSuccessMessage={setSuccessMessage} />}
            {activeTab === 'teachers' && <TeachersManagement searchTerm={searchTerm} setSuccessMessage={setSuccessMessage} />}
            {activeTab === 'parents' && <ParentsManagement searchTerm={searchTerm} setSuccessMessage={setSuccessMessage} />}
        </div>
    );
};

// Academic Management Section
const AcademicManagement: React.FC<{ selectedClassId: string, setSuccessMessage: (msg: string) => void }> = ({ selectedClassId, setSuccessMessage }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<AcademicTab>('classes');

    const tabs = [
        { id: 'classes', label: 'Classes', icon: 'fa-school' },
        { id: 'subjects', label: 'Subjects', icon: 'fa-book' }
    ] as const;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('academic_management')}</h2>

            {/* Tab Navigation */}
            <div className="bg-gray-100 rounded-lg p-1">
                <nav className="flex flex-wrap gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                activeTab === tab.id 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-600 hover:text-blue-600'
                            }`}
                        >
                            <i className={`fas ${tab.icon}`}></i>
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'classes' && <ClassManagement setSuccessMessage={setSuccessMessage} />}
            {activeTab === 'subjects' && <SubjectManagement setSuccessMessage={setSuccessMessage} />}
        </div>
    );
};


// System Settings
const SystemSettings: React.FC<{ setSuccessMessage: (msg: string) => void }> = ({ setSuccessMessage }) => {
    const { t } = useTranslation();
    const [isBackupLoading, setIsBackupLoading] = useState(false);

    const handleBackup = async () => {
        setIsBackupLoading(true);
        try {
            console.log('Creating backup...');
            const backupBlob = await apiService.createBackup();
            
            // Create download link
            const url = window.URL.createObjectURL(backupBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `edcon-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            setSuccessMessage(t('backup_downloaded_success'));
        } catch (error) {
            console.error('Backup error:', error);
            setSuccessMessage(t('backup_failed'));
        } finally {
            setIsBackupLoading(false);
        }
    };


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('system_settings')}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Data Management</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-800 mb-2">{t('backup_recovery')}</h4>
                            <p className="text-gray-600 mb-3 text-sm">Create a backup of all system data including users, grades, and messages.</p>
                            <button
                                onClick={handleBackup}
                                disabled={isBackupLoading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center space-x-2"
                            >
                                {isBackupLoading ? (
                                    <>
                                        <LoadingSpinner />
                                        <span>Creating Backup...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-download"></i>
                                        <span>{t('create_backup')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                        
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">System Information</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Version:</span>
                            <span className="font-medium">v1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Last Backup:</span>
                            <span className="font-medium">Never</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Database:</span>
                            <span className="font-medium text-green-600">Connected</span>
                        </div>
                    </div>
                </Card>
            </div>

        </div>
    );
};

// Reports Section
const ReportsSection: React.FC<{ selectedClassId: string }> = ({ selectedClassId }) => {
    const { users, messages, announcements, classes: classList, subjects } = useContext(AppContext);
    const { t } = useTranslation();
    const [reportType, setReportType] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = async (type: string) => {
        setIsGenerating(true);
        setReportType(type);
        
        try {
            let reportData;
            let fileName;
            
            switch (type) {
                case 'users':
                    reportData = {
                        title: 'User Activity Report',
                        generated: new Date().toISOString(),
                        data: {
                            totalUsers: users.length,
                            usersByRole: {
                                students: users.filter(u => u.role?.toLowerCase() === 'student').length,
                                teachers: users.filter(u => u.role?.toLowerCase() === 'teacher').length,
                                parents: users.filter(u => u.role?.toLowerCase() === 'parent').length,
                                admins: users.filter(u => u.role?.toLowerCase() === 'admin').length
                            },
                            usersList: users.map(u => ({
                                id: u.id,
                                name: u.name,
                                role: u.role
                            }))
                        }
                    };
                    fileName = `user-activity-report-${new Date().toISOString().split('T')[0]}.json`;
                    break;
                    
                case 'system':
                    reportData = {
                        title: 'System Usage Report',
                        generated: new Date().toISOString(),
                        data: {
                            totalClasses: classList.length,
                            totalSubjects: subjects.length,
                            totalAnnouncements: announcements.length,
                            systemHealth: 'Good',
                            classesList: classList,
                            subjectsList: subjects
                        }
                    };
                    fileName = `system-usage-report-${new Date().toISOString().split('T')[0]}.json`;
                    break;
                    
                case 'communication':
                    const today = new Date().toDateString();
                    const todayMessages = messages.filter(m => 
                        new Date(m.timestamp).toDateString() === today
                    );
                    reportData = {
                        title: 'Communication Summary',
                        generated: new Date().toISOString(),
                        data: {
                            totalMessages: messages.length,
                            messagesToday: todayMessages.length,
                            totalAnnouncements: announcements.length,
                            messagingActivity: {
                                byDay: {} // Could be expanded
                            }
                        }
                    };
                    fileName = `communication-summary-${new Date().toISOString().split('T')[0]}.json`;
                    break;
                    
                default:
                    throw new Error('Unknown report type');
            }
            
            // Create and download file
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Report generation error:', error);
        } finally {
            setIsGenerating(false);
            setReportType('');
        }
    };

    const todayMessages = messages.filter(m => 
        new Date(m.timestamp).toDateString() === new Date().toDateString()
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('reports_analytics')}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('generate_reports')}</h3>
                    <div className="space-y-3">
                        <button 
                            onClick={() => generateReport('users')}
                            disabled={isGenerating}
                            className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition disabled:opacity-50">
                            <i className="fas fa-users text-blue-600 mr-3"></i>
                            {t('user_activity_report')}
                            {isGenerating && reportType === 'users' && <LoadingSpinner />}
                        </button>
                        <button 
                            onClick={() => generateReport('system')}
                            disabled={isGenerating}
                            className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition disabled:opacity-50">
                            <i className="fas fa-chart-line text-green-600 mr-3"></i>
                            {t('system_usage_report')}
                            {isGenerating && reportType === 'system' && <LoadingSpinner />}
                        </button>
                        <button 
                            onClick={() => generateReport('communication')}
                            disabled={isGenerating}
                            className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition disabled:opacity-50">
                            <i className="fas fa-comments text-orange-600 mr-3"></i>
                            {t('communication_summary')}
                            {isGenerating && reportType === 'communication' && <LoadingSpinner />}
                        </button>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('live_stats')}</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Users</span>
                            <span className="text-xl font-bold text-blue-600">{users.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Classes</span>
                            <span className="text-xl font-bold text-green-600">{classList.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Messages Today</span>
                            <span className="text-xl font-bold text-purple-600">{todayMessages.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Announcements</span>
                            <span className="text-xl font-bold text-orange-600">{announcements.length}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Reusable Components
const StatCard: React.FC<{ title: string; value: number; icon: string; color: string }> = ({ title, value, icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-500 text-blue-600',
        green: 'bg-green-500 text-green-600',
        purple: 'bg-purple-500 text-purple-600',
        orange: 'bg-orange-500 text-orange-600',
        red: 'bg-red-500 text-red-600',
        teal: 'bg-teal-500 text-teal-600'
    };

    return (
        <Card className="relative overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    <p className="text-gray-600 font-medium">{title}</p>
                </div>
                <div className={`p-3 rounded-full bg-opacity-10 ${colorClasses[color] || colorClasses.blue}`}>
                    <i className={`fas ${icon} text-xl`}></i>
                </div>
            </div>
        </Card>
    );
};

// Placeholder components for detailed management sections
const StudentsManagement: React.FC<{ searchTerm: string; setSuccessMessage: (msg: string) => void }> = ({ searchTerm, setSuccessMessage }) => {
    const { students, users, classes, subjects, setUsers, setStudents } = useContext(AppContext);
    const { t } = useTranslation();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newStudent, setNewStudent] = useState({
        name: '',
        classId: '',
        parentId: ''
    });
    const [editingStudent, setEditingStudent] = useState<any | null>(null);
    const [parentSearch, setParentSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, student: any | null}>({isOpen: false, student: null});
    const [isDeleting, setIsDeleting] = useState(false);

    // Refresh data function to ensure parent-child relationships are up to date
    const refreshData = async () => {
        try {
            const [allUsers] = await Promise.all([
                apiService.getAllUsers()
            ]);
            
            // Update users with fresh data
            setUsers(allUsers);
            
            // Update students list with fresh data
            const updatedStudents = allUsers.filter(u => u.role?.toLowerCase() === 'student').map(u => ({
                ...u,
                grade: 1,
                classId: (u as any).classId || '',
                parentId: (u as any).parentId || '',
                avatar: u.avatar || ''
            }));
            setStudents(updatedStudents as Student[]);
            
            console.log('=== DATA REFRESHED ===');
            console.log('Students with parentId:', updatedStudents.filter(s => s.parentId).length);
            console.log('Parents with childrenIds:', allUsers.filter(u => u.role?.toLowerCase() === 'parent' && (u as any).childrenIds && (u as any).childrenIds.length > 0).length);
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    // Refresh data when component mounts
    useEffect(() => {
        refreshData();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(student => 
            student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const parentUsers = useMemo(() => {
        return users.filter(u => u.role?.toLowerCase() === 'parent');
    }, [users]);

    const filteredParents = useMemo(() => {
        return parentUsers.filter(parent => 
            parent.name.toLowerCase().includes(parentSearch.toLowerCase())
        );
    }, [parentUsers, parentSearch]);

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudent.name.trim() || !newStudent.classId) return;

        setIsLoading(true);
        try {
            // Get selected class subjects
            const selectedClass = classes.find(c => c.id === newStudent.classId);
            const classSubjects = (selectedClass as any)?.subjectIds || [];

            const studentData = {
                name: newStudent.name.trim(),
                role: 'student',
                classId: newStudent.classId,
                parentId: newStudent.parentId || undefined
            };

            const result = await apiService.createUser(studentData);
            
            // If parent is assigned, use the backend API to establish the relationship
            if (newStudent.parentId) {
                await apiService.assignStudentToParent(result.user.id, newStudent.parentId);
            }
            
            // Refresh data from backend to ensure consistency
            const [allUsers] = await Promise.all([
                apiService.getAllUsers()
            ]);
            
            // Update users with fresh data
            setUsers(allUsers);
            
            // Update students list with fresh data
            const updatedStudents = allUsers.filter(u => u.role?.toLowerCase() === 'student').map(u => ({
                ...u,
                grade: 1,
                classId: (u as any).classId || '',
                parentId: (u as any).parentId || '',
                avatar: u.avatar || ''
            }));
            setStudents(updatedStudents as Student[]);

            setSuccessMessage(`Student "${newStudent.name}" created successfully! Assigned to class "${selectedClass?.name}" with ${classSubjects.length} subjects.`);
            setNewStudent({ name: '', classId: '', parentId: '' });
            setParentSearch('');
            setShowAddModal(false);
        } catch (error) {
            console.error('Error creating student:', error);
            setSuccessMessage('Failed to create student. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const startEditStudent = (student: any) => {
        setEditingStudent(student);
        setNewStudent({
            name: student.name,
            classId: student.classId || '',
            parentId: student.parentId || ''
        });
        const parentUser = users.find(u => u.id === student.parentId);
        setParentSearch(parentUser?.name || '');
        setShowEditModal(true);
    };

    const handleEditStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudent.name.trim() || !newStudent.classId || !editingStudent) return;

        setIsLoading(true);
        try {
            const selectedClass = classes.find(c => c.id === newStudent.classId);
            const classSubjects = (selectedClass as any)?.subjectIds || [];

            const updatedStudentData = {
                name: newStudent.name.trim(),
                classId: newStudent.classId,
                parentId: newStudent.parentId || undefined
            };

            await apiService.updateUser(editingStudent.id, updatedStudentData);
            
            // If parent assignment changed, use backend API to update relationship
            if (newStudent.parentId !== editingStudent.parentId) {
                // Unassign from old parent if there was one
                if (editingStudent.parentId) {
                    await apiService.unassignStudentFromParent(editingStudent.id);
                }
                // Assign to new parent if there is one
                if (newStudent.parentId) {
                    await apiService.assignStudentToParent(editingStudent.id, newStudent.parentId);
                }
            }
            
            // Refresh data from backend to ensure consistency
            const [allUsers] = await Promise.all([
                apiService.getAllUsers()
            ]);
            
            // Update users with fresh data
            setUsers(allUsers);
            
            // Update students list with fresh data
            const updatedStudents = allUsers.filter(u => u.role?.toLowerCase() === 'student').map(u => ({
                ...u,
                grade: 1,
                classId: (u as any).classId || '',
                parentId: (u as any).parentId || '',
                avatar: u.avatar || ''
            }));
            setStudents(updatedStudents as Student[]);

            setSuccessMessage(`Student "${newStudent.name}" updated successfully! Assigned to class "${selectedClass?.name}" with ${classSubjects.length} subjects.`);
            setNewStudent({ name: '', classId: '', parentId: '' });
            setParentSearch('');
            setEditingStudent(null);
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating student:', error);
            setSuccessMessage('Failed to update student. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeleteStudent = (student: any) => {
        setDeleteConfirm({ isOpen: true, student });
    };

    const handleDeleteStudent = async () => {
        if (!deleteConfirm.student) return;

        setIsDeleting(true);
        try {
            await apiService.deleteUser(deleteConfirm.student.id);
            setStudents(students.filter(s => s.id !== deleteConfirm.student!.id));
            setUsers(users.filter(u => u.id !== deleteConfirm.student!.id));
            setSuccessMessage(`Student "${deleteConfirm.student.name}" deleted successfully!`);
            setDeleteConfirm({ isOpen: false, student: null });
        } catch (error) {
            console.error('Error deleting student:', error);
            setSuccessMessage('Failed to delete student. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Students ({filteredStudents.length})</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={refreshData}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center"
                            title="Refresh data to sync parent-child relationships"
                        >
                            <i className="fas fa-sync-alt mr-2"></i>Refresh
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                        >
                            <i className="fas fa-plus mr-2"></i>{t('add_new_student')}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map(student => {
                        const studentClass = classes.find(c => c.id === student.classId);
                        const parentUser = users.find(u => u.id === student.parentId);
                        
                        return (
                            <div key={student.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3 mb-3">
                                    <ProfileImage name={student.name} avatarUrl={student.avatar} className="w-12 h-12" />
                                    <div>
                                        <h4 className="font-bold text-gray-800">{student.name}</h4>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Class:</span> {studentClass?.name || 'Not assigned'}</p>
                                    <p><span className="font-medium">Parent:</span> {parentUser?.name || 'No parent assigned'}</p>
                                    {studentClass && (studentClass as any).subjectIds && (
                                        <div>
                                            <p className="font-medium">Subjects:</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(studentClass as any).subjectIds.slice(0, 3).map((subjectId: string) => {
                                                    const subject = subjects.find(s => s.id === subjectId);
                                                    return subject ? (
                                                        <span key={subjectId} className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                                            {subject.name}
                                                        </span>
                                                    ) : null;
                                                })}
                                                {(studentClass as any).subjectIds.length > 3 && (
                                                    <span className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                        +{(studentClass as any).subjectIds.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 flex justify-end space-x-2">
                                    <button 
                                        onClick={() => startEditStudent(student)}
                                        className="text-blue-600 hover:text-blue-800 transition"
                                        title="Edit student"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                        onClick={() => confirmDeleteStudent(student)}
                                        className="text-red-600 hover:text-red-800 transition"
                                        title="Delete student"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {filteredStudents.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-8">
                            <i className="fas fa-user-graduate text-4xl mb-4"></i>
                            <p>{t('no_students_found')}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Add Student Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Student">
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('student_name_label')}
                        </label>
                        <input
                            type="text"
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                            placeholder={t('enter_student_name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('assign_to_class_required')}
                        </label>
                        <select
                            value={newStudent.classId}
                            onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">{t('select_a_class')}</option>
                            {classes.map(classItem => (
                                <option key={classItem.id} value={classItem.id}>
                                    {classItem.name} 
                                    {(classItem as any).subjectIds && ` (${(classItem as any).subjectIds.length} subjects)`}
                                </option>
                            ))}
                        </select>
                        {newStudent.classId && (
                            <div className="mt-2 p-2 bg-green-50 rounded-lg">
                                <p className="text-xs text-green-700 font-medium">{t('auto_enrollment_preview')}</p>
                                <p className="text-xs text-green-600">{t('student_will_be_enrolled')}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {classes.find(c => c.id === newStudent.classId) && 
                                        ((classes.find(c => c.id === newStudent.classId) as any).subjectIds || []).map((subjectId: string) => {
                                            const subject = subjects.find(s => s.id === subjectId);
                                            return subject ? (
                                                <span key={subjectId} className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                                    {subject.name}
                                                </span>
                                            ) : null;
                                        })
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('assign_to_parent_optional')}
                        </label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={parentSearch}
                                onChange={(e) => setParentSearch(e.target.value)}
                                placeholder={t('search_parents')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {parentSearch && (
                                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                                    {filteredParents.map(parent => (
                                        <button
                                            key={parent.id}
                                            type="button"
                                            onClick={() => {
                                                setNewStudent({...newStudent, parentId: parent.id});
                                                setParentSearch(parent.name);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <ProfileImage name={parent.name} avatarUrl={parent.avatar} className="w-6 h-6" />
                                                <span className="text-sm">{parent.name} ({parent.id})</span>
                                            </div>
                                        </button>
                                    ))}
                                    {filteredParents.length === 0 && (
                                        <p className="text-gray-500 text-sm p-3">{t('no_parents_found')}</p>
                                    )}
                                </div>
                            )}
                            {newStudent.parentId && (
                                <p className="text-xs text-green-600">
                                    ✓ Selected: {parentUsers.find(p => p.id === newStudent.parentId)?.name}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newStudent.name.trim() || !newStudent.classId}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : t('add_new_student')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Student Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Student">
                <form onSubmit={handleEditStudent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('student_name_label')}
                        </label>
                        <input
                            type="text"
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                            placeholder={t('enter_student_name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('assign_to_class_required')}
                        </label>
                        <select
                            value={newStudent.classId}
                            onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">{t('select_a_class')}</option>
                            {classes.map(classItem => (
                                <option key={classItem.id} value={classItem.id}>
                                    {classItem.name} 
                                    {(classItem as any).subjectIds && ` (${(classItem as any).subjectIds.length} subjects)`}
                                </option>
                            ))}
                        </select>
                        {newStudent.classId && (
                            <div className="mt-2 p-2 bg-green-50 rounded-lg">
                                <p className="text-xs text-green-700 font-medium">{t('auto_enrollment_preview')}</p>
                                <p className="text-xs text-green-600">{t('student_will_be_enrolled')}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {classes.find(c => c.id === newStudent.classId) && 
                                        ((classes.find(c => c.id === newStudent.classId) as any).subjectIds || []).map((subjectId: string) => {
                                            const subject = subjects.find(s => s.id === subjectId);
                                            return subject ? (
                                                <span key={subjectId} className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                                    {subject.name}
                                                </span>
                                            ) : null;
                                        })
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('assign_to_parent_optional')}
                        </label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={parentSearch}
                                onChange={(e) => setParentSearch(e.target.value)}
                                placeholder={t('search_parents')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {parentSearch && (
                                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                                    {filteredParents.map(parent => (
                                        <button
                                            key={parent.id}
                                            type="button"
                                            onClick={() => {
                                                setNewStudent({...newStudent, parentId: parent.id});
                                                setParentSearch(parent.name);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <ProfileImage name={parent.name} avatarUrl={parent.avatar} className="w-6 h-6" />
                                                <span className="text-sm">{parent.name} ({parent.id})</span>
                                            </div>
                                        </button>
                                    ))}
                                    {filteredParents.length === 0 && (
                                        <p className="text-gray-500 text-sm p-3">{t('no_parents_found')}</p>
                                    )}
                                </div>
                            )}
                            {newStudent.parentId && (
                                <p className="text-xs text-green-600">
                                    ✓ Selected: {parentUsers.find(p => p.id === newStudent.parentId)?.name}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newStudent.name.trim() || !newStudent.classId}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : t('update_student')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, student: null })}
                onConfirm={handleDeleteStudent}
                title={t('delete_student')}
                message={t('are_you_sure_delete_student').replace('{{deleteConfirm.student?.name}}', deleteConfirm.student?.name || '')}
                confirmText={t('delete_student')}
                type="danger"
                isLoading={isDeleting}
            />
        </>
    );
};

const TeachersManagement: React.FC<{ searchTerm: string; setSuccessMessage: (msg: string) => void }> = ({ searchTerm, setSuccessMessage }) => {
    const { teachers, users, subjects, classes, setUsers, setTeachers } = useContext(AppContext);
    const { t } = useTranslation();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        name: '',
        subjectId: ''
    });
    const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, teacher: any | null}>({isOpen: false, teacher: null});
    const [isDeleting, setIsDeleting] = useState(false);

    const teacherUsers = useMemo(() => {
        return users.filter(u => u.role?.toLowerCase() === 'teacher')
            .filter(teacher => teacher.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [users, searchTerm]);

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeacher.name.trim() || !newTeacher.subjectId) return;

        setIsLoading(true);
        try {
            const selectedSubject = subjects.find(s => s.id === newTeacher.subjectId);
            
            // Find all classes that have this subject
            const classesWithSubject = classes.filter(classItem => 
                (classItem as any).subjectIds?.includes(newTeacher.subjectId)
            );

            const teacherData = {
                name: newTeacher.name.trim(),
                role: 'teacher',
                subject: selectedSubject?.name,
                classIds: classesWithSubject.map(c => c.id)
            };

            const result = await apiService.createUser(teacherData);
            
            // Update teachers list
            const newTeacherRecord = {
                id: result.user.id,
                name: result.user.name,
                subject: selectedSubject?.name || '',
                classIds: classesWithSubject.map(c => c.id)
            };
            setTeachers([...teachers, newTeacherRecord as any]);

            // Update users list
            setUsers([...users, result.user]);

            setSuccessMessage(`Teacher "${newTeacher.name}" created successfully! Assigned to ${selectedSubject?.name} and automatically assigned to ${classesWithSubject.length} classes.`);
            setNewTeacher({ name: '', subjectId: '' });
            setShowAddModal(false);
        } catch (error) {
            console.error('Error creating teacher:', error);
            setSuccessMessage('Failed to create teacher. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const startEditTeacher = (teacher: any) => {
        setEditingTeacher(teacher);
        setNewTeacher({
            name: teacher.name,
            subjectId: subjects.find(s => s.name === teacher.subject)?.id || ''
        });
        setShowEditModal(true);
    };

    const handleEditTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeacher.name.trim() || !newTeacher.subjectId || !editingTeacher) return;

        setIsLoading(true);
        try {
            const selectedSubject = subjects.find(s => s.id === newTeacher.subjectId);
            
            // Find all classes that have this subject
            const classesWithSubject = classes.filter(classItem => 
                (classItem as any).subjectIds?.includes(newTeacher.subjectId)
            );

            const updatedTeacherData = {
                name: newTeacher.name.trim(),
                subject: selectedSubject?.name,
                classIds: classesWithSubject.map(c => c.id)
            };

            await apiService.updateUser(editingTeacher.id, updatedTeacherData);
            
            // Update teachers list
            setTeachers(teachers.map(t => t.id === editingTeacher.id ? {
                ...t,
                name: newTeacher.name.trim(),
                subject: selectedSubject?.name || '',
                classIds: classesWithSubject.map(c => c.id)
            } : t));

            // Update users list
            setUsers(users.map(u => u.id === editingTeacher.id ? {
                ...u,
                name: newTeacher.name.trim(),
                subject: selectedSubject?.name,
                classIds: classesWithSubject.map(c => c.id)
            } : u));

            setSuccessMessage(`Teacher "${newTeacher.name}" updated successfully! Assigned to ${selectedSubject?.name} and ${classesWithSubject.length} classes.`);
            setNewTeacher({ name: '', subjectId: '' });
            setEditingTeacher(null);
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating teacher:', error);
            setSuccessMessage('Failed to update teacher. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeleteTeacher = (teacher: any) => {
        setDeleteConfirm({ isOpen: true, teacher });
    };

    const handleDeleteTeacher = async () => {
        if (!deleteConfirm.teacher) return;

        setIsDeleting(true);
        try {
            await apiService.deleteUser(deleteConfirm.teacher.id);
            setTeachers(teachers.filter(t => t.id !== deleteConfirm.teacher!.id));
            setUsers(users.filter(u => u.id !== deleteConfirm.teacher!.id));
            setSuccessMessage(`Teacher "${deleteConfirm.teacher.name}" deleted successfully!`);
            setDeleteConfirm({ isOpen: false, teacher: null });
        } catch (error) {
            console.error('Error deleting teacher:', error);
            setSuccessMessage('Failed to delete teacher. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Teachers ({teacherUsers.length})</h3>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i>{t('add_new_teacher')}
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {teacherUsers.map(teacher => {
                        const teacherClasses = classes.filter(c => teacher.classIds?.includes(c.id));
                        
                        return (
                            <div key={teacher.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3 mb-3">
                                    <ProfileImage name={teacher.name} avatarUrl={teacher.avatar} className="w-12 h-12" />
                                    <div>
                                        <h4 className="font-bold text-gray-800">{teacher.name}</h4>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <p className="font-medium">Classes ({teacherClasses.length}):</p>
                                        {teacherClasses.length > 0 ? (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {teacherClasses.map(classItem => (
                                                    <span key={classItem.id} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                                        {classItem.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-xs">No classes assigned</p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end space-x-2">
                                    <button 
                                        onClick={() => startEditTeacher(teacher)}
                                        className="text-blue-600 hover:text-blue-800 transition"
                                        title="Edit teacher"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                        onClick={() => confirmDeleteTeacher(teacher)}
                                        className="text-red-600 hover:text-red-800 transition"
                                        title="Delete teacher"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {teacherUsers.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-8">
                            <i className="fas fa-chalkboard-teacher text-4xl mb-4"></i>
                            <p>{t('no_teachers_found')}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Add Teacher Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Teacher">
                <form onSubmit={handleAddTeacher} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('teacher_name_label')}
                        </label>
                        <input
                            type="text"
                            value={newTeacher.name}
                            onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                            placeholder={t('enter_teacher_name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('assign_to_subject_required')}
                        </label>
                        <select
                            value={newTeacher.subjectId}
                            onChange={(e) => setNewTeacher({...newTeacher, subjectId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">{t('select_a_subject')}</option>
                            {subjects.map(subject => {
                                const classesWithSubject = classes.filter(c => 
                                    (c as any).subjectIds?.includes(subject.id)
                                );
                                return (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name} ({classesWithSubject.length} classes)
                                    </option>
                                );
                            })}
                        </select>
                        {newTeacher.subjectId && (
                            <div className="mt-2 p-2 bg-green-50 rounded-lg">
                                <p className="text-xs text-green-700 font-medium">{t('auto_assignment_preview')}</p>
                                <p className="text-xs text-green-600">
                                    {t('will_be_assigned_to_all_classes').replace('{{subjects.find(s => s.id === newTeacher.subjectId)?.name}}', subjects.find(s => s.id === newTeacher.subjectId)?.name || '')}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {classes.filter(c => (c as any).subjectIds?.includes(newTeacher.subjectId)).map(classItem => (
                                        <span key={classItem.id} className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                            {classItem.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newTeacher.name.trim() || !newTeacher.subjectId}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : t('add_new_teacher')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Teacher Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Teacher">
                <form onSubmit={handleEditTeacher} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teacher Name
                        </label>
                        <input
                            type="text"
                            value={newTeacher.name}
                            onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                            placeholder="Enter teacher name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign to Subject (Required)
                        </label>
                        <select
                            value={newTeacher.subjectId}
                            onChange={(e) => setNewTeacher({...newTeacher, subjectId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Select a subject</option>
                            {subjects.map(subject => {
                                const classesWithSubject = classes.filter(c => 
                                    (c as any).subjectIds?.includes(subject.id)
                                );
                                return (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name} ({classesWithSubject.length} classes)
                                    </option>
                                );
                            })}
                        </select>
                        {newTeacher.subjectId && (
                            <div className="mt-2 p-2 bg-green-50 rounded-lg">
                                <p className="text-xs text-green-700 font-medium">Auto-Assignment Preview:</p>
                                <p className="text-xs text-green-600">
                                    Will be assigned to all classes teaching {subjects.find(s => s.id === newTeacher.subjectId)?.name}:
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {classes.filter(c => (c as any).subjectIds?.includes(newTeacher.subjectId)).map(classItem => (
                                        <span key={classItem.id} className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                            {classItem.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newTeacher.name.trim() || !newTeacher.subjectId}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Update Teacher'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, teacher: null })}
                onConfirm={handleDeleteTeacher}
                title={t('delete_teacher')}
                message={t('are_you_sure_delete_teacher').replace('{{deleteConfirm.teacher?.name}}', deleteConfirm.teacher?.name || '')}
                confirmText={t('delete_teacher')}
                type="danger"
                isLoading={isDeleting}
            />
        </>
    );
};

const ParentsManagement: React.FC<{ searchTerm: string; setSuccessMessage: (msg: string) => void }> = ({ searchTerm, setSuccessMessage }) => {
    const { users, students, setUsers } = useContext(AppContext);
    const { t } = useTranslation();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newParentName, setNewParentName] = useState('');
    const [editingParent, setEditingParent] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, parent: any | null}>({isOpen: false, parent: null});
    const [isDeleting, setIsDeleting] = useState(false);

    const parentUsers = useMemo(() => {
        return users.filter(u => u.role?.toLowerCase() === 'parent')
            .filter(parent => parent.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [users, searchTerm]);

    const handleAddParent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newParentName.trim()) return;

        setIsLoading(true);
        try {
            const parentData = {
                name: newParentName.trim(),
                role: 'parent'
            };

            const result = await apiService.createUser(parentData);
            setUsers([...users, result.user]);

            setSuccessMessage(`Parent "${newParentName}" created successfully! Parent code: ${result.user.id}`);
            setNewParentName('');
            setShowAddModal(false);
        } catch (error) {
            console.error('Error creating parent:', error);
            setSuccessMessage('Failed to create parent. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const startEditParent = (parent: any) => {
        setEditingParent(parent);
        setNewParentName(parent.name);
        setShowEditModal(true);
    };

    const handleEditParent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newParentName.trim() || !editingParent) return;

        setIsLoading(true);
        try {
            await apiService.updateUser(editingParent.id, { name: newParentName.trim() });
            setUsers(users.map(u => u.id === editingParent.id ? { ...u, name: newParentName.trim() } : u));
            setSuccessMessage(`Parent "${newParentName}" updated successfully!`);
            setNewParentName('');
            setEditingParent(null);
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating parent:', error);
            setSuccessMessage('Failed to update parent. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDeleteParent = (parent: any) => {
        setDeleteConfirm({ isOpen: true, parent });
    };

    const handleDeleteParent = async () => {
        if (!deleteConfirm.parent) return;

        setIsDeleting(true);
        try {
            await apiService.deleteUser(deleteConfirm.parent.id);
            setUsers(users.filter(u => u.id !== deleteConfirm.parent!.id));
            setSuccessMessage(`Parent "${deleteConfirm.parent.name}" deleted successfully!`);
            setDeleteConfirm({ isOpen: false, parent: null });
        } catch (error) {
            console.error('Error deleting parent:', error);
            setSuccessMessage('Failed to delete parent. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Parents ({parentUsers.length})</h3>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i>{t('add_new_parent')}
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {parentUsers.map(parent => {
                        const parentChildren = students.filter(s => parent.childrenIds?.includes(s.id));
                        
                        return (
                            <div key={parent.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3 mb-3">
                                    <ProfileImage name={parent.name} avatarUrl={parent.avatar} className="w-12 h-12" />
                                    <div>
                                        <h4 className="font-bold text-gray-800">{parent.name}</h4>
                                        <p className="text-sm text-gray-600">ID: {parent.id}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <p className="font-medium">Children ({parentChildren.length}):</p>
                                        {parentChildren.length > 0 ? (
                                            <div className="space-y-1 mt-1">
                                                {parentChildren.map(child => (
                                                    <div key={child.id} className="flex items-center space-x-2 text-xs">
                                                        <ProfileImage name={child.name} avatarUrl={child.avatar} className="w-6 h-6" />
                                                        <span>{child.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-xs">No children assigned</p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end space-x-2">
                                    <button 
                                        onClick={() => startEditParent(parent)}
                                        className="text-blue-600 hover:text-blue-800 transition"
                                        title="Edit parent"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                        onClick={() => confirmDeleteParent(parent)}
                                        className="text-red-600 hover:text-red-800 transition"
                                        title="Delete parent"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {parentUsers.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-8">
                            <i className="fas fa-users text-4xl mb-4"></i>
                            <p>{t('no_parents_found_add_first')}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Add Parent Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Parent">
                <form onSubmit={handleAddParent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('parent_name')}
                        </label>
                        <input
                            type="text"
                            value={newParentName}
                            onChange={(e) => setNewParentName(e.target.value)}
                            placeholder={t('enter_parent_name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <i className="fas fa-info-circle mr-2"></i>
                            A unique parent code will be generated automatically. Children can be assigned later when creating students.
                        </p>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newParentName.trim()}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : t('add_new_parent')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Parent Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Parent">
                <form onSubmit={handleEditParent} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parent Name
                        </label>
                        <input
                            type="text"
                            value={newParentName}
                            onChange={(e) => setNewParentName(e.target.value)}
                            placeholder="Enter parent name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <i className="fas fa-info-circle mr-2"></i>
                            Children relationships are managed when editing students.
                        </p>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newParentName.trim()}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : t('update_parent')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, parent: null })}
                onConfirm={handleDeleteParent}
                title={t('delete_parent')}
                message={t('are_you_sure_delete_parent').replace('{{deleteConfirm.parent?.name}}', deleteConfirm.parent?.name || '')}
                confirmText={t('delete_parent')}
                type="danger"
                isLoading={isDeleting}
            />
        </>
    );
};

// More placeholder components for academic management
const ClassManagement: React.FC<{ setSuccessMessage: (msg: string) => void }> = ({ setSuccessMessage }) => {
    const { classes, setClasses, subjects } = useContext(AppContext);
    const { t } = useTranslation();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [editingClass, setEditingClass] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, classItem: any | null}>({isOpen: false, classItem: null});
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim()) return;

        setIsLoading(true);
        try {
            const newClass = await apiService.createClass(newClassName.trim(), selectedSubjects);
            setClasses([...classes, newClass]);
            setSuccessMessage(`Class "${newClassName}" created successfully with ${selectedSubjects.length} subjects!`);
            setNewClassName('');
            setSelectedSubjects([]);
            setShowAddModal(false);
        } catch (error) {
            console.error('Error creating class:', error);
            setSuccessMessage('Failed to create class. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim() || !editingClass) return;

        setIsLoading(true);
        try {
            const updatedClass = await apiService.updateClass(editingClass.id, {
                name: newClassName.trim(),
                subjectIds: selectedSubjects
            });
            setClasses(classes.map(c => c.id === editingClass.id ? updatedClass : c));
            setSuccessMessage(`Class "${newClassName}" updated successfully with ${selectedSubjects.length} subjects!`);
            setNewClassName('');
            setSelectedSubjects([]);
            setEditingClass(null);
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating class:', error);
            setSuccessMessage('Failed to update class. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const startEditClass = (classItem: any) => {
        setEditingClass(classItem);
        setNewClassName(classItem.name);
        setSelectedSubjects((classItem as any).subjectIds || []);
        setShowEditModal(true);
    };

    const confirmDeleteClass = (classItem: any) => {
        setDeleteConfirm({ isOpen: true, classItem: classItem });
    };

    const handleDeleteClass = async () => {
        if (!deleteConfirm.classItem) return;

        setIsDeleting(true);
        try {
            await apiService.deleteClass(deleteConfirm.classItem.id);
            setClasses(classes.filter(c => c.id !== deleteConfirm.classItem!.id));
            setSuccessMessage(`Class "${deleteConfirm.classItem.name}" deleted successfully!`);
            setDeleteConfirm({ isOpen: false, classItem: null });
        } catch (error) {
            console.error('Error deleting class:', error);
            setSuccessMessage('Failed to delete class. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubjectToggle = (subjectId: string) => {
        setSelectedSubjects(prev => 
            prev.includes(subjectId) 
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Classes ({classes.length})</h3>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i>{t('add_new_class')}
                    </button>
                </div>
                <div className="space-y-4">
                    {classes.map(classItem => (
                        <div key={classItem.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">{classItem.name}</h4>
                                    <p className="text-sm text-gray-600">Class ID: {classItem.id}</p>
                                    {(classItem as any).subjectIds && (
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-gray-700">Subjects:</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(classItem as any).subjectIds.map((subjectId: string) => {
                                                    const subject = subjects.find(s => s.id === subjectId);
                                                    return subject ? (
                                                        <span key={subjectId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                            {subject.name}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => startEditClass(classItem)}
                                                    className="text-blue-600 hover:text-blue-800 transition"
                                                    title="Edit class"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    onClick={() => confirmDeleteClass(classItem)}
                                                    className="text-red-600 hover:text-red-800 transition"
                                                    title="Delete class"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <i className="fas fa-school text-4xl mb-4"></i>
                            <p>{t('no_classes_yet')}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Add Class Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Class">
                <form onSubmit={handleAddClass} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('class_name')}
                        </label>
                        <input
                            type="text"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder={t('class_name_placeholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('assign_subjects_to_class')}
                        </label>
                        {subjects.length === 0 ? (
                            <p className="text-gray-500 text-sm">{t('no_subjects_available')}</p>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                {subjects.map(subject => (
                                    <label key={subject.id} className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubjects.includes(subject.id)}
                                            onChange={() => handleSubjectToggle(subject.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm">{subject.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Selected: {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newClassName.trim()}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : t('add_new_class')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Class Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Class">
                <form onSubmit={handleEditClass} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Class Name
                        </label>
                        <input
                            type="text"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder="e.g., Grade 5A, Class 10B"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign Subjects to Class
                        </label>
                        {subjects.length === 0 ? (
                            <p className="text-gray-500 text-sm">No subjects available. Create subjects first.</p>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                {subjects.map(subject => (
                                    <label key={subject.id} className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedSubjects.includes(subject.id)}
                                            onChange={() => handleSubjectToggle(subject.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm">{subject.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Selected: {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newClassName.trim()}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Update Class'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, classItem: null })}
                onConfirm={handleDeleteClass}
                title={t('delete_class_confirm')}
                message={t('are_you_sure_delete_class').replace('{{deleteConfirm.class?.name}}', deleteConfirm.classItem?.name || '')}
                confirmText={t('delete_class')}
                type="danger"
                isLoading={isDeleting}
            />
        </>
    );
};

const SubjectManagement: React.FC<{ setSuccessMessage: (msg: string) => void }> = ({ setSuccessMessage }) => {
    const { subjects, setSubjects } = useContext(AppContext);
    const { t } = useTranslation();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, subjectItem: Subject | null}>({isOpen: false, subjectItem: null});
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName.trim()) return;

        setIsLoading(true);
        try {
            const newSubject = await apiService.createSubject(newSubjectName.trim());
            setSubjects([...subjects, newSubject]);
            setSuccessMessage(`Subject "${newSubjectName}" created successfully!`);
            setNewSubjectName('');
            setShowAddModal(false);
        } catch (error) {
            console.error('Error creating subject:', error);
            setSuccessMessage('Failed to create subject. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName.trim() || !editingSubject) return;

        setIsLoading(true);
        try {
            const updatedSubject = await apiService.updateSubject(editingSubject.id, {
                name: newSubjectName.trim()
            });
            setSubjects(subjects.map(s => s.id === editingSubject.id ? updatedSubject : s));
            setSuccessMessage(`Subject "${newSubjectName}" updated successfully!`);
            setNewSubjectName('');
            setEditingSubject(null);
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating subject:', error);
            setSuccessMessage('Failed to update subject. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const startEdit = (subject: Subject) => {
        setEditingSubject(subject);
        setNewSubjectName(subject.name);
        setShowEditModal(true);
    };

    const confirmDelete = (subject: Subject) => {
        setDeleteConfirm({ isOpen: true, subjectItem: subject });
    };

    const handleDeleteSubject = async () => {
        if (!deleteConfirm.subjectItem) return;

        setIsDeleting(true);
        try {
            await apiService.deleteSubject(deleteConfirm.subjectItem.id);
            setSubjects(subjects.filter(s => s.id !== deleteConfirm.subjectItem!.id));
            setSuccessMessage(`Subject "${deleteConfirm.subjectItem.name}" deleted successfully!`);
            setDeleteConfirm({ isOpen: false, subjectItem: null });
        } catch (error) {
            console.error('Error deleting subject:', error);
            setSuccessMessage('Failed to delete subject. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Subjects ({subjects.length})</h3>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i>{t('add_new_subject')}
                    </button>
                </div>
                            <div className="space-y-2">
                                {subjects.map(subject => (
                                    <div key={subject.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium">{subject.name}</span>
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => startEdit(subject)}
                                                className="text-blue-600 hover:text-blue-800 transition"
                                                title="Edit subject"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button 
                                                onClick={() => confirmDelete(subject)}
                                                className="text-red-600 hover:text-red-800 transition"
                                                title="Delete subject"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                    {subjects.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                            <i className="fas fa-book text-4xl mb-4"></i>
                            <p>{t('no_subjects_available')}</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Add Subject Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Subject">
                <form onSubmit={handleAddSubject} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('subject_name')}
                        </label>
                        <input
                            type="text"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            placeholder={t('subject_name_placeholder')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newSubjectName.trim()}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : t('add_new_subject')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Subject Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Subject">
                <form onSubmit={handleEditSubject} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject Name
                        </label>
                        <input
                            type="text"
                            value={newSubjectName}
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            placeholder="e.g., Mathematics, English, History"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !newSubjectName.trim()}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? <LoadingSpinner /> : t('update_subject')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, subjectItem: null })}
                onConfirm={handleDeleteSubject}
                title={t('delete_subject')}
                message={t('are_you_sure_delete_subject').replace('{{deleteConfirm.subject?.name}}', deleteConfirm.subjectItem?.name || '')}
                confirmText={t('delete_subject')}
                type="danger"
                isLoading={isDeleting}
            />
        </>
    );
};

const GradeManagement: React.FC<{ selectedClassId: string }> = ({ selectedClassId }) => {
    const { grades } = useContext(AppContext);

    return (
        <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Grade Management</h3>
            <p className="text-gray-600">Total Grades: {grades.length}</p>
        </Card>
    );
};

const HomeworkManagement: React.FC<{ selectedClassId: string }> = ({ selectedClassId }) => {
    const { homework } = useContext(AppContext);

    return (
        <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Homework Management</h3>
            <p className="text-gray-600">Total Homework: {homework.length}</p>
        </Card>
    );
};

const AttendanceManagement: React.FC<{ selectedClassId: string }> = ({ selectedClassId }) => {
    const { attendance } = useContext(AppContext);

    return (
        <Card>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Attendance Management</h3>
            <p className="text-gray-600">Total Records: {attendance.length}</p>
        </Card>
    );
};


export default AdminDashboard;
