import { z } from 'zod';

export const PrimaryGoalSchema = z.enum([
  'lose_fat',
  'build_muscle',
  'get_stronger',
  'improve_endurance',
  'general_fitness',
  'mobility',
]);
export type PrimaryGoal = z.infer<typeof PrimaryGoalSchema>;

export const ExperienceLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const PreferredStyleSchema = z.enum([
  'strength',
  'hypertrophy',
  'hiit',
  'calisthenics',
  'yoga_mobility',
  'mix',
]);
export type PreferredStyle = z.infer<typeof PreferredStyleSchema>;

export const SessionMinutesSchema = z.enum(['20-30', '30-45', '45-60', '60+']);
export type SessionMinutes = z.infer<typeof SessionMinutesSchema>;

export const TrainingLocationSchema = z.enum([
  'home_no_equipment',
  'home_with_equipment',
  'gym',
  'mix',
]);
export type TrainingLocation = z.infer<typeof TrainingLocationSchema>;

export const EquipmentSchema = z.enum([
  'dumbbells',
  'barbell',
  'kettlebell',
  'bands',
  'pullup_bar',
  'bench',
  'cable_machines',
  'cardio_machines',
]);
export type Equipment = z.infer<typeof EquipmentSchema>;

export const InjurySchema = z.enum([
  'none',
  'lower_back',
  'knee',
  'shoulder',
  'wrist',
  'neck',
  'hip',
  'ankle',
  'other',
]);
export type Injury = z.infer<typeof InjurySchema>;

export const SexAtBirthSchema = z.enum(['male', 'female']);
export type SexAtBirth = z.infer<typeof SexAtBirthSchema>;

export const ActivityLevelSchema = z.enum(['sedentary', 'light', 'moderate', 'very_active']);
export type ActivityLevel = z.infer<typeof ActivityLevelSchema>;

export const UnitsPreferenceSchema = z.enum(['metric', 'imperial']);
export type UnitsPreference = z.infer<typeof UnitsPreferenceSchema>;

export const ProfileSchema = z.object({
  primary_goal: PrimaryGoalSchema,
  experience_level: ExperienceLevelSchema,
  preferred_style: PreferredStyleSchema,
  days_per_week: z.number().int().min(2).max(6),
  session_minutes: SessionMinutesSchema,
  training_location: TrainingLocationSchema,
  available_equipment: z.array(EquipmentSchema).default([]),
  injuries: z.array(InjurySchema).default([]),
  injury_notes: z.string().max(500).nullable(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .refine((d) => {
      const parsed = Date.parse(d);
      if (Number.isNaN(parsed)) return false;
      const dob = new Date(parsed);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
      return dob > minAge && dob <= maxAge;
    }, 'Must be at least 13 years old'),
  sex_at_birth: SexAtBirthSchema,
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(300),
  activity_level: ActivityLevelSchema,
  units_preference: UnitsPreferenceSchema.default('metric'),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const PartialProfileSchema = ProfileSchema.partial().extend({
  units_preference: UnitsPreferenceSchema.default('metric'),
  onboarding_completed_at: z.string().nullable().optional(),
});
export type PartialProfile = z.infer<typeof PartialProfileSchema>;

export const FieldSchemas = {
  primary_goal: PrimaryGoalSchema,
  experience_level: ExperienceLevelSchema,
  preferred_style: PreferredStyleSchema,
  days_per_week: ProfileSchema.shape.days_per_week,
  session_minutes: SessionMinutesSchema,
  training_location: TrainingLocationSchema,
  available_equipment: ProfileSchema.shape.available_equipment,
  injuries: ProfileSchema.shape.injuries,
  injury_notes: ProfileSchema.shape.injury_notes,
  date_of_birth: ProfileSchema.shape.date_of_birth,
  sex_at_birth: SexAtBirthSchema,
  height_cm: ProfileSchema.shape.height_cm,
  weight_kg: ProfileSchema.shape.weight_kg,
  activity_level: ActivityLevelSchema,
} as const;
