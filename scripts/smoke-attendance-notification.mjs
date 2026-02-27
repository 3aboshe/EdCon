import { prisma } from '../server/config/db.js';
import { signSessionToken } from '../server/utils/token.js';
import { getParentIdForStudent } from '../server/utils/notificationHelper.js';

const baseUrl = process.env.API_BASE_URL || 'http://localhost:5005';

function formatDateOnly(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function postAttendance(token, payload) {
  const response = await fetch(`${baseUrl}/api/attendance`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: response.status, ok: response.ok, data };
}

async function main() {
  console.log('🔎 Running attendance notification smoke test...');
  console.log(`🌐 API Base URL: ${baseUrl}`);

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing.');
  }

  const teacher = await prisma.user.findFirst({
    where: {
      role: 'TEACHER',
      schoolId: { not: null },
      schoolCode: { not: null },
    },
    select: {
      id: true,
      role: true,
      schoolId: true,
      schoolCode: true,
      name: true,
    },
  });

  if (!teacher) {
    throw new Error('No teacher found with school context.');
  }

  const student = await prisma.user.findFirst({
    where: {
      role: 'STUDENT',
      schoolId: teacher.schoolId,
      OR: [
        { parentId: { not: null } },
        {
          parentId: null,
          parent: {
            is: null,
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      classId: true,
      parentId: true,
    },
  });

  if (!student || !student.classId) {
    throw new Error('No student with class found in teacher school.');
  }

  const resolvedParentId = await getParentIdForStudent(student.id);
  if (!resolvedParentId) {
    throw new Error(`No parent mapping resolved for student ${student.id}.`);
  }

  const token = signSessionToken(teacher);
  const date = formatDateOnly(new Date());

  const presentPayload = {
    date,
    studentId: student.id,
    status: 'PRESENT',
    classId: student.classId,
    teacherId: teacher.id,
  };

  const absentPayload = {
    ...presentPayload,
    status: 'ABSENT',
  };

  console.log('\n🧪 Step 1: create attendance as PRESENT');
  const createResult = await postAttendance(token, presentPayload);
  console.log('Result:', createResult.status, createResult.ok ? 'OK' : 'FAILED');
  if (!createResult.ok) {
    console.log('Response:', createResult.data);
    throw new Error('Create attendance request failed.');
  }

  console.log('\n🧪 Step 2: update same attendance to ABSENT (via POST upsert)');
  const updateResult = await postAttendance(token, absentPayload);
  console.log('Result:', updateResult.status, updateResult.ok ? 'OK' : 'FAILED');
  if (!updateResult.ok) {
    console.log('Response:', updateResult.data);
    throw new Error('Update attendance request failed.');
  }

  const dateAtMidnight = new Date(date);
  dateAtMidnight.setHours(0, 0, 0, 0);

  const finalAttendance = await prisma.attendance.findFirst({
    where: {
      date: dateAtMidnight,
      studentId: student.id,
      classId: student.classId,
      schoolId: teacher.schoolId,
    },
    select: {
      id: true,
      status: true,
      studentId: true,
      teacherId: true,
      classId: true,
      updatedAt: true,
    },
  });

  console.log('\n📌 Recipient sanity check');
  console.log(`Teacher ID: ${teacher.id}`);
  console.log(`Resolved parent ID: ${resolvedParentId}`);
  console.log(`Student ID: ${student.id}`);
  console.log(`Parent equals teacher? ${resolvedParentId === teacher.id ? 'YES (BUG)' : 'NO (EXPECTED)'}`);

  console.log('\n📌 Final attendance state');
  console.log(finalAttendance || 'No attendance row found');

  if (!finalAttendance || finalAttendance.status !== 'ABSENT') {
    throw new Error('Expected final attendance status to be ABSENT.');
  }

  console.log('\n✅ Smoke test completed successfully.');
  console.log('Check server logs for notification dispatch attempts to the parent user ID above.');
}

main()
  .catch((error) => {
    console.error('\n❌ Smoke test failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
