import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Users, School, Activity, Plus, Search, MoreVertical, 
  Settings, LogOut, Bell, Shield, CheckCircle, AlertCircle 
} from 'lucide-react';
import apiService from '../services/apiService';
import { useSession } from '../hooks/useSession';
import Header from '../components/ui/Header';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

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
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-slate-900">{school._count?.users || 0} Users</p>
                          <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded mt-1">{school.code}</p>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </button>
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
          <div className="pt-6 flex justify-end space-x-3 border-t border-slate-100 mt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="hover:bg-slate-100">Cancel</Button>
            <Button onClick={handleCreateSchool} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">Create School</Button>
          </div>
        </div>
      </Modal>

      {/* Credentials Modal */}
      <Modal
        isOpen={!!createdCredentials}
        onClose={() => setCreatedCredentials(null)}
        title="School Created Successfully"
      >
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <p className="text-slate-600">
            The school has been initialized and the admin account is ready. Please share these credentials with the school administrator securely.
          </p>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Access Code</p>
              <p className="text-2xl font-mono font-bold text-slate-900 tracking-widest select-all">{createdCredentials?.accessCode}</p>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Temporary Password</p>
              <p className="text-xl font-mono font-bold text-blue-600 select-all">{createdCredentials?.temporaryPassword}</p>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-start text-left">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              This password will only be shown once. The admin will be required to change it upon their first login.
            </p>
          </div>

          <Button onClick={() => setCreatedCredentials(null)} className="w-full bg-slate-900 text-white hover:bg-slate-800">
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
