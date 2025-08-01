
import React, { useContext, useRef, useState, useEffect } from 'react';
import { AppContext } from '../App';
import Card from '../components/common/Card';
import ProfileImage from '../components/common/ProfileImage';
import { UserRole } from '../types';
import apiService from '../services/apiService';

const ProfileScreen: React.FC = () => {
    const { user, t, updateUserAvatar, updateUser } = useContext(AppContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [availability, setAvailability] = useState({
        startTime: user?.messagingAvailability?.startTime || '14:00',
        endTime: user?.messagingAvailability?.endTime || '16:00',
    });

    useEffect(() => {
        if (user?.messagingAvailability) {
            setAvailability(user.messagingAvailability);
        }
    }, [user?.messagingAvailability]);

    const handlePhotoChangeClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user) {
            console.log('=== AVATAR UPDATE DEBUG ===');
            console.log('File selected:', file.name, file.size, file.type);
            console.log('User ID:', user.id);
            console.log('Current avatar:', user.avatar ? 'has avatar' : 'no avatar');
            
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                console.log('Base64 string length:', base64String.length);
                console.log('Base64 preview:', base64String.substring(0, 100) + '...');
                
                try {
                    console.log('Calling API to update avatar...');
                    const result = await apiService.updateUser(user.id, { avatar: base64String });
                    console.log('API update result:', result);
                    
                    console.log('Updating local state...');
                    updateUserAvatar(user.id, base64String);
                    
                    console.log('Avatar update completed successfully');
                    setSuccessMessage(t('photo_updated_success'));
                    setTimeout(() => setSuccessMessage(''), 3000);
                } catch (error) {
                    console.error('Error updating avatar:', error);
                    setSuccessMessage('Error updating photo. Please try again.');
                    setTimeout(() => setSuccessMessage(''), 3000);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAvailability = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            // Update in database first
            await apiService.updateUser(user.id, { messagingAvailability: availability });
            // Then update local state
            updateUser(user.id, { messagingAvailability: availability });
            setSuccessMessage(t('availability_saved_success'));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error updating availability:', error);
            setSuccessMessage('Error saving availability. Please try again.');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    if (!user) return null;

    return (
        <div className="p-4 space-y-6">
            <Card className="flex flex-col items-center">
                <div className="relative mb-4">
                    <ProfileImage 
                        name={user.name}
                        avatarUrl={user.avatar}
                        className="w-32 h-32"
                        textClassName="text-4xl"
                    />
                    <button 
                        onClick={handlePhotoChangeClick}
                        className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-md border-2 border-white hover:bg-blue-700 transition"
                        title={t('change_photo')}
                    >
                        <i className="fa-solid fa-camera"></i>
                    </button>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-500 capitalize">{t(user.role)}</p>
                
                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </Card>

            {user.role?.toLowerCase() === 'teacher' && (
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('availability')}</h3>
                    <form onSubmit={handleSaveAvailability} className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">{t('available_from')}</label>
                                <input 
                                    type="time" 
                                    id="start-time"
                                    value={availability.startTime}
                                    onChange={(e) => setAvailability(prev => ({...prev, startTime: e.target.value}))}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">{t('available_to')}</label>
                                 <input 
                                    type="time" 
                                    id="end-time"
                                    value={availability.endTime}
                                    onChange={(e) => setAvailability(prev => ({...prev, endTime: e.target.value}))}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700">
                            {t('save_availability')}
                        </button>
                    </form>
                </Card>
            )}

            {successMessage && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg transition-opacity duration-300">
                    {successMessage}
                </div>
            )}
        </div>
    );
};

export default ProfileScreen;