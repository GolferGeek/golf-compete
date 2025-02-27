import { pgTable, text, integer, real, uuid, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  handicap: real('handicap'),
  profileImage: text('profile_image'),
  memberSince: timestamp('member_since').notNull().defaultNow(),
  password: text('password').notNull(), // Hashed password
});

// Competitions table
export const competitions = pgTable('competitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'series', 'event', 'daily'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(), // 'upcoming', 'active', 'completed'
  format: text('format').notNull(),
  prizes: text('prizes'), // JSON string
});

// Competition participants junction table
export const competitionParticipants = pgTable('competition_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  competitionId: uuid('competition_id').notNull().references(() => competitions.id),
  userId: uuid('user_id').notNull().references(() => users.id),
});

// Courses table
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  holes: integer('holes').notNull(),
  par: integer('par').notNull(),
  rating: real('rating').notNull(),
  slope: integer('slope').notNull(),
  amenities: text('amenities'), // JSON string
  website: text('website'),
  phoneNumber: text('phone_number'),
});

// Tee sets table
export const teeSets = pgTable('tee_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  name: text('name').notNull(),
  color: text('color').notNull(),
  rating: real('rating').notNull(),
  slope: integer('slope').notNull(),
  par: integer('par').notNull(),
  distance: integer('distance').notNull(),
});

// Rounds table
export const rounds = pgTable('rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  teeSetId: uuid('tee_set_id').notNull().references(() => teeSets.id),
  totalScore: integer('total_score').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  competitionId: uuid('competition_id').references(() => competitions.id),
  notes: text('notes'),
});

// Hole scores table
export const holeScores = pgTable('hole_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundId: uuid('round_id').notNull().references(() => rounds.id),
  holeNumber: integer('hole_number').notNull(),
  par: integer('par').notNull(),
  score: integer('score').notNull(),
  fairwayHit: boolean('fairway_hit'),
  greenInRegulation: boolean('green_in_regulation'),
  putts: integer('putts'),
  penaltyStrokes: integer('penalty_strokes'),
});

// Practice plans table
export const practicePlans = pgTable('practice_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  focusAreas: text('focus_areas').notNull(), // JSON string
  duration: integer('duration').notNull(),
  frequency: text('frequency').notNull(),
  notes: text('notes'),
});

// Drills table
export const drills = pgTable('drills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'putting', 'chipping', 'pitching', 'full swing', 'bunker', 'mental'
  difficulty: text('difficulty').notNull(), // 'beginner', 'intermediate', 'advanced'
  duration: integer('duration').notNull(),
  equipment: text('equipment'), // JSON string
  instructions: text('instructions').notNull(),
});

// Practice plan drills junction table
export const practicePlanDrills = pgTable('practice_plan_drills', {
  id: uuid('id').primaryKey().defaultRandom(),
  practicePlanId: uuid('practice_plan_id').notNull().references(() => practicePlans.id),
  drillId: uuid('drill_id').notNull().references(() => drills.id),
});

// Coaches table
export const coaches = pgTable('coaches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  credentials: text('credentials').notNull(), // JSON string
  specialties: text('specialties').notNull(), // JSON string
  experience: integer('experience').notNull(),
  hourlyRate: real('hourly_rate').notNull(),
  availability: text('availability').notNull(), // JSON string
});

// Lessons table
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  coachId: uuid('coach_id').notNull().references(() => coaches.id),
  studentId: uuid('student_id').notNull().references(() => users.id),
  date: timestamp('date').notNull(),
  duration: integer('duration').notNull(),
  focus: text('focus').notNull(),
  notes: text('notes'),
  followUpActions: text('follow_up_actions'), // JSON string
});

// Bags table
export const bags = pgTable('bags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Clubs table
export const clubs = pgTable('clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  type: text('type').notNull(), // driver, wood, hybrid, iron, wedge, putter
  loft: real('loft'),
  shaft: text('shaft'),
  flex: text('flex'),
  notes: text('notes'),
});

// BagClubs junction table
export const bagClubs = pgTable('bag_clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  bagId: uuid('bag_id').notNull().references(() => bags.id),
  clubId: uuid('club_id').notNull().references(() => clubs.id),
  inBagPosition: integer('in_bag_position'), // Optional position in the bag (1-14)
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  rounds: many(rounds),
  practicePlans: many(practicePlans),
  competitionsAsParticipant: many(competitionParticipants),
  lessonsAsStudent: many(lessons),
  bags: many(bags),
  clubs: many(clubs),
}));

export const competitionsRelations = relations(competitions, ({ many }) => ({
  participants: many(competitionParticipants),
  rounds: many(rounds),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  teeSets: many(teeSets),
  rounds: many(rounds),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  user: one(users, {
    fields: [rounds.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [rounds.courseId],
    references: [courses.id],
  }),
  teeSet: one(teeSets, {
    fields: [rounds.teeSetId],
    references: [teeSets.id],
  }),
  competition: one(competitions, {
    fields: [rounds.competitionId],
    references: [competitions.id],
  }),
  holeScores: many(holeScores),
}));

export const practicePlansRelations = relations(practicePlans, ({ one, many }) => ({
  user: one(users, {
    fields: [practicePlans.userId],
    references: [users.id],
  }),
  drills: many(practicePlanDrills),
}));

export const drillsRelations = relations(drills, ({ many }) => ({
  practicePlans: many(practicePlanDrills),
}));

export const coachesRelations = relations(coaches, ({ one, many }) => ({
  user: one(users, {
    fields: [coaches.userId],
    references: [users.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  coach: one(coaches, {
    fields: [lessons.coachId],
    references: [coaches.id],
  }),
  student: one(users, {
    fields: [lessons.studentId],
    references: [users.id],
  }),
}));

export const competitionParticipantsRelations = relations(competitionParticipants, ({ one }) => ({
  competition: one(competitions, {
    fields: [competitionParticipants.competitionId],
    references: [competitions.id],
  }),
  user: one(users, {
    fields: [competitionParticipants.userId],
    references: [users.id],
  }),
}));

export const teeSetsRelations = relations(teeSets, ({ one }) => ({
  course: one(courses, {
    fields: [teeSets.courseId],
    references: [courses.id],
  }),
}));

export const practicePlanDrillsRelations = relations(practicePlanDrills, ({ one }) => ({
  practicePlan: one(practicePlans, {
    fields: [practicePlanDrills.practicePlanId],
    references: [practicePlans.id],
  }),
  drill: one(drills, {
    fields: [practicePlanDrills.drillId],
    references: [drills.id],
  }),
}));

export const holeScoresRelations = relations(holeScores, ({ one }) => ({
  round: one(rounds, {
    fields: [holeScores.roundId],
    references: [rounds.id],
  }),
}));

// Add bag relations
export const bagsRelations = relations(bags, ({ one, many }) => ({
  user: one(users, {
    fields: [bags.userId],
    references: [users.id],
  }),
  clubs: many(bagClubs),
}));

// Add club relations
export const clubsRelations = relations(clubs, ({ one, many }) => ({
  user: one(users, {
    fields: [clubs.userId],
    references: [users.id],
  }),
  bags: many(bagClubs),
}));

// Add bagClubs relations
export const bagClubsRelations = relations(bagClubs, ({ one }) => ({
  bag: one(bags, {
    fields: [bagClubs.bagId],
    references: [bags.id],
  }),
  club: one(clubs, {
    fields: [bagClubs.clubId],
    references: [clubs.id],
  }),
})); 