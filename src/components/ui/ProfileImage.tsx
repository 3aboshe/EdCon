
import React from 'react';

interface ProfileImageProps {
    name: string;
    avatarUrl?: string | null;
    className?: string;
    textClassName?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ name, avatarUrl, className = 'w-12 h-12', textClassName = 'text-xl' }) => {
    console.log('=== PROFILE IMAGE DEBUG ===');
    console.log('Name:', name);
    console.log('Avatar URL:', avatarUrl ? `has avatar (${avatarUrl.length} chars)` : 'no avatar');
    console.log('Avatar preview:', avatarUrl ? avatarUrl.substring(0, 100) + '...' : 'none');
    
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    };

    if (avatarUrl) {
        console.log('Rendering avatar image for:', name);
        return (
            <img 
                src={avatarUrl}
                alt={name}
                className={`${className} rounded-full object-cover bg-gray-200`}
                onError={(e) => {
                    console.error('Image failed to load for:', name, e);
                }}
                onLoad={() => {
                    console.log('Image loaded successfully for:', name);
                }}
            />
        );
    }

    return (
        <div 
            className={`${className} rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300`}
        >
            <i className={`fa-solid fa-user text-gray-400 ${textClassName}`}></i>
        </div>
    );
};

export default ProfileImage;
