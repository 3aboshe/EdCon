

// Fun, kid-friendly avatars inspired by ClassDojo and HackTheBox styles
// Using multiple DiceBear styles for variety

// Robot/Bot style avatars (ClassDojo-like)
const robotAvatars: string[] = [
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Bandit&backgroundColor=fef3c7`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Bear&backgroundColor=ddd6fe`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Bella&backgroundColor=fce7f3`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Buddy&backgroundColor=dcfce7`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Buster&backgroundColor=dbeafe`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Callie&backgroundColor=fed7d7`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Casper&backgroundColor=e0f2fe`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Charlie&backgroundColor=f0fdf4`,
];

// Colorful robot avatars with vibrant themes
const colorfulRobots: string[] = [
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Lily&primaryColor=f472b6,c084fc&secondaryColor=f9a8d4,e9d5ff&backgroundColor=fdf2f8`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Zoe&primaryColor=a78bfa,60a5fa&secondaryColor=d8b4fe,bfdbfe&backgroundColor=f5f3ff`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Mia&primaryColor=22d3ee,34d399&secondaryColor=a5f3fc,a7f3d0&backgroundColor=f0fdfa`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Ava&primaryColor=f87171,fb923c&secondaryColor=fecaca,fed7aa&backgroundColor=fef2f2`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sophie&primaryColor=e879f9,d946ef&secondaryColor=f5d0fe,f0abfc&backgroundColor=fdf4ff`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Isabella&primaryColor=fbbf24,f59e0b&secondaryColor=fef08a,fde68a&backgroundColor=fffbeb`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Grace&primaryColor=5eead4,2dd4bf&secondaryColor=99f6e4,5eead4&backgroundColor=f0fdfa`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Hannah&primaryColor=818cf8,a78bfa&secondaryColor=c7d2fe,d8b4fe&backgroundColor=f5f3ff`,
];

// Animal-style avatars (fun and friendly)
const animalAvatars: string[] = [
    `https://api.dicebear.com/9.x/fun-emoji/svg?seed=Tiger&backgroundColor=fef3c7`,
    `https://api.dicebear.com/9.x/fun-emoji/svg?seed=Lion&backgroundColor=fed7aa`,
    `https://api.dicebear.com/9.x/fun-emoji/svg?seed=Panda&backgroundColor=f3f4f6`,
    `https://api.dicebear.com/9.x/fun-emoji/svg?seed=Fox&backgroundColor=fed7d7`,
    `https://api.dicebear.com/9.x/fun-emoji/svg?seed=Koala&backgroundColor=e0f2fe`,
    `https://api.dicebear.com/9.x/fun-emoji/svg?seed=Penguin&backgroundColor=dbeafe`,
    `https://api.dicebear.com/9.x/fun-emoji/svg?seed=Elephant&backgroundColor=f0fdf4`,
    `https://api.dicebear.com/9.x/fun-emoji/svg?seed=Giraffe&backgroundColor=fef3c7`,
];

// Adventurer/Character style (HackTheBox-inspired)
const adventurerAvatars: string[] = [
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Knight&backgroundColor=ddd6fe`,
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Wizard&backgroundColor=fce7f3`,
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Archer&backgroundColor=dcfce7`,
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Warrior&backgroundColor=fed7d7`,
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Mage&backgroundColor=e0f2fe`,
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Rogue&backgroundColor=f0fdf4`,
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Paladin&backgroundColor=fef3c7`,
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=Ranger&backgroundColor=fdf2f8`,
];

// Pixel art style avatars (retro gaming feel)
const pixelAvatars: string[] = [
    `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=Hero&backgroundColor=ddd6fe`,
    `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=Champion&backgroundColor=fce7f3`,
    `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=Explorer&backgroundColor=dcfce7`,
    `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=Adventurer&backgroundColor=fed7d7`,
    `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=Guardian&backgroundColor=e0f2fe`,
    `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=Scout&backgroundColor=f0fdf4`,
    `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=Pioneer&backgroundColor=fef3c7`,
    `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=Voyager&backgroundColor=fdf2f8`,
];

// Combine all avatar types for children
export const childAvatars: string[] = [
    ...robotAvatars,
    ...colorfulRobots,
    ...animalAvatars,
    ...adventurerAvatars,
    ...pixelAvatars,
];

// Keep original avatars for backward compatibility
export const allAvatars: string[] = childAvatars;

// Avatar categories for easier selection
export const avatarCategories = {
    robots: [...robotAvatars, ...colorfulRobots],
    animals: animalAvatars,
    adventurers: adventurerAvatars,
    pixel: pixelAvatars,
};

export const categoryNames = {
    robots: 'Robots & Bots',
    animals: 'Animals',
    adventurers: 'Adventurers',
    pixel: 'Pixel Heroes',
};
