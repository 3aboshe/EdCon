import React, { useState } from 'react';
import { avatarCategories, categoryNames, childAvatars } from '../../data/avatars';
import Modal from './Modal';

interface ChildAvatarSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectAvatar: (avatarUrl: string) => void;
    currentAvatar?: string;
    childName: string;
}

const ChildAvatarSelector: React.FC<ChildAvatarSelectorProps> = ({
    isOpen,
    onClose,
    onSelectAvatar,
    currentAvatar,
    childName
}) => {
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof avatarCategories>('robots');
    const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || '');

    const handleSelectAvatar = (avatarUrl: string) => {
        setSelectedAvatar(avatarUrl);
    };

    const handleConfirmSelection = () => {
        if (selectedAvatar) {
            onSelectAvatar(selectedAvatar);
            onClose();
        }
    };

    const categories = Object.keys(avatarCategories) as Array<keyof typeof avatarCategories>;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Choose Avatar for ${childName}`}>
            <div className="space-y-6">
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedCategory === category
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {categoryNames[category]}
                        </button>
                    ))}
                </div>

                {/* Avatar Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                    {avatarCategories[selectedCategory].map((avatarUrl, index) => (
                        <button
                            key={index}
                            onClick={() => handleSelectAvatar(avatarUrl)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                selectedAvatar === avatarUrl
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <img
                                src={avatarUrl}
                                alt={`Avatar ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            {selectedAvatar === avatarUrl && (
                                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                    <i className="fas fa-check text-blue-600 text-lg"></i>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Current Selection Preview */}
                {selectedAvatar && (
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <img
                            src={selectedAvatar}
                            alt="Selected avatar"
                            className="w-16 h-16 rounded-lg"
                        />
                        <div>
                            <p className="font-medium text-gray-800">Selected Avatar</p>
                            <p className="text-sm text-gray-600">This will be {childName}'s new profile picture</p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmSelection}
                        disabled={!selectedAvatar}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Set Avatar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ChildAvatarSelector;
