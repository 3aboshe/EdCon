import admin from 'firebase-admin';
import { prisma } from '../config/db.js';

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

function initializeFirebase() {
    if (firebaseInitialized) return;

    try {
        // Check for service account in environment variable
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (serviceAccountJson) {
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            firebaseInitialized = true;
            console.log('✅ Firebase Admin SDK initialized from environment variable');
        } else {
            console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_JSON not set. Push notifications disabled.');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    }
}

// Initialize on module load
initializeFirebase();

// Notification text translations
const notificationTexts = {
    announcement: {
        en: { title: 'New Announcement', body: 'A new announcement has been posted: {title}' },
        ar: { title: 'إعلان جديد', body: 'تم نشر إعلان جديد: {title}' },
        ckb: { title: 'ڕاگەیاندنی نوێ', body: 'ڕاگەیاندنێکی نوێ بڵاوکرایەوە: {title}' },
        bhn: { title: 'راگەیاندنا نوێ', body: 'راگەیاندنەکا نوێ ھاتە بڵاڤکرن: {title}' },
        arc: { title: 'ܡܘܕܥܢܘܬܐ ܚܕܬܐ', body: 'ܡܘܕܥܢܘܬܐ ܚܕܬܐ ܐܬܦܪܣܬ: {title}' }
    },
    attendance: {
        en: {
            title: 'Attendance Recorded',
            body: '{studentName} was marked {status} today'
        },
        ar: {
            title: 'تم تسجيل الحضور',
            body: 'تم تسجيل {studentName} {status} اليوم'
        },
        ckb: {
            title: 'ئامادەبوون تۆمارکرا',
            body: '{studentName} ئەمڕۆ وەک {status} تۆمارکرا'
        },
        bhn: {
            title: 'ئامادەبوون ھاتە تۆمارکرن',
            body: '{studentName} ئەڤڕۆ وەکی {status} ھاتە تۆمارکرن'
        },
        arc: {
            title: 'ܐܬܟܬܒ ܚܙܘܪܐ',
            body: '{studentName} ܐܬܪܫܡ {status} ܝܘܡܢܐ'
        }
    },
    homework: {
        en: { title: 'New Homework', body: 'New homework assigned: {title}' },
        ar: { title: 'واجب جديد', body: 'تم تكليف واجب جديد: {title}' },
        ckb: { title: 'ئەرکی ماڵەوەی نوێ', body: 'ئەرکی ماڵەوەی نوێ دانرا: {title}' },
        bhn: { title: 'ئەرکێ ماڵێ نوێ', body: 'ئەرکێ ماڵێ نوێ ھاتە دانان: {title}' },
        arc: { title: 'ܫܘܓܠܐ ܕܒܝܬܐ ܚܕܬܐ', body: 'ܫܘܓܠܐ ܕܒܝܬܐ ܚܕܬܐ ܐܬܦܩܕ: {title}' }
    },
    exam: {
        en: { title: 'New Exam Scheduled', body: 'A new exam has been scheduled: {title}' },
        ar: { title: 'امتحان جديد', body: 'تم جدولة امتحان جديد: {title}' },
        ckb: { title: 'تاقیکردنەوەی نوێ', body: 'تاقیکردنەوەیەکی نوێ خولقێنرا: {title}' },
        bhn: { title: 'تاقیکرنا نوێ', body: 'تاقیکرنەکا نوێ ھاتە دیارکرن: {title}' },
        arc: { title: 'ܒܚܢܬܐ ܚܕܬܐ', body: 'ܒܚܢܬܐ ܚܕܬܐ ܐܬܩܒܥܬ: {title}' }
    },
    grade: {
        en: { title: 'New Grade Posted', body: '{studentName} received a grade in {subject}' },
        ar: { title: 'درجة جديدة', body: 'حصل {studentName} على درجة في {subject}' },
        ckb: { title: 'نمرەی نوێ', body: '{studentName} نمرەی وەرگرت لە {subject}' },
        bhn: { title: 'نمرەیا نوێ', body: '{studentName} نمرە وەرگرت ل {subject}' },
        arc: { title: 'ܕܪܓܐ ܚܕܬܐ', body: '{studentName} ܩܒܠ ܕܪܓܐ ܒ{subject}' }
    },
    message: {
        en: { title: 'New Message', body: 'You have a new message from {senderName}' },
        ar: { title: 'رسالة جديدة', body: 'لديك رسالة جديدة من {senderName}' },
        ckb: { title: 'نامەی نوێ', body: 'نامەیەکی نوێت ھەیە لە {senderName}' },
        bhn: { title: 'پەیاما نوێ', body: 'پەیامەکا نوێ ھەیە ژ {senderName}' },
        arc: { title: 'ܐܓܪܬܐ ܚܕܬܐ', body: 'ܐܝܬ ܠܟ ܐܓܪܬܐ ܚܕܬܐ ܡܢ {senderName}' }
    }
};

// Attendance status translations
const attendanceStatusTexts = {
    PRESENT: { en: 'present', ar: 'حاضر', ckb: 'ئامادە', bhn: 'ئامادە', arc: 'ܚܙܝܪ' },
    ABSENT: { en: 'absent', ar: 'غائب', ckb: 'نەھاتوو', bhn: 'نەھاتی', arc: 'ܓܝܒ' },
    LATE: { en: 'late', ar: 'متأخر', ckb: 'دواکەوتوو', bhn: 'دەرەنگ', arc: 'ܡܬܚܪ' }
};

/**
 * Get localized notification text
 */
function getLocalizedText(type, lang, params = {}) {
    const texts = notificationTexts[type];
    if (!texts) return { title: 'Notification', body: 'You have a new notification' };

    const langTexts = texts[lang] || texts['en'];

    let title = langTexts.title;
    let body = langTexts.body;

    // Replace placeholders
    for (const [key, value] of Object.entries(params)) {
        title = title.replace(`{${key}}`, value);
        body = body.replace(`{${key}}`, value);
    }

    return { title, body };
}

/**
 * Send push notification to a single user
 */
export async function sendNotificationToUser(userId, type, params = {}) {
    if (!firebaseInitialized) {
        console.log('Firebase not initialized, skipping notification');
        return false;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fcmToken: true, preferredLanguage: true, name: true }
        });

        if (!user?.fcmToken) {
            console.log(`No FCM token for user ${userId}, skipping notification`);
            return false;
        }

        const lang = user.preferredLanguage || 'en';
        const { title, body } = getLocalizedText(type, lang, params);

        const message = {
            token: user.fcmToken,
            notification: { title, body },
            data: { type, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) },
            android: {
                priority: 'high',
                notification: { sound: 'default' }
            },
            apns: {
                payload: {
                    aps: { sound: 'default', badge: 1 }
                }
            }
        };

        await admin.messaging().send(message);
        console.log(`✅ Notification sent to user ${userId}: ${type}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send notification to user ${userId}:`, error.message);
        return false;
    }
}

/**
 * Send notifications to multiple users
 */
export async function sendNotificationToUsers(userIds, type, params = {}) {
    if (!firebaseInitialized || !userIds.length) return;

    const results = await Promise.allSettled(
        userIds.map(userId => sendNotificationToUser(userId, type, params))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`Notifications sent: ${succeeded}/${userIds.length}`);
}

/**
 * Get parent IDs for students in specific classes
 */
export async function getParentIdsForClasses(schoolId, classIds) {
    const students = await prisma.user.findMany({
        where: {
            schoolId,
            role: 'STUDENT',
            classId: { in: classIds },
            parentId: { not: null }
        },
        select: { parentId: true }
    });

    return [...new Set(students.map(s => s.parentId).filter(Boolean))];
}

/**
 * Get parent ID for a specific student
 */
export async function getParentIdForStudent(studentId) {
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { parentId: true }
    });

    return student?.parentId;
}

/**
 * Get localized attendance status
 */
export function getLocalizedAttendanceStatus(status, lang) {
    return attendanceStatusTexts[status]?.[lang] || attendanceStatusTexts[status]?.['en'] || status;
}
