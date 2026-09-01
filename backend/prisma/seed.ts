/**
 * Prisma Seed — Innovate To Escape Platform
 *
 * Seeds:
 *   - 5 TeamSets (Set 1 through Set 5)
 *   - 4 sample teams with Team Leads (memberOrder = 1)
 *   - Password scheme: teamname_last4ofregno (spaces stripped, all lowercase)
 *   - GameState initialized: activeEventNumber = 1, eventOpen = true
 *
 * RUN:  npm run seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Password generator
// Rule: strip spaces from team name, lowercase, append underscore + last 4
//       characters of the Team Lead's registration number.
// Example: "Neon Runners" + "24BCE1234" → "neonrunners_1234"
// ---------------------------------------------------------------------------
function generatePassword(teamName: string, registrationNumber: string): string {
  const normalizedName = teamName.replace(/\s+/g, '').toLowerCase();
  const last4 = registrationNumber.slice(-4);
  return `${normalizedName}_${last4}`;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SETS = ['Set 1', 'Set 2', 'Set 3', 'Set 4', 'Set 5'];

const TEAMS = [
  {
    teamName: 'Neon Runners',
    setName: 'Set 1',
    members: [
      { name: 'Alice R.', registrationNumber: '24BCE1234', memberOrder: 1 },
      { name: 'Bob K.',   registrationNumber: '24CSE5010', memberOrder: 2 },
    ],
  },
  {
    teamName: 'Byte Force',
    setName: 'Set 1',
    members: [
      { name: 'Chris M.', registrationNumber: '24CSE5678', memberOrder: 1 },
      { name: 'Diana P.',  registrationNumber: '24ECE4321', memberOrder: 2 },
      { name: 'Evan S.',   registrationNumber: '24CSE8888', memberOrder: 3 },
    ],
  },
  {
    teamName: 'Circuit Breakers',
    setName: 'Set 2',
    members: [
      { name: 'Cara M.', registrationNumber: '23ECE2222', memberOrder: 1 },
    ],
  },
  {
    teamName: 'Debug Squad',
    setName: 'Set 2',
    members: [
      { name: 'Dave T.',  registrationNumber: '22CSE9999', memberOrder: 1 },
      { name: 'Ellen K.', registrationNumber: '22CSE3333', memberOrder: 2 },
      { name: 'Frank O.', registrationNumber: '22ECE7777', memberOrder: 3 },
      { name: 'Grace L.', registrationNumber: '22BCE1111', memberOrder: 4 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱  Starting database seed...\n');

  // 1. Seed TeamSets
  const setMap = new Map<string, string>(); // name → id

  for (const setName of SETS) {
    const teamSet = await prisma.teamSet.upsert({
      where: { name: setName },
      update: {},
      create: { name: setName },
    });
    setMap.set(setName, teamSet.id);
    console.log(`  ✅  TeamSet: ${setName}`);
  }

  // 2. Seed Teams + TeamMembers
  for (const teamData of TEAMS) {
    const lead = teamData.members.find((m) => m.memberOrder === 1);
    if (!lead) {
      console.warn(`  ⚠️   No Team Lead found for "${teamData.teamName}" — skipping`);
      continue;
    }

    const rawPassword = generatePassword(teamData.teamName, lead.registrationNumber);
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    const setId = setMap.get(teamData.setName);

    const team = await prisma.team.upsert({
      where: { teamName: teamData.teamName },
      update: { passwordHash, setId },
      create: {
        teamName: teamData.teamName,
        passwordHash,
        setId,
      },
    });

    console.log(`\n  ✅  Team:     ${team.teamName}`);
    console.log(`     Set:      ${teamData.setName}`);
    console.log(`     Password: ${rawPassword}   (Lead: ${lead.name}, Reg: ${lead.registrationNumber})`);

    // Upsert members (delete and recreate to keep data fresh)
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } });

    for (const member of teamData.members) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          name: member.name,
          registrationNumber: member.registrationNumber,
          memberOrder: member.memberOrder,
        },
      });
      const label = member.memberOrder === 1 ? ' (Team Lead)' : '';
      console.log(`     Member ${member.memberOrder}: ${member.name}${label}`);
    }
  }

  // 3. Seed GameState
  await prisma.gameState.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      activeEventNumber: 1,
      eventOpen: true,
    },
  });
  console.log('\n  ✅  GameState: activeEventNumber=1, eventOpen=true');

  console.log('\n🎉  Seeding completed!\n');
  console.log('To open/close events via Neon SQL:');
  console.log('  UPDATE "GameState" SET "activeEventNumber" = 1, "eventOpen" = true  WHERE id = 1;');
  console.log('  UPDATE "GameState" SET "eventOpen" = false WHERE id = 1;\n');
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
