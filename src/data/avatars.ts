

// Using DiceBear API for a variety of fun, deterministic avatars based on a seed.
// https://www.dicebear.com/styles/bottts-neutral/
const originalBotAvatars: string[] = [
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Bandit`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Bear`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Bella`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Buddy`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Buster`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Callie`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Casper`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Charlie`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Chester`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Cuddles`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Dexter`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Diesel`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Dusty`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Felix`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Gizmo`,
];

// Add a new set of bot avatars with different color schemes.
const coloredBotAvatars: string[] = [
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Lily&primaryColor=f472b6,c084fc&secondaryColor=f9a8d4,e9d5ff`, // Pink/Purple
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Zoe&primaryColor=a78bfa,60a5fa&secondaryColor=d8b4fe,bfdbfe`, // Violet/Blue
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Mia&primaryColor=22d3ee,34d399&secondaryColor=a5f3fc,a7f3d0`, // Cyan/Green
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Ava&primaryColor=f87171,fb923c&secondaryColor=fecaca,fed7aa`, // Red/Orange
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sophie&primaryColor=e879f9,d946ef&secondaryColor=f5d0fe,f0abfc`, // Fuchsia
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Isabella&primaryColor=fbbf24,f59e0b&secondaryColor=fef08a,fde68a`, // Amber
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Grace&primaryColor=5eead4,2dd4bf&secondaryColor=99f6e4,5eead4`, // Teal
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Hannah&primaryColor=818cf8,a78bfa&secondaryColor=c7d2fe,d8b4fe`, // Indigo/Violet
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Nora&primaryColor=f472b6,ec4899&secondaryColor=fbcfe8,fce7f3`, // Pink
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Layla&primaryColor=6ee7b7,34d399&secondaryColor=a7f3d0,6ee7b7`, // Emerald
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Aria&primaryColor=7dd3fc,38bdf8&secondaryColor=e0f2fe,bae6fd`, // Sky Blue
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Ella&primaryColor=c4b5fd,a78bfa&secondaryColor=e0e7ff,d8b4fe`, // Violet
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Scarlett&primaryColor=fb7185,f43f5e&secondaryColor=fecdd3,ffdde1`, // Rose
];

export const allAvatars: string[] = [...originalBotAvatars, ...coloredBotAvatars];
