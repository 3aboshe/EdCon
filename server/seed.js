import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Grade from './models/Grade.js';
import Class from './models/Class.js';
import Subject from './models/Subject.js';
import Homework from './models/Homework.js';
import Announcement from './models/Announcement.js';
import Attendance from './models/Attendance.js';
import Message from './models/Message.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Import avatars for student assignment
const allAvatars = [
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
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Lily&primaryColor=f472b6,c084fc&secondaryColor=f9a8d4,e9d5ff`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Zoe&primaryColor=a78bfa,60a5fa&secondaryColor=d8b4fe,bfdbfe`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Mia&primaryColor=22d3ee,34d399&secondaryColor=a5f3fc,a7f3d0`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Ava&primaryColor=f87171,fb923c&secondaryColor=fecaca,fed7aa`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Sophie&primaryColor=e879f9,d946ef&secondaryColor=f5d0fe,f0abfc`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Isabella&primaryColor=fbbf24,f59e0b&secondaryColor=fef08a,fde68a`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Grace&primaryColor=5eead4,2dd4bf&secondaryColor=99f6e4,5eead4`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Hannah&primaryColor=818cf8,a78bfa&secondaryColor=c7d2fe,d8b4fe`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Nora&primaryColor=f472b6,ec4899&secondaryColor=fbcfe8,fce7f3`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Layla&primaryColor=6ee7b7,34d399&secondaryColor=a7f3d0,6ee7b7`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Aria&primaryColor=7dd3fc,38bdf8&secondaryColor=e0f2fe,bae6fd`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Ella&primaryColor=c4b5fd,a78bfa&secondaryColor=e0e7ff,d8b4fe`,
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Scarlett&primaryColor=fb7185,f43f5e&secondaryColor=fecdd3,ffdde1`,
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edcon');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Grade.deleteMany({});
    await Class.deleteMany({});
    await Subject.deleteMany({});
    await Homework.deleteMany({});
    await Announcement.deleteMany({});
    await Attendance.deleteMany({});
    await Message.deleteMany({});

    console.log('Cleared existing data');

    // Create Classes (Grades 1-12)
    const classes = [
        { id: 'G1A', name: 'Grade 1A' },
        { id: 'G1B', name: 'Grade 1B' },
        { id: 'G2A', name: 'Grade 2A' },
        { id: 'G2B', name: 'Grade 2B' },
        { id: 'G3A', name: 'Grade 3A' },
        { id: 'G3B', name: 'Grade 3B' },
        { id: 'G4A', name: 'Grade 4A' },
        { id: 'G4B', name: 'Grade 4B' },
        { id: 'G5A', name: 'Grade 5A' },
        { id: 'G5B', name: 'Grade 5B' },
        { id: 'G6A', name: 'Grade 6A' },
        { id: 'G6B', name: 'Grade 6B' },
        { id: 'G7A', name: 'Grade 7A' },
        { id: 'G7B', name: 'Grade 7B' },
        { id: 'G8A', name: 'Grade 8A' },
        { id: 'G8B', name: 'Grade 8B' },
        { id: 'G9A', name: 'Grade 9A' },
        { id: 'G9B', name: 'Grade 9B' },
        { id: 'G10A', name: 'Grade 10A' },
        { id: 'G10B', name: 'Grade 10B' },
        { id: 'G11A', name: 'Grade 11A' },
        { id: 'G11B', name: 'Grade 11B' },
        { id: 'G12A', name: 'Grade 12A' },
        { id: 'G12B', name: 'Grade 12B' },
    ];

    // Create Subjects
    const subjects = [
        { id: 'MATH', name: 'Mathematics' },
        { id: 'SCI', name: 'Science' },
        { id: 'ENG', name: 'English' },
        { id: 'HIST', name: 'History' },
        { id: 'GEO', name: 'Geography' },
        { id: 'ART', name: 'Art' },
        { id: 'MUSIC', name: 'Music' },
        { id: 'PE', name: 'Physical Education' },
        { id: 'COMP', name: 'Computer Science' },
        { id: 'PHYS', name: 'Physics' },
        { id: 'CHEM', name: 'Chemistry' },
        { id: 'BIO', name: 'Biology' },
        { id: 'LIT', name: 'Literature' },
        { id: 'LANG', name: 'Foreign Languages' },
    ];

    // Create Teachers
    const teachers = [
        { id: 'T001', name: 'Dr. Sarah Johnson', role: 'teacher', subject: 'Mathematics', classIds: ['G9A', 'G9B', 'G10A', 'G10B', 'G11A', 'G11B'], avatar: '' },
        { id: 'T002', name: 'Mr. Michael Chen', role: 'teacher', subject: 'Physics', classIds: ['G11A', 'G11B', 'G12A', 'G12B'], avatar: '' },
        { id: 'T003', name: 'Ms. Emily Rodriguez', role: 'teacher', subject: 'English', classIds: ['G7A', 'G7B', 'G8A', 'G8B', 'G9A', 'G9B'], avatar: '' },
        { id: 'T004', name: 'Dr. James Wilson', role: 'teacher', subject: 'Chemistry', classIds: ['G10A', 'G10B', 'G11A', 'G11B'], avatar: '' },
        { id: 'T005', name: 'Mrs. Lisa Thompson', role: 'teacher', subject: 'Biology', classIds: ['G9A', 'G9B', 'G10A', 'G10B'], avatar: '' },
        { id: 'T006', name: 'Mr. David Kim', role: 'teacher', subject: 'Computer Science', classIds: ['G8A', 'G8B', 'G9A', 'G9B', 'G10A', 'G10B'], avatar: '' },
        { id: 'T007', name: 'Ms. Amanda Foster', role: 'teacher', subject: 'History', classIds: ['G6A', 'G6B', 'G7A', 'G7B', 'G8A', 'G8B'], avatar: '' },
        { id: 'T008', name: 'Mr. Robert Martinez', role: 'teacher', subject: 'Geography', classIds: ['G5A', 'G5B', 'G6A', 'G6B'], avatar: '' },
        { id: 'T009', name: 'Ms. Jennifer Lee', role: 'teacher', subject: 'Art', classIds: ['G1A', 'G1B', 'G2A', 'G2B', 'G3A', 'G3B'], avatar: '' },
        { id: 'T010', name: 'Mr. Christopher Brown', role: 'teacher', subject: 'Music', classIds: ['G4A', 'G4B', 'G5A', 'G5B'], avatar: '' },
        { id: 'T011', name: 'Mrs. Patricia Davis', role: 'teacher', subject: 'Physical Education', classIds: ['G1A', 'G1B', 'G2A', 'G2B', 'G3A', 'G3B', 'G4A', 'G4B'], avatar: '' },
        { id: 'T012', name: 'Dr. Thomas Anderson', role: 'teacher', subject: 'Literature', classIds: ['G11A', 'G11B', 'G12A', 'G12B'], avatar: '' },
        { id: 'T013', name: 'Ms. Rachel Green', role: 'teacher', subject: 'Foreign Languages', classIds: ['G7A', 'G7B', 'G8A', 'G8B', 'G9A', 'G9B'], avatar: '' },
        { id: 'T014', name: 'Mr. Kevin White', role: 'teacher', subject: 'Science', classIds: ['G5A', 'G5B', 'G6A', 'G6B'], avatar: '' },
        { id: 'T015', name: 'Mrs. Nancy Clark', role: 'teacher', subject: 'Mathematics', classIds: ['G7A', 'G7B', 'G8A', 'G8B'], avatar: '' },
    ];

    // Create Parents (50 parents)
    const parents = [];
    for (let i = 1; i <= 50; i++) {
        parents.push({
            id: `P${String(i).padStart(3, '0')}`,
            name: `Parent ${i}`,
            role: 'parent',
            childrenIds: [],
            avatar: ''
        });
    }

    // Create Students (200 students across all classes)
    const students = [];
    const firstNames = ['Ahmed', 'Fatima', 'Yusuf', 'Aisha', 'Omar', 'Layla', 'Hassan', 'Nour', 'Ali', 'Zara', 'Khalid', 'Maya', 'Ibrahim', 'Sara', 'Mustafa', 'Amina', 'Zain', 'Nadia', 'Karim', 'Lina', 'Tariq', 'Rania', 'Samir', 'Dana', 'Rashid', 'Yara', 'Malik', 'Hana', 'Jamil', 'Nora', 'Faris', 'Leila', 'Waleed', 'Mira', 'Tamer', 'Rima', 'Bassam', 'Sana', 'Kareem', 'Lama', 'Ziad', 'Tara', 'Nabil', 'Raya', 'Wassim', 'Naya', 'Hadi', 'Lara', 'Rami', 'Maya', 'Tarek'];
    const lastNames = ['Al-Zahra', 'Al-Rashid', 'Al-Mahmoud', 'Al-Sayed', 'Al-Nasser', 'Al-Hassan', 'Al-Amin', 'Al-Khalil', 'Al-Rahman', 'Al-Mustafa', 'Al-Hamza', 'Al-Qasim', 'Al-Yasin', 'Al-Taha', 'Al-Waleed', 'Al-Faris', 'Al-Kareem', 'Al-Nabil', 'Al-Hadi', 'Al-Rami', 'Al-Tarek', 'Al-Wassim', 'Al-Ziad', 'Al-Karim', 'Al-Bassam', 'Al-Tamer', 'Al-Waleed', 'Al-Faris', 'Al-Kareem', 'Al-Nabil', 'Al-Hadi', 'Al-Rami', 'Al-Tarek', 'Al-Wassim', 'Al-Ziad', 'Al-Karim', 'Al-Bassam', 'Al-Tamer', 'Al-Waleed', 'Al-Faris', 'Al-Kareem', 'Al-Nabil', 'Al-Hadi', 'Al-Rami', 'Al-Tarek', 'Al-Wassim', 'Al-Ziad', 'Al-Karim', 'Al-Bassam', 'Al-Tamer', 'Al-Waleed', 'Al-Faris'];

    let studentId = 1;
    classes.forEach((classInfo, classIndex) => {
        const studentsPerClass = Math.floor(Math.random() * 8) + 12; // 12-20 students per class
        for (let i = 0; i < studentsPerClass; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const parentId = `P${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`;
            
            students.push({
                id: `S${String(studentId).padStart(3, '0')}`,
                name: `${firstName} ${lastName}`,
                role: 'student',
                classId: classInfo.id,
                parentId: parentId,
                avatar: allAvatars[Math.floor(Math.random() * allAvatars.length)]
            });
            
            // Add student to parent's childrenIds
            const parent = parents.find(p => p.id === parentId);
            if (parent) {
                parent.childrenIds.push(`S${String(studentId).padStart(3, '0')}`);
            }
            
            studentId++;
        }
    });

    // Create Admin
    const admin = { id: 'admin', name: 'Admin User', role: 'admin', avatar: '' };
    
    // Save all data to database
    await Class.insertMany(classes);
    await Subject.insertMany(subjects);
    await User.insertMany([...parents, ...students, ...teachers, admin]);

    console.log(`Created ${classes.length} classes, ${subjects.length} subjects, ${teachers.length} teachers, ${parents.length} parents, ${students.length} students`);

    // Generate comprehensive grades data (1000+ grades)
    const grades = [];
    const assignmentTypes = ['Quiz', 'Test', 'Homework', 'Project', 'Exam', 'Lab Report', 'Essay', 'Presentation'];
    const subjectsList = ['Mathematics', 'Physics', 'English', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education', 'Literature', 'Foreign Languages', 'Science'];
    
    // Generate grades for the past year
    const startDate = new Date('2024-09-01');
    const endDate = new Date('2025-06-30');
    
    students.forEach(student => {
        // Each student gets 15-25 grades per year
        const numGrades = Math.floor(Math.random() * 11) + 15;
        
        for (let i = 0; i < numGrades; i++) {
            const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
            const subject = subjectsList[Math.floor(Math.random() * subjectsList.length)];
            const assignmentType = assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)];
            const assignmentName = `${assignmentType} ${Math.floor(Math.random() * 20) + 1}`;
            
            // Generate realistic grades (bell curve distribution)
            let marksObtained;
            const rand = Math.random();
            if (rand < 0.1) marksObtained = Math.floor(Math.random() * 20) + 50; // 50-69 (D)
            else if (rand < 0.3) marksObtained = Math.floor(Math.random() * 20) + 70; // 70-89 (C)
            else if (rand < 0.7) marksObtained = Math.floor(Math.random() * 20) + 80; // 80-99 (B)
            else marksObtained = Math.floor(Math.random() * 20) + 85; // 85-104 (A)
            
            marksObtained = Math.min(marksObtained, 100); // Cap at 100
            
            const maxMarks = 100;
            const type = assignmentType.toLowerCase().replace(' ', '');
            
            // Map assignment types to valid enum values
            let validType;
            switch (type) {
                case 'labreport':
                    validType = 'project';
                    break;
                case 'essay':
                    validType = 'homework';
                    break;
                case 'presentation':
                    validType = 'project';
                    break;
                default:
                    validType = type;
            }
            
            grades.push({
                studentId: student.id,
                subject: subject,
                assignment: assignmentName,
                marksObtained: marksObtained,
                maxMarks: maxMarks,
                date: randomDate.toISOString(),
                type: validType
            });
        }
    });

    await Grade.insertMany(grades);
    console.log(`Created ${grades.length} grades`);

    // Generate comprehensive homework data
    const homeworks = [];
    const homeworkTitles = [
        'Algebra Chapter 5 Exercises', 'Physics Lab Report', 'English Essay', 'Chemistry Quiz',
        'Biology Project', 'Computer Science Assignment', 'History Research Paper', 'Geography Map Study',
        'Art Portfolio', 'Music Theory Test', 'Physical Education Log', 'Literature Analysis',
        'Foreign Language Practice', 'Science Experiment Report', 'Mathematics Problem Set'
    ];
    const homeworkSubjects = ['Mathematics', 'Physics', 'English', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography', 'Art', 'Music', 'Physical Education', 'Literature', 'Foreign Languages', 'Science'];
    
    // Generate homeworks for the past year
    const homeworkStartDate = new Date('2024-09-01');
    const homeworkEndDate = new Date('2025-06-30');
    
    let homeworkCounter = 1;
    teachers.forEach(teacher => {
        // Each teacher assigns 20-30 homeworks per year
        const numHomeworks = Math.floor(Math.random() * 11) + 20;
        
        for (let i = 0; i < numHomeworks; i++) {
            const assignedDate = new Date(homeworkStartDate.getTime() + Math.random() * (homeworkEndDate.getTime() - homeworkStartDate.getTime()));
            const dueDate = new Date(assignedDate.getTime() + (Math.random() * 14 + 3) * 24 * 60 * 60 * 1000); // 3-17 days later
            const title = homeworkTitles[Math.floor(Math.random() * homeworkTitles.length)];
            const subject = homeworkSubjects[Math.floor(Math.random() * homeworkSubjects.length)];
            
            // Randomly select some students to have submitted
            const submittedStudents = students.filter(() => Math.random() < 0.3).map(s => s.id);
            
            homeworks.push({
                id: `HW${homeworkCounter.toString().padStart(4, '0')}`,
                title: title,
                subject: subject,
                dueDate: dueDate.toISOString().split('T')[0],
                assignedDate: assignedDate.toISOString().split('T')[0],
                teacherId: teacher.id,
                submitted: submittedStudents
            });
            homeworkCounter++;
        }
    });

    await Homework.insertMany(homeworks);
    console.log(`Created ${homeworks.length} homeworks`);

    // Generate comprehensive announcement data
    const announcements = [];
    const announcementTitles = [
        'Parent-Teacher Meeting', 'Science Fair', 'Sports Day', 'Art Exhibition',
        'Music Concert', 'Academic Awards Ceremony', 'Field Trip', 'Exam Schedule',
        'Holiday Notice', 'Library Week', 'Career Day', 'Cultural Festival',
        'Technology Workshop', 'Environmental Awareness', 'Health and Safety'
    ];
    const announcementContents = [
        'Please attend the upcoming parent-teacher meeting to discuss your child\'s progress.',
        'The annual science fair is approaching. Encourage your children to participate.',
        'Sports day will be held next month. All students are encouraged to participate.',
        'The art exhibition will showcase student artwork from the past semester.',
        'The music concert will feature performances from all grade levels.',
        'Academic awards ceremony will recognize outstanding student achievements.',
        'Field trip to the museum has been scheduled for next week.',
        'Exam schedule has been updated. Please check the notice board.',
        'School will be closed for the upcoming holiday.',
        'Library week will feature special activities and book fairs.',
        'Career day will help students explore different professions.',
        'Cultural festival will celebrate diversity and traditions.',
        'Technology workshop will introduce new learning tools.',
        'Environmental awareness campaign will focus on sustainability.',
        'Health and safety guidelines have been updated.'
    ];
    
    // Generate announcements for the past year
    const announcementStartDate = new Date('2024-09-01');
    const announcementEndDate = new Date('2025-06-30');
    
    let announcementCounter = 1;
    teachers.forEach(teacher => {
        // Each teacher posts 15-25 announcements per year
        const numAnnouncements = Math.floor(Math.random() * 11) + 15;
        
        for (let i = 0; i < numAnnouncements; i++) {
            const randomDate = new Date(announcementStartDate.getTime() + Math.random() * (announcementEndDate.getTime() - announcementStartDate.getTime()));
            const title = announcementTitles[Math.floor(Math.random() * announcementTitles.length)];
            const content = announcementContents[Math.floor(Math.random() * announcementContents.length)];
            const priority = Math.random() < 0.2 ? 'high' : Math.random() < 0.5 ? 'medium' : 'low';
            
            announcements.push({
                id: `AN${announcementCounter.toString().padStart(4, '0')}`,
                title: title,
                content: content,
                date: randomDate.toISOString().split('T')[0],
                teacherId: teacher.id,
                priority: priority
            });
            announcementCounter++;
        }
    });

    await Announcement.insertMany(announcements);
    console.log(`Created ${announcements.length} announcements`);

    // Generate comprehensive attendance data
    const attendanceRecords = [];
    const attendanceStatuses = ['present', 'absent', 'late'];
    
    // Generate attendance for the past year (school days only)
    const attendanceStartDate = new Date('2024-09-01');
    const attendanceEndDate = new Date('2025-06-30');
    
    students.forEach(student => {
        // Generate attendance for each school day
        let currentDate = new Date(attendanceStartDate);
        
        while (currentDate <= attendanceEndDate) {
            // Skip weekends
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                // 95% attendance rate on average
                const status = Math.random() < 0.95 ? 'present' : Math.random() < 0.7 ? 'absent' : 'late';
                
                attendanceRecords.push({
                    date: currentDate.toISOString().split('T')[0],
                    studentId: student.id,
                    status: status
                });
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    await Attendance.insertMany(attendanceRecords);
    console.log(`Created ${attendanceRecords.length} attendance records`);

    // Generate comprehensive message data
    const messages = [];
    const messageContents = [
        'Hello, I wanted to discuss my child\'s progress.',
        'Thank you for the update on the homework assignment.',
        'Could you please clarify the exam schedule?',
        'My child will be absent tomorrow due to illness.',
        'I have a question about the upcoming project.',
        'Thank you for your help with the assignment.',
        'Could we schedule a meeting to discuss progress?',
        'I appreciate your feedback on the recent test.',
        'Is there anything I can do to help my child improve?',
        'Thank you for the detailed explanation.',
        'I have concerns about my child\'s performance.',
        'Could you provide more information about the curriculum?',
        'I would like to discuss the homework requirements.',
        'Thank you for your dedication to teaching.',
        'I have a question about the grading system.'
    ];
    
    // Generate messages for the past year
    const messageStartDate = new Date('2024-09-01');
    const messageEndDate = new Date('2025-06-30');
    
    // Generate messages between teachers and parents
    let messageCounter = 1;
    teachers.forEach(teacher => {
        // Each teacher sends 30-50 messages per year
        const numMessages = Math.floor(Math.random() * 21) + 30;
        
        for (let i = 0; i < numMessages; i++) {
            const randomDate = new Date(messageStartDate.getTime() + Math.random() * (messageEndDate.getTime() - messageStartDate.getTime()));
            const content = messageContents[Math.floor(Math.random() * messageContents.length)];
            
            // Randomly select a parent to send message to
            const parent = parents[Math.floor(Math.random() * parents.length)];
            
            messages.push({
                id: `M${messageCounter.toString().padStart(4, '0')}`,
                senderId: teacher.id,
                receiverId: parent.id,
                timestamp: randomDate.toISOString(),
                isRead: Math.random() < 0.8, // 80% read rate
                type: 'text',
                content: content
            });
            messageCounter++;
        }
    });

    await Message.insertMany(messages);
    console.log(`Created ${messages.length} messages`);

    console.log('Database seeded successfully with comprehensive school data!');
    console.log('\nTest Accounts:');
    console.log('Admin: admin');
    console.log('Teachers: T001-T015');
    console.log('Parents: P001-P050');
    console.log('Students: S001-S200+');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData(); 