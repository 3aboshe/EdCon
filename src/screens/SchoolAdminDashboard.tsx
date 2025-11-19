import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, BookOpen, Calendar, MessageSquare, Bell,
  Plus, Search, MoreHorizontal, UserPlus, Mail,
  CheckCircle, Clock, AlertTriangle, X, ChevronRight,
  GraduationCap, LayoutDashboard, Settings, LogOut
} from 'lucide-react';
import apiService, { User, Class } from '../services/apiService';
import { useSession } from '../hooks/useSession';
import Header from '../components/ui/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import RealTimeStatus from '../components/ui/RealTimeStatus';

const SchoolAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useSession();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    attendanceRate: 0,
    activeAlerts: 0
  });

  const [activeClasses, setActiveClasses] = useState<Class[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);

  // Form States
  const [newStudent, setNewStudent] = useState({ name: '', parentEmail: '' });
  const [newClass, setNewClass] = useState({ name: '', subject: '' });
  const [createdUserCreds, setCreatedUserCreds] = useState<{ code: string, user: User, password?: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId) return;

      setIsLoading(true);
      try {
        const [statsRes, classesRes, usersRes] = await Promise.all([
          apiService.getSchoolStats(user.schoolId),
          apiService.getAllClasses(),
          apiService.getAllUsers()
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }

        if (classesRes) {
          setActiveClasses(classesRes.slice(0, 5)); // Show top 5
        }

        if (usersRes) {
          // Filter for pending users (assuming 'status' field or similar, falling back to mock logic if needed)
          // For now, we'll simulate pending by checking if they have a specific flag or just show recent users
          // Since backend might not have 'status' fully populated for all, we'll show recent users as "Onboarding"
          // or filter by those without a class assigned yet if they are students
          const pending = usersRes.filter(u => !u.status || u.status === 'PENDING').slice(0, 5);
          setPendingUsers(pending);
        }

      } catch (error) {
        console.error('Failed to fetch school data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.schoolId]);

  const handleAddStudent = async () => {
    try {
      const res = await apiService.createUser({
        name: newStudent.name,
        role: 'STUDENT',
        schoolId: user?.schoolId
      });
      setCreatedUserCreds(res);
      setShowAddStudentModal(false);
      // Refresh data
      const statsRes = await apiService.getSchoolStats(user?.schoolId!);
      if (statsRes.success) setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to add student', error);
    }
  };

  const handleCreateClass = async () => {
    try {
      await apiService.createClass(newClass.name);
      setShowCreateClassModal(false);
      const classes = await apiService.getAllClasses();
      setActiveClasses(classes.slice(0, 5));
      setNewClass({ name: '', subject: '' });
    } catch (error) {
      console.error('Failed to create class', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Custom Header for Dark Theme */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              EdCon Admin
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <RealTimeStatus />
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer ring-2 ring-slate-900 ring-offset-2 ring-offset-slate-800">
              {user?.name?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-400 mt-2 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              {user?.school?.name || 'School Administration'} • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowAddStudentModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-900/20 hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="!bg-slate-800/50 !border-slate-700/50 backdrop-blur-sm hover:!bg-slate-800 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">+12%</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
            <p className="text-sm text-slate-400 mt-1">Total Students</p>
          </Card>

          <Card className="!bg-slate-800/50 !border-slate-700/50 backdrop-blur-sm hover:!bg-slate-800 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                <GraduationCap className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs font-medium text-slate-400">Active</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalTeachers}</p>
            <p className="text-sm text-slate-400 mt-1">Teachers</p>
          </Card>

          <Card className="!bg-slate-800/50 !border-slate-700/50 backdrop-blur-sm hover:!bg-slate-800 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-xs font-medium text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full border border-orange-400/20">New</span>
            </div>
            <p className="text-3xl font-bold text-white">12</p>
            <p className="text-sm text-slate-400 mt-1">Unread Messages</p>
          </Card>

          <Card className="!bg-slate-800/50 !border-slate-700/50 backdrop-blur-sm hover:!bg-slate-800 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-500/10 rounded-xl group-hover:bg-rose-500/20 transition-colors">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <span className="text-xs font-medium text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-full border border-rose-400/20">Action</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.activeAlerts}</p>
            <p className="text-sm text-slate-400 mt-1">System Alerts</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Add Student', icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', onClick: () => setShowAddStudentModal(true) },
                { label: 'Create Class', icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', onClick: () => setShowCreateClassModal(true) },
                { label: 'Broadcast', icon: Bell, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', onClick: () => { } },
                { label: 'Invite Teacher', icon: Mail, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', onClick: () => { } },
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`p-4 rounded-2xl border ${action.border} ${action.bg} hover:bg-opacity-20 transition-all duration-300 transform hover:-translate-y-1 text-left group backdrop-blur-sm`}
                >
                  <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <span className="font-medium text-slate-200 group-hover:text-white transition-colors">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Active Classes */}
            <Card className="!bg-slate-800 !border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Active Classes</h2>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-700">View All</Button>
              </div>
              <div className="divide-y divide-slate-700/50">
                {activeClasses.length > 0 ? activeClasses.map((cls) => (
                  <div key={cls.id} className="p-4 hover:bg-slate-700/30 transition-colors flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {cls.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{cls.name}</h3>
                        <p className="text-sm text-slate-500">24 Students • Active</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500">No active classes found.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Pending Users Widget */}
            <Card className="!bg-slate-800 !border-slate-700 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <h3 className="font-semibold">Pending Onboarding</h3>
                <p className="text-blue-100 text-sm mt-1">Users needing setup</p>
              </div>
              <div className="divide-y divide-slate-700/50">
                {pendingUsers.length > 0 ? pendingUsers.map((u) => (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                    <div>
                      <p className="font-medium text-slate-200">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.role}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                      Review
                    </Button>
                  </div>
                )) : (
                  <div className="p-6 text-center text-slate-500 text-sm">All caught up!</div>
                )}
              </div>
              <div className="p-3 bg-slate-800/50 text-center border-t border-slate-700">
                <button className="text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors">View All Pending</button>
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-6 !bg-slate-800 !border-slate-700">
              <h3 className="font-semibold text-white mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                    Database
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                    API Gateway
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-400">
                    <Clock className="w-4 h-4 text-blue-500 mr-2" />
                    Last Backup
                  </div>
                  <span className="text-xs text-slate-500">2h ago</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        title="Add New Student"
        className="!bg-slate-800 !text-white"
      >
        {createdUserCreds ? (
          <div className="space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-400">Student Added!</h3>
                <p className="text-emerald-200/70 text-sm mt-1">Share these credentials securely.</p>
              </div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Code</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-lg font-mono font-bold text-blue-400">{createdUserCreds.code}</code>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Temporary Password</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-lg font-mono font-bold text-blue-400">{createdUserCreds.password || '********'}</code>
                </div>
              </div>
            </div>
            <Button onClick={() => { setCreatedUserCreds(null); setShowAddStudentModal(false); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <Input
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="!bg-slate-900 !border-slate-700 !text-white focus:!border-blue-500"
                placeholder="e.g. John Smith"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="ghost" onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-white hover:bg-slate-700">Cancel</Button>
              <Button onClick={handleAddStudent} className="bg-blue-600 hover:bg-blue-500 text-white">Add Student</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Class Modal */}
      <Modal
        isOpen={showCreateClassModal}
        onClose={() => setShowCreateClassModal(false)}
        title="Create New Class"
        className="!bg-slate-800 !text-white"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Class Name</label>
            <Input
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              className="!bg-slate-900 !border-slate-700 !text-white focus:!border-blue-500"
              placeholder="e.g. Grade 10A"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setShowCreateClassModal(false)} className="text-slate-400 hover:text-white hover:bg-slate-700">Cancel</Button>
            <Button onClick={handleCreateClass} className="bg-blue-600 hover:bg-blue-500 text-white">Create Class</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SchoolAdminDashboard;
