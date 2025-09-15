import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../App';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Teacher, UserRole, Subject, User, Student } from '../types';
import ProfileImage from '../components/common/ProfileImage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import apiService from '../services/apiService';
import { allAvatars } from '../data/avatars';

type AdminSection = 'dashboard' | 'analytics' | 'users' | 'academic' | 'system' | 'reports';
type UserManagementTab = 'students' | 'teachers' | 'parents';
type AcademicTab = 'classes' | 'subjects';

const AdminDashboard: React.FC = () => {
    const { t, classes: classList, users, students, teachers, subjects, grades, homework, announcements, attendance, messages } = useContext(AppContext);
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
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', color: 'blue' },
        { id: 'analytics', label: 'Analytics', icon: 'fa-chart-bar', color: 'purple' },
        { id: 'users', label: 'User Management', icon: 'fa-users', color: 'green' },
        { id: 'academic', label: 'Academic', icon: 'fa-graduation-cap', color: 'orange' },
        { id: 'system', label: 'System', icon: 'fa-cogs', color: 'red' },
        { id: 'reports', label: 'Reports', icon: 'fa-file-alt', color: 'teal' }
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
            <Header title="School Administration" />
            {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 m-4 rounded-lg shadow">
                    <p className="font-semibold">{successMessage}</p>
                </div>
            )}
            
            <div className="flex flex-col lg:flex-row">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 bg-white shadow-lg">
                    <div className="p-4">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Admin Panel</h2>
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
                                <h3 className="text-lg font-semibold text-gray-800">Filter by Class</h3>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Classes</option>
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
    const { t, users, students, grades, homework, announcements, teachers, attendance } = useContext(AppContext);

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
                <StatCard title="Students" value={stats.totalStudents} icon="fa-user-graduate" color="blue" />
                <StatCard title="Teachers" value={stats.totalTeachers} icon="fa-chalkboard-teacher" color="green" />
                <StatCard title="Parents" value={stats.totalParents} icon="fa-users" color="purple" />
                <StatCard title="Homework" value={stats.totalHomework} icon="fa-book" color="orange" />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Overview</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Average Grade</span>
                            <span className="text-xl font-bold text-blue-600">{stats.avgGrade}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Attendance Rate</span>
                            <span className="text-xl font-bold text-green-600">{stats.attendanceRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Active Homework</span>
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
            <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution */}
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Grade Distribution</h3>
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
                        <div className="text-center text-gray-500 py-8">No grade data available</div>
                    )}
                </Card>

                {/* Attendance Trend */}
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Attendance Trend (Last 7 Days)</h3>
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
    const [activeTab, setActiveTab] = useState<AcademicTab>('classes');

    const tabs = [
        { id: 'classes', label: 'Classes', icon: 'fa-school' },
        { id: 'subjects', label: 'Subjects', icon: 'fa-book' }
    ] as const;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Academic Management</h2>

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
            
            setSuccessMessage('System backup downloaded successfully');
        } catch (error) {
            console.error('Backup error:', error);
            setSuccessMessage('Backup failed. Please try again.');
        } finally {
            setIsBackupLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Backup & Recovery</h3>
                    <p className="text-gray-600 mb-4">Create a backup of all system data including users, grades, and messages.</p>
                    <button
                        onClick={handleBackup}
                        disabled={isBackupLoading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center space-x-2"
                    >
                        {isBackupLoading ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span>Creating Backup...</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-download"></i>
                                <span>Create Backup</span>
                            </>
                        )}
                    </button>
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
    const { users, messages, announcements, classes, subjects } = useContext(AppContext);
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
                                role: u.role,
                                createdAt: u.createdAt
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
                            totalClasses: classes.length,
                            totalSubjects: subjects.length,
                            totalAnnouncements: announcements.length,
                            systemHealth: 'Good',
                            classesList: classes,
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
            <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Generate Reports</h3>
                    <div className="space-y-3">
                        <button 
                            onClick={() => generateReport('users')}
                            disabled={isGenerating}
                            className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition disabled:opacity-50">
                            <i className="fas fa-users text-blue-600 mr-3"></i>
                            User Activity Report
                            {isGenerating && reportType === 'users' && <LoadingSpinner size="sm" className="ml-2 inline" />}
                        </button>
                        <button 
                            onClick={() => generateReport('system')}
                            disabled={isGenerating}
                            className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition disabled:opacity-50">
                            <i className="fas fa-chart-line text-green-600 mr-3"></i>
                            System Usage Report
                            {isGenerating && reportType === 'system' && <LoadingSpinner size="sm" className="ml-2 inline" />}
                        </button>
                        <button 
                            onClick={() => generateReport('communication')}
                            disabled={isGenerating}
                            className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition disabled:opacity-50">
                            <i className="fas fa-comments text-orange-600 mr-3"></i>
                            Communication Summary
                            {isGenerating && reportType === 'communication' && <LoadingSpinner size="sm" className="ml-2 inline" />}
                        </button>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Live Stats</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Users</span>
                            <span className="text-xl font-bold text-blue-600">{users.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Classes</span>
                            <span className="text-xl font-bold text-green-600">{classes.length}</span>
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
    const { students, users, classes } = useContext(AppContext);

    const filteredStudents = useMemo(() => {
        return students.filter(student => 
            student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Students ({filteredStudents.length})</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i className="fas fa-plus mr-2"></i>Add Student
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">Student</th>
                            <th className="p-3 text-left">Class</th>
                            <th className="p-3 text-left">Parent</th>
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.slice(0, 10).map(student => (
                            <tr key={student.id} className="border-b">
                                <td className="p-3">
                                    <div className="flex items-center space-x-3">
                                        <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full" />
                                        <span className="font-medium">{student.name}</span>
                                    </div>
                                </td>
                                <td className="p-3">{classes.find(c => c.id === student.classId)?.name || 'N/A'}</td>
                                <td className="p-3">
                                    {users.find(u => u.childrenIds?.includes(student.id))?.name || 'N/A'}
                                </td>
                                <td className="p-3">
                                    <div className="flex space-x-2">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button className="text-red-600 hover:text-red-800">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const TeachersManagement: React.FC<{ searchTerm: string; setSuccessMessage: (msg: string) => void }> = ({ searchTerm, setSuccessMessage }) => {
    const { teachers, users } = useContext(AppContext);

    const teacherUsers = useMemo(() => {
        return users.filter(u => u.role?.toLowerCase() === 'teacher')
            .filter(teacher => teacher.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [users, searchTerm]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Teachers ({teacherUsers.length})</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i className="fas fa-plus mr-2"></i>Add Teacher
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">Teacher</th>
                            <th className="p-3 text-left">Subject</th>
                            <th className="p-3 text-left">Classes</th>
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teacherUsers.slice(0, 10).map(teacher => (
                            <tr key={teacher.id} className="border-b">
                                <td className="p-3">
                                    <div className="flex items-center space-x-3">
                                        <ProfileImage name={teacher.name} avatarUrl={teacher.avatar} className="w-8 h-8" />
                                        <span className="font-medium">{teacher.name}</span>
                                    </div>
                                </td>
                                <td className="p-3">{teacher.subject || 'N/A'}</td>
                                <td className="p-3">{teacher.classIds?.length || 0} classes</td>
                                <td className="p-3">
                                    <div className="flex space-x-2">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button className="text-red-600 hover:text-red-800">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const ParentsManagement: React.FC<{ searchTerm: string; setSuccessMessage: (msg: string) => void }> = ({ searchTerm, setSuccessMessage }) => {
    const { users, students } = useContext(AppContext);

    const parentUsers = useMemo(() => {
        return users.filter(u => u.role?.toLowerCase() === 'parent')
            .filter(parent => parent.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [users, searchTerm]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Parents ({parentUsers.length})</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i className="fas fa-plus mr-2"></i>Add Parent
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">Parent</th>
                            <th className="p-3 text-left">Children</th>
                            <th className="p-3 text-left">Contact</th>
                            <th className="p-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parentUsers.slice(0, 10).map(parent => (
                            <tr key={parent.id} className="border-b">
                                <td className="p-3">
                                    <div className="flex items-center space-x-3">
                                        <ProfileImage name={parent.name} avatarUrl={parent.avatar} className="w-8 h-8" />
                                        <span className="font-medium">{parent.name}</span>
                                    </div>
                                </td>
                                <td className="p-3">{parent.childrenIds?.length || 0} children</td>
                                <td className="p-3">{parent.id}</td>
                                <td className="p-3">
                                    <div className="flex space-x-2">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button className="text-red-600 hover:text-red-800">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// More placeholder components for academic management
const ClassManagement: React.FC<{ setSuccessMessage: (msg: string) => void }> = ({ setSuccessMessage }) => {
    const { classes } = useContext(AppContext);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Classes ({classes.length})</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i className="fas fa-plus mr-2"></i>Add Class
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map(classItem => (
                    <div key={classItem.id} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-bold text-gray-800">{classItem.name}</h4>
                        <p className="text-sm text-gray-600">Class ID: {classItem.id}</p>
                        <div className="mt-3 flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                                <i className="fas fa-edit"></i>
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const SubjectManagement: React.FC<{ setSuccessMessage: (msg: string) => void }> = ({ setSuccessMessage }) => {
    const { subjects } = useContext(AppContext);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Subjects ({subjects.length})</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    <i className="fas fa-plus mr-2"></i>Add Subject
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => (
                    <div key={subject.id} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-bold text-gray-800">{subject.name}</h4>
                        <p className="text-sm text-gray-600">Subject ID: {subject.id}</p>
                        <div className="mt-3 flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                                <i className="fas fa-edit"></i>
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
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
