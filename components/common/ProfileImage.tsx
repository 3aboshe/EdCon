
import React from 'react';

interface ProfileImageProps {
    name: string;
    avatarUrl?: string | null;
    className?: string;
    textClassName?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ name, avatarUrl, className = 'w-12 h-12', textClassName = 'text-xl' }) => {
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    };

    if (avatarUrl) {
        return (
            <img 
                src={avatarUrl}
                alt={name}
                className={`${className} rounded-full object-cover bg-gray-200`}
            />
        );
    }

    return (
        <div 
            className={`${className} rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300`}
        >
            <i className={`fas fa-user text-gray-400 ${textClassName}`}></i>
        </div>
    );
};

export default ProfileImage;
