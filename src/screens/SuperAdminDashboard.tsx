import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Users, School, Activity, Plus, Search, MoreVertical, 
  Settings, LogOut, Bell, Shield, CheckCircle, AlertCircle, Trash2, UserPlus 
} from 'lucide-react';
import apiService from '../services/apiService';
import { useSession } from '../hooks/useSession';
import Header from '../components/ui/Header';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const SuperAdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useSession();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalUsers: 0,
    activeUsers: 0,
    systemHealth: 'healthy'
  });
  
  const [schools, setSchools] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete School State
  const [deleteSchoolId, setDeleteSchoolId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Admin State
  const [addAdminSchoolId, setAddAdminSchoolId] = useState<string | null>(null);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '' });
  const [adminCredentials, setAdminCredentials] = useState<{accessCode: string, temporaryPassword: string} | null>(null);

  // Form state for new school
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    timezone: 'UTC',
    adminName: '',
    adminEmail: ''
  });

  const [createdCredentials, setCreatedCredentials] = useState<{accessCode: string, temporaryPassword: string} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, schoolsRes, activityRes] = await Promise.all([
          apiService.getSuperAdminMetrics(),
          apiService.getSchools(),
          apiService.getRecentActivity()
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (schoolsRes.success) setSchools(schoolsRes.data || []);
        if (activityRes.success) setActivities(activityRes.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateSchool = async () => {
    try {
      // Format payload for backend
      const payload = {
        name: newSchool.name,
        address: newSchool.address,
        timezone: newSchool.timezone,
        admin: {
          name: newSchool.adminName,
          email: newSchool.adminEmail
        }
      };

      const res = await apiService.createSchool(payload);
      if (res.success && res.data) {
        // The backend returns credentials in the response, but our typed apiService might wrap it
        // We need to check how apiService handles the response data
        // Assuming res.data contains the full response body or we need to adjust apiService
        
        // Let's assume the response data has the credentials if the type allows, 
        // or we might need to cast it since our School interface doesn't have credentials
        const responseData = res as any; 
        
        if (responseData.credentials) {
             setCreatedCredentials(responseData.credentials);
        } else if (responseData.data && responseData.data.credentials) {
             setCreatedCredentials(responseData.data.credentials);
        }
        
        setShowCreateModal(false);
        // Refresh list
        const schoolsRes = await apiService.getSchools();
        if (schoolsRes.success) setSchools(schoolsRes.data || []);
        setNewSchool({ name: '', address: '', timezone: 'UTC', adminName: '', adminEmail: '' });
      }
    } catch (error) {
      console.error('Failed to create school', error);
    }
  };

  const confirmDeleteSchool = (id: string) => {
    setDeleteSchoolId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSchool = async () => {
    if (!deleteSchoolId) return;
    
    setIsDeleting(true);
    try {
      const res = await apiService.deleteSchool(deleteSchoolId);
      if (res.success) {
        setSchools(schools.filter(s => s.id !== deleteSchoolId));
        setIsDeleteModalOpen(false);
        setDeleteSchoolId(null);
      }
    } catch (error) {
      console.error('Failed to delete school', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddAdminModal = (schoolId: string) => {
    setAddAdminSchoolId(schoolId);
    setNewAdmin({ name: '', email: '' });
    setAdminCredentials(null);
    setIsAddAdminModalOpen(true);
  };

  const handleAddAdmin = async () => {
    if (!addAdminSchoolId || !newAdmin.name) return;

    try {
      const res = await apiService.addSchoolAdmin(addAdminSchoolId, newAdmin);
      if (res.success) {
        // Assuming response contains credentials
        const responseData = res as any;
        if (responseData.credentials) {
          setAdminCredentials(responseData.credentials);
        } else if (responseData.data && responseData.data.credentials) {
          setAdminCredentials(responseData.data.credentials);
        }
        // Don't close modal immediately, show credentials first
      }
    } catch (error) {
      console.error('Failed to add admin', error);
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header user={user} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Super Admin HQ</h1>
          <p className="text-slate-500 mt-1">Overview of the entire EdCon ecosystem</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border border-blue-100 shadow-sm bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Schools</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalSchools}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <School className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border border-indigo-100 shadow-sm bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Users</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border border-sky-100 shadow-sm bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Now</p>
                <p className="text-3xl font-bold text-sky-600 mt-1">{stats.activeUsers}</p>
              </div>
              <div className="p-3 bg-sky-50 rounded-full">
                <Activity className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-slate-100 shadow-sm bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">System Status</p>
                <div className="flex items-center mt-2">
                  <span className={`w-3 h-3 rounded-full mr-2 ${stats.systemHealth === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-lg font-semibold capitalize text-slate-700">{stats.systemHealth}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-full">
                <Shield className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Schools List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Managed Schools</h2>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-6 shadow-lg shadow-blue-200 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add School
              </Button>
            </div>

            <Card className="overflow-hidden border border-blue-50 shadow-sm bg-white">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search schools..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="divide-y divide-slate-50">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-500">Loading schools...</div>
                ) : filteredSchools.length > 0 ? (
                  filteredSchools.map((school) => (
                    <div key={school.id} className="p-4 hover:bg-blue-50/30 transition-colors flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                          {school.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{school.name}</h3>
                          <p className="text-sm text-slate-500 flex items-center mt-0.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-2"></span>
                            {school.address || 'No address'} • {school.timezone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block mr-2">
                          <p className="text-sm font-medium text-slate-900">{school._count?.users || 0} Users</p>
                          <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded mt-1">{school.code}</p>
                        </div>
                        
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={() => openAddAdminModal(school.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Add Admin"
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => confirmDeleteSchool(school.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete School"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500">No schools found matching your search.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <Card className="p-0 border border-slate-100 shadow-sm bg-white h-full max-h-[600px] overflow-y-auto">
              <div className="divide-y divide-slate-50">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 flex space-x-3 hover:bg-slate-50/50 transition-colors">
                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${
                      activity.type === 'login' ? 'bg-emerald-500 shadow-emerald-200' : 
                      activity.type === 'create_school' ? 'bg-blue-500 shadow-blue-200' : 'bg-slate-400'
                    }`} />
                    <div>
                      <p className="text-sm text-slate-900 font-medium">{activity.description}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-slate-400">{new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-medium">{activity.user?.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-sm">No recent activity</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Create School Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New School"
      >
        {createdCredentials ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">School Created Successfully!</h3>
                <p className="text-green-700 text-sm mt-1">Please save these admin credentials securely.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Code</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-lg font-mono font-bold text-slate-900">{createdCredentials.accessCode}</code>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Temporary Password</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-lg font-mono font-bold text-slate-900">{createdCredentials.temporaryPassword}</code>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                setCreatedCredentials(null);
                setShowCreateModal(false);
              }}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              <p className="text-sm text-blue-800">
                Creating a school will automatically generate a School Admin account. Credentials will be shown after creation.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Name</label>
              <Input
                value={newSchool.name}
                onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                placeholder="e.g. Springfield High"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
              <Input
                value={newSchool.address}
                onChange={(e) => setNewSchool({...newSchool, address: e.target.value})}
                placeholder="123 Education Ave"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Name</label>
                <Input
                  value={newSchool.adminName}
                  onChange={(e) => setNewSchool({...newSchool, adminName: e.target.value})}
                  placeholder="Principal Skinner"
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Email</label>
                <Input
                  type="email"
                  value={newSchool.adminEmail}
                  onChange={(e) => setNewSchool({...newSchool, adminEmail: e.target.value})}
                  placeholder="admin@school.edu"
                  className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateSchool} className="bg-blue-600 text-white hover:bg-blue-700">Create School</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Admin Modal */}
      <Modal
        isOpen={isAddAdminModalOpen}
        onClose={() => setIsAddAdminModalOpen(false)}
        title="Add School Admin"
      >
        {adminCredentials ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Admin Added Successfully!</h3>
                <p className="text-green-700 text-sm mt-1">Please share these credentials with the new admin.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Code</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-lg font-mono font-bold text-slate-900">{adminCredentials.accessCode}</code>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Temporary Password</label>
                <div className="flex items-center justify-between mt-1">
                  <code className="text-lg font-mono font-bold text-slate-900">{adminCredentials.temporaryPassword}</code>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                setAdminCredentials(null);
                setIsAddAdminModalOpen(false);
              }}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
              <p className="text-sm text-green-800">
                You are about to add a new admin to this school. Please provide the admin's details.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Name</label>
              <Input
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                placeholder="e.g. John Doe"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email (Optional)</label>
              <Input
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                placeholder="admin@school.edu"
                type="email"
                className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddAdminModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddAdmin} className="bg-blue-600 text-white hover:bg-blue-700">Add Admin</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSchool}
        title="Delete School"
        message="Are you sure you want to delete this school? This action cannot be undone and will delete all associated data including users, classes, and grades."
        confirmText="Delete School"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SuperAdminDashboard;
