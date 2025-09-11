-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('HABIT', 'DAILY_TASK', 'TODO', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "public"."HabitType" AS ENUM ('GOOD', 'BAD');

-- CreateEnum
CREATE TYPE "public"."RecurrenceType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'EVERY_X_DAYS', 'EVERY_X_WEEKS', 'EVERY_X_MONTHS', 'WEEKLY_ON_DAYS', 'MONTHLY_ON_DAYS', 'WEEK_OF_MONTH_ON_DAYS');

-- CreateEnum
CREATE TYPE "public"."TimeRangeType" AS ENUM ('DAYS', 'WEEKS', 'MONTHS');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" VARCHAR(26) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "points" INTEGER NOT NULL DEFAULT 0,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" VARCHAR(26) NOT NULL,
    "user_id" VARCHAR(26) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "task_type" "public"."TaskType" NOT NULL,
    "importance" SMALLINT NOT NULL DEFAULT 1,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "habit_type" "public"."HabitType",
    "threshold_count" INTEGER,
    "time_range_value" INTEGER,
    "time_range_type" "public"."TimeRangeType",
    "last_completion_time" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "is_recurring" BOOLEAN NOT NULL DEFAULT true,
    "recurrence_type" "public"."RecurrenceType",
    "recurrence_interval" INTEGER,
    "recurrence_days_of_week" SMALLINT[],
    "recurrence_days_of_month" SMALLINT[],
    "recurrence_weeks_of_month" SMALLINT[],
    "current_consecutive_completed" INTEGER NOT NULL DEFAULT 0,
    "current_consecutive_missed" INTEGER NOT NULL DEFAULT 0,
    "max_consecutive_completed" INTEGER NOT NULL DEFAULT 0,
    "last_reset_at" TIMESTAMPTZ(6),
    "due_at" TIMESTAMPTZ(6),
    "is_overdue" BOOLEAN NOT NULL DEFAULT false,
    "progress" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "show_progress" BOOLEAN NOT NULL DEFAULT true,
    "target_completion_at" TIMESTAMPTZ(6),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."completion_history" (
    "id" VARCHAR(26) NOT NULL,
    "task_id" VARCHAR(26) NOT NULL,
    "completion_at" TIMESTAMPTZ(6) NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "completion_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."habit_completions" (
    "id" VARCHAR(26) NOT NULL,
    "task_id" VARCHAR(26) NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."milestones" (
    "id" VARCHAR(26) NOT NULL,
    "task_id" VARCHAR(26) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completion_at" TIMESTAMPTZ(6),
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_tasks_user_id" ON "public"."tasks"("user_id");

-- CreateIndex
CREATE INDEX "idx_tasks_type" ON "public"."tasks"("task_type");

-- CreateIndex
CREATE INDEX "idx_tasks_due_at" ON "public"."tasks"("due_at");

-- CreateIndex
CREATE INDEX "idx_completion_history_task_id" ON "public"."completion_history"("task_id");

-- CreateIndex
CREATE INDEX "idx_completion_history_date" ON "public"."completion_history"("completion_at");

-- CreateIndex
CREATE INDEX "idx_habit_completions_task_id" ON "public"."habit_completions"("task_id");

-- CreateIndex
CREATE INDEX "idx_habit_completions_date" ON "public"."habit_completions"("completed_at");

-- CreateIndex
CREATE INDEX "idx_milestones_task_id" ON "public"."milestones"("task_id");

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."completion_history" ADD CONSTRAINT "completion_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."habit_completions" ADD CONSTRAINT "habit_completions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."milestones" ADD CONSTRAINT "milestones_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
