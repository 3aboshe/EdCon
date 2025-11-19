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
      const res = await apiService.createSchool(newSchool);
      if (res.success) {
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header user={user} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin HQ</h1>
          <p className="text-gray-500 mt-1">Overview of the entire EdCon ecosystem</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Schools</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalSchools}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <School className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Now</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeUsers}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">System Status</p>
                <div className="flex items-center mt-2">
                  <span className={`w-3 h-3 rounded-full mr-2 ${stats.systemHealth === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-lg font-semibold capitalize">{stats.systemHealth}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-full">
                <Shield className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Schools List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Managed Schools</h2>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-black text-white hover:bg-gray-800 rounded-full px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add School
              </Button>
            </div>

            <Card className="overflow-hidden border-none shadow-sm bg-white">
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search schools..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="divide-y divide-gray-50">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">Loading schools...</div>
                ) : filteredSchools.length > 0 ? (
                  filteredSchools.map((school) => (
                    <div key={school.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold">
                          {school.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{school.name}</h3>
                          <p className="text-sm text-gray-500">{school.address || 'No address'} • {school.timezone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium text-gray-900">{school._count?.users || 0} Users</p>
                          <p className="text-xs text-gray-500">Code: {school.code}</p>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">No schools found matching your search.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <Card className="p-0 border-none shadow-sm bg-white h-full max-h-[600px] overflow-y-auto">
              <div className="divide-y divide-gray-50">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 flex space-x-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      activity.type === 'login' ? 'bg-green-500' : 
                      activity.type === 'create_school' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{activity.user?.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="p-6 text-center text-gray-500 text-sm">No recent activity</div>
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <Input
              value={newSchool.name}
              onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
              placeholder="e.g. Springfield High"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <Input
              value={newSchool.address}
              onChange={(e) => setNewSchool({...newSchool, address: e.target.value})}
              placeholder="123 Education Ave"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
              <Input
                value={newSchool.adminName}
                onChange={(e) => setNewSchool({...newSchool, adminName: e.target.value})}
                placeholder="Principal Skinner"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
              <Input
                type="email"
                value={newSchool.adminEmail}
                onChange={(e) => setNewSchool({...newSchool, adminEmail: e.target.value})}
                placeholder="admin@school.edu"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateSchool}>Create School</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
