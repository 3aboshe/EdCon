import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, './.env') });

// Mock data for homework and announcements (since we don't have these models yet)
const generateActivityData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edcon');
    console.log('Connected to MongoDB');

    // Get existing users to find teachers
    const User = mongoose.model('User');
    const teachers = await User.find({ role: 'teacher' });
    const students = await User.find({ role: 'student' });

    console.log(`Found ${teachers.length} teachers and ${students.length} students`);

    // Generate homework assignments
    const homeworkAssignments = [
        // Mathematics
        { title: 'Algebra Chapter 5 Exercises', subject: 'Mathematics', dueDate: '2024-09-15', assignedDate: '2024-09-10', teacherId: 'T001' },
        { title: 'Geometry Proofs Practice', subject: 'Mathematics', dueDate: '2024-09-22', assignedDate: '2024-09-17', teacherId: 'T001' },
        { title: 'Calculus Derivatives', subject: 'Mathematics', dueDate: '2024-10-05', assignedDate: '2024-09-30', teacherId: 'T001' },
        { title: 'Statistics Project', subject: 'Mathematics', dueDate: '2024-10-12', assignedDate: '2024-10-07', teacherId: 'T015' },
        { title: 'Trigonometry Problems', subject: 'Mathematics', dueDate: '2024-10-19', assignedDate: '2024-10-14', teacherId: 'T015' },
        
        // Physics
        { title: 'Newton\'s Laws Lab Report', subject: 'Physics', dueDate: '2024-09-18', assignedDate: '2024-09-13', teacherId: 'T002' },
        { title: 'Electricity Circuit Design', subject: 'Physics', dueDate: '2024-10-02', assignedDate: '2024-09-27', teacherId: 'T002' },
        { title: 'Wave Properties Experiment', subject: 'Physics', dueDate: '2024-10-16', assignedDate: '2024-10-11', teacherId: 'T002' },
        
        // English
        { title: 'Shakespeare Sonnet Analysis', subject: 'English', dueDate: '2024-09-20', assignedDate: '2024-09-15', teacherId: 'T003' },
        { title: 'Modern Literature Essay', subject: 'English', dueDate: '2024-10-08', assignedDate: '2024-10-03', teacherId: 'T003' },
        { title: 'Creative Writing Assignment', subject: 'English', dueDate: '2024-10-25', assignedDate: '2024-10-20', teacherId: 'T003' },
        
        // Chemistry
        { title: 'Chemical Bonding Lab', subject: 'Chemistry', dueDate: '2024-09-25', assignedDate: '2024-09-20', teacherId: 'T004' },
        { title: 'Periodic Table Research', subject: 'Chemistry', dueDate: '2024-10-10', assignedDate: '2024-10-05', teacherId: 'T004' },
        { title: 'Acid-Base Reactions', subject: 'Chemistry', dueDate: '2024-10-30', assignedDate: '2024-10-25', teacherId: 'T004' },
        
        // Biology
        { title: 'Cell Structure Model', subject: 'Biology', dueDate: '2024-09-28', assignedDate: '2024-09-23', teacherId: 'T005' },
        { title: 'Ecosystem Field Study', subject: 'Biology', dueDate: '2024-10-15', assignedDate: '2024-10-10', teacherId: 'T005' },
        { title: 'Genetics Punnett Squares', subject: 'Biology', dueDate: '2024-11-05', assignedDate: '2024-10-31', teacherId: 'T005' },
        
        // Computer Science
        { title: 'Python Programming Basics', subject: 'Computer Science', dueDate: '2024-09-30', assignedDate: '2024-09-25', teacherId: 'T006' },
        { title: 'Web Development Project', subject: 'Computer Science', dueDate: '2024-10-20', assignedDate: '2024-10-15', teacherId: 'T006' },
        { title: 'Database Design Assignment', subject: 'Computer Science', dueDate: '2024-11-10', assignedDate: '2024-11-05', teacherId: 'T006' },
        
        // History
        { title: 'Ancient Civilizations Report', subject: 'History', dueDate: '2024-10-03', assignedDate: '2024-09-28', teacherId: 'T007' },
        { title: 'World War II Timeline', subject: 'History', dueDate: '2024-10-25', assignedDate: '2024-10-20', teacherId: 'T007' },
        { title: 'Historical Figure Biography', subject: 'History', dueDate: '2024-11-15', assignedDate: '2024-11-10', teacherId: 'T007' },
        
        // Geography
        { title: 'Climate Zones Research', subject: 'Geography', dueDate: '2024-10-07', assignedDate: '2024-10-02', teacherId: 'T008' },
        { title: 'World Map Project', subject: 'Geography', dueDate: '2024-10-28', assignedDate: '2024-10-23', teacherId: 'T008' },
        { title: 'Population Density Study', subject: 'Geography', dueDate: '2024-11-20', assignedDate: '2024-11-15', teacherId: 'T008' },
        
        // Art
        { title: 'Renaissance Art Analysis', subject: 'Art', dueDate: '2024-10-12', assignedDate: '2024-10-07', teacherId: 'T009' },
        { title: 'Modern Art Portfolio', subject: 'Art', dueDate: '2024-11-02', assignedDate: '2024-10-28', teacherId: 'T009' },
        { title: 'Sculpture Design Project', subject: 'Art', dueDate: '2024-11-25', assignedDate: '2024-11-20', teacherId: 'T009' },
        
        // Music
        { title: 'Classical Music Appreciation', subject: 'Music', dueDate: '2024-10-18', assignedDate: '2024-10-13', teacherId: 'T010' },
        { title: 'Composition Assignment', subject: 'Music', dueDate: '2024-11-08', assignedDate: '2024-11-03', teacherId: 'T010' },
        { title: 'Music History Timeline', subject: 'Music', dueDate: '2024-11-30', assignedDate: '2024-11-25', teacherId: 'T010' },
        
        // Literature
        { title: 'Shakespeare Play Analysis', subject: 'Literature', dueDate: '2024-10-22', assignedDate: '2024-10-17', teacherId: 'T012' },
        { title: 'Poetry Collection', subject: 'Literature', dueDate: '2024-11-12', assignedDate: '2024-11-07', teacherId: 'T012' },
        { title: 'Novel Character Study', subject: 'Literature', dueDate: '2024-12-05', assignedDate: '2024-11-30', teacherId: 'T012' },
        
        // Foreign Languages
        { title: 'Spanish Conversation Practice', subject: 'Foreign Languages', dueDate: '2024-10-26', assignedDate: '2024-10-21', teacherId: 'T013' },
        { title: 'French Grammar Exercises', subject: 'Foreign Languages', dueDate: '2024-11-18', assignedDate: '2024-11-13', teacherId: 'T013' },
        { title: 'Cultural Presentation', subject: 'Foreign Languages', dueDate: '2024-12-10', assignedDate: '2024-12-05', teacherId: 'T013' },
        
        // Science
        { title: 'Scientific Method Lab', subject: 'Science', dueDate: '2024-11-01', assignedDate: '2024-10-27', teacherId: 'T014' },
        { title: 'Ecosystem Diorama', subject: 'Science', dueDate: '2024-11-22', assignedDate: '2024-11-17', teacherId: 'T014' },
        { title: 'Weather Station Project', subject: 'Science', dueDate: '2024-12-15', assignedDate: '2024-12-10', teacherId: 'T014' },
    ];

    // Generate announcements
    const announcements = [
        // Academic Announcements
        { title: 'Parent-Teacher Conference Schedule', content: 'Parent-teacher conferences will be held on October 15-17. Please book your appointments through the school portal.', date: '2024-09-20', teacherId: 'T001', priority: 'high' },
        { title: 'Midterm Exam Schedule', content: 'Midterm exams will begin on October 28th. Please check the exam schedule posted in your classrooms.', date: '2024-10-15', teacherId: 'T002', priority: 'high' },
        { title: 'Science Fair Registration', content: 'The annual science fair registration is now open. Projects are due by November 30th.', date: '2024-10-25', teacherId: 'T005', priority: 'medium' },
        { title: 'Math Competition', content: 'The school math competition will be held on November 10th. All students are encouraged to participate.', date: '2024-11-01', teacherId: 'T001', priority: 'medium' },
        { title: 'Literature Festival', content: 'Our annual literature festival will take place on December 5th. Students can submit their creative writing.', date: '2024-11-15', teacherId: 'T012', priority: 'medium' },
        
        // Administrative Announcements
        { title: 'School Calendar Update', content: 'The school will be closed on November 25-26 for Thanksgiving break.', date: '2024-11-20', teacherId: 'T007', priority: 'high' },
        { title: 'Library Hours Extended', content: 'The library will now be open until 6 PM on weekdays for study sessions.', date: '2024-10-10', teacherId: 'T003', priority: 'low' },
        { title: 'New Computer Lab Equipment', content: 'The computer lab has been upgraded with new equipment. Students can now access advanced software.', date: '2024-10-30', teacherId: 'T006', priority: 'medium' },
        { title: 'Art Gallery Opening', content: 'Student artwork will be displayed in the main hall gallery from December 1-15.', date: '2024-11-25', teacherId: 'T009', priority: 'low' },
        { title: 'Music Concert Rehearsals', content: 'Rehearsals for the winter concert will begin on November 20th. All music students must attend.', date: '2024-11-10', teacherId: 'T010', priority: 'medium' },
        
        // Sports and Activities
        { title: 'Basketball Team Tryouts', content: 'Basketball team tryouts will be held on October 5th and 6th. All interested students should sign up.', date: '2024-09-28', teacherId: 'T011', priority: 'medium' },
        { title: 'Swimming Competition', content: 'The inter-school swimming competition will be held on November 15th.', date: '2024-11-05', teacherId: 'T011', priority: 'medium' },
        { title: 'Track and Field Meet', content: 'The annual track and field meet will take place on December 10th.', date: '2024-11-30', teacherId: 'T011', priority: 'medium' },
        
        // Academic Support
        { title: 'Math Tutoring Available', content: 'Free math tutoring is available every Tuesday and Thursday after school in Room 205.', date: '2024-09-25', teacherId: 'T001', priority: 'medium' },
        { title: 'English Writing Workshop', content: 'Writing workshops will be held every Wednesday after school to help improve essay skills.', date: '2024-10-05', teacherId: 'T003', priority: 'medium' },
        { title: 'Science Study Group', content: 'Science study groups will meet every Friday to prepare for upcoming exams.', date: '2024-10-20', teacherId: 'T005', priority: 'medium' },
        
        // Technology and Innovation
        { title: 'Coding Club Meeting', content: 'The coding club will meet every Monday after school. All skill levels welcome.', date: '2024-09-30', teacherId: 'T006', priority: 'low' },
        { title: 'Robotics Competition', content: 'The robotics team will compete in the regional competition on December 20th.', date: '2024-12-01', teacherId: 'T006', priority: 'high' },
        { title: 'Digital Art Workshop', content: 'Digital art workshops will be held in the computer lab every Thursday.', date: '2024-10-15', teacherId: 'T009', priority: 'low' },
        
        // Cultural and International
        { title: 'International Food Festival', content: 'The international food festival will be held on November 30th. Students can bring traditional dishes.', date: '2024-11-20', teacherId: 'T013', priority: 'medium' },
        { title: 'Language Exchange Program', content: 'The language exchange program with our sister school begins on October 10th.', date: '2024-10-05', teacherId: 'T013', priority: 'medium' },
        { title: 'Cultural Heritage Day', content: 'Cultural heritage day will be celebrated on December 12th with performances and exhibits.', date: '2024-12-01', teacherId: 'T007', priority: 'medium' },
        
        // Health and Wellness
        { title: 'Mental Health Awareness Week', content: 'Mental health awareness week will be observed from November 18-22 with various activities.', date: '2024-11-15', teacherId: 'T011', priority: 'high' },
        { title: 'Nutrition Workshop', content: 'A nutrition workshop will be held on October 12th to promote healthy eating habits.', date: '2024-10-08', teacherId: 'T011', priority: 'low' },
        { title: 'Fitness Challenge', content: 'The school fitness challenge begins on November 1st. Track your daily activities.', date: '2024-10-25', teacherId: 'T011', priority: 'medium' },
        
        // Environmental Awareness
        { title: 'Recycling Initiative', content: 'The school recycling initiative begins on October 1st. Please use the new recycling bins.', date: '2024-09-28', teacherId: 'T014', priority: 'medium' },
        { title: 'Tree Planting Day', content: 'Tree planting day will be held on November 8th. Volunteers needed.', date: '2024-11-01', teacherId: 'T014', priority: 'low' },
        { title: 'Environmental Science Fair', content: 'The environmental science fair will showcase projects on December 18th.', date: '2024-12-05', teacherId: 'T014', priority: 'medium' },
    ];

    console.log(`Generated ${homeworkAssignments.length} homework assignments`);
    console.log(`Generated ${announcements.length} announcements`);
    
    // For now, we'll just log the data since we don't have Homework and Announcement models
    // In a real implementation, you would save this to the database
    console.log('\nSample Homework Assignments:');
    homeworkAssignments.slice(0, 5).forEach(hw => {
        console.log(`- ${hw.title} (${hw.subject}) - Due: ${hw.dueDate}`);
    });
    
    console.log('\nSample Announcements:');
    announcements.slice(0, 5).forEach(ann => {
        console.log(`- ${ann.title} (${ann.priority} priority) - ${ann.date}`);
    });

    console.log('\nActivity data generation completed!');
    console.log('Note: To save this data, you would need to create Homework and Announcement models.');
    
    process.exit(0);
  } catch (error) {
    console.error('Activity data generation error:', error);
    process.exit(1);
  }
};

generateActivityData(); 