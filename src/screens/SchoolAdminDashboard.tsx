import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, BookOpen, Calendar, MessageSquare, Bell, 
  Plus, Search, MoreHorizontal, UserPlus, Mail, 
  CheckCircle, Clock, AlertTriangle, AlertCircle, Eye
} from 'lucide-react';
import apiService from '../services/apiService';
import { useSession } from '../hooks/useSession';
import Header from '../components/ui/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
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
  
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // User Details State
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [resetCredentials, setResetCredentials] = useState<{accessCode: string, temporaryPassword: string} | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId) return;
      
      setIsLoading(true);
      try {
        const statsRes = await apiService.getSchoolStats(user.schoolId);
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        
        // Fetch all users for the school
        const usersRes = await apiService.getAllUsers();
        if (Array.isArray(usersRes)) {
          setAllUsers(usersRes);
        }
        
        // For pending users, we might need a specific endpoint or filter users
        // For now, we'll keep the mock or implement a fetch if an endpoint exists
        // const usersRes = await apiService.getUsers({ schoolId: user.schoolId, status: 'INVITED' });
        // if (usersRes.success) setPendingUsers(usersRes.data);
        
        // Mock pending users for now as we don't have a specific endpoint for it yet in this refactor
        setPendingUsers([
          { id: 1, name: 'Sarah Parent', role: 'PARENT', status: 'pending_otp' },
          { id: 2, name: 'John Teacher', role: 'TEACHER', status: 'pending_otp' },
        ]);
      } catch (error) {
        console.error('Failed to fetch school data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.schoolId]);

  const handleViewUser = async (userId: string) => {
    setIsLoadingUser(true);
    setShowUserDetailsModal(true);
    setResetCredentials(null);
    
    try {
      const res = await apiService.getUserCredentials(userId);
      if (res.success) {
        setUserDetails(res.data?.user || res.data);
      }
    } catch (error) {
      console.error('Failed to fetch user details', error);
      alert('Failed to fetch user details');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userDetails?.id) return;
    
    if (!confirm(`Reset password for ${userDetails.name}? A new temporary password will be generated.`)) {
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await apiService.resetUserPasswordAdmin(userDetails.id);
      if (res.success && res.data) {
        setResetCredentials(res.data.credentials || res.data);
      }
    } catch (error) {
      console.error('Failed to reset password', error);
      alert('Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header user={user} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
            <p className="text-gray-500 mt-1">{user?.school?.name || 'School Administration'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <RealTimeStatus />
            <Button className="bg-black text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
              <Plus className="w-4 h-4 mr-2" />
              Quick Action
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500 mt-1">Active Students</p>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Today</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.attendanceRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Attendance Rate</p>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">5 New</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-500 mt-1">Unread Messages</p>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Action Req</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeAlerts}</p>
            <p className="text-sm text-gray-500 mt-1">System Alerts</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Add Student', icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Create Class', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Broadcast', icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Invite Teacher', icon: Mail, color: 'text-green-600', bg: 'bg-green-50' },
              ].map((action, idx) => (
                <button key={idx} className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 text-left group">
                  <div className={`w-10 h-10 ${action.bg} rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <span className="font-medium text-gray-900">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Recent Classes / Management */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Active Classes</h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="divide-y divide-gray-50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                        {i}A
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Grade {i}A - Mathematics</h3>
                        <p className="text-sm text-gray-500">Mr. Anderson • 24 Students</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* OTP Onboarding Widget */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <h3 className="font-semibold">Pending Onboarding</h3>
                <p className="text-blue-100 text-sm mt-1">Users needing setup</p>
              </div>
              <div className="divide-y divide-gray-50">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      Resend OTP
                    </Button>
                  </div>
                ))}
                {pendingUsers.length === 0 && (
                  <div className="p-6 text-center text-gray-500 text-sm">All caught up!</div>
                )}
              </div>
              <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All Pending</button>
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-6 border-none shadow-sm bg-white">
              <h3 className="font-semibold text-gray-900 mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Database
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    API Gateway
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-blue-500 mr-2" />
                    Last Backup
                  </div>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Users Management Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">School Users</h2>
          <Card className="overflow-hidden border-none shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Access Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'PARENT' ? 'bg-green-100 text-green-700' :
                          user.role === 'STUDENT' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'SCHOOL_ADMIN' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{user.accessCode}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          user.status === 'INVITED' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="flex items-center text-blue-600 hover:text-blue-900 font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>

      {/* User Details Modal */}
      <Modal
        isOpen={showUserDetailsModal}
        onClose={() => {
          setShowUserDetailsModal(false);
          setUserDetails(null);
          setResetCredentials(null);
        }}
        title="User Details & Credentials"
      >
        {isLoadingUser ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user details...</p>
          </div>
        ) : resetCredentials ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Password Reset Successfully!</h3>
                <p className="text-green-700 text-sm mt-1">Please share these new credentials with the user.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Access Code</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-lg font-mono font-bold text-gray-900">{resetCredentials.accessCode}</code>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Temporary Password</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-lg font-mono font-bold text-gray-900">{resetCredentials.temporaryPassword}</code>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                setResetCredentials(null);
                setShowUserDetailsModal(false);
              }}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Done
            </Button>
          </div>
        ) : userDetails ? (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{userDetails.name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{userDetails.role}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{userDetails.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{userDetails.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{userDetails.class?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{userDetails.status}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Access Code</label>
              <div className="flex items-center justify-between mt-1">
                <code className="text-lg font-mono font-bold text-gray-900">{userDetails.accessCode}</code>
              </div>
              {userDetails.hasTemporaryPassword && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex items-center text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    User has a temporary password that requires reset
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleResetPassword}
                className="flex-1 bg-amber-600 text-white hover:bg-amber-700"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? 'Resetting...' : 'Reset Password'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUserDetailsModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default SchoolAdminDashboard;
