CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('pyq', 'mock', 'book');--> statement-breakpoint
CREATE TYPE "public"."test_attempt_status" AS ENUM('in_progress', 'submitted');--> statement-breakpoint
CREATE TABLE "bookmark_file" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '📌' NOT NULL,
	"color" text DEFAULT '#f97316' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmark_item" (
	"id" text PRIMARY KEY NOT NULL,
	"bookmark_file_id" text NOT NULL,
	"question_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapter" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo" text,
	"duration" integer DEFAULT 180 NOT NULL,
	"total_marks" integer DEFAULT 100 NOT NULL,
	"total_questions" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "exam_chapter" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"chapter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_subject" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" text PRIMARY KEY NOT NULL,
	"chapter_id" text NOT NULL,
	"content" text NOT NULL,
	"description" text,
	"image" text,
	"explanation" text,
	"explanation_image" text,
	"difficulty" "difficulty" DEFAULT 'medium' NOT NULL,
	"marks" numeric(4, 2) DEFAULT '1.00' NOT NULL,
	"negative_marks" numeric(4, 2) DEFAULT '0.25',
	"is_pyq" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_appearance" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"source_id" text NOT NULL,
	"test_section_id" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_option" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"option_text" text,
	"option_image" text,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_response" (
	"id" text PRIMARY KEY NOT NULL,
	"test_attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"chapter_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"selected_option_id" text,
	"correct_option_id" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"is_attempted" boolean DEFAULT false NOT NULL,
	"marks_awarded" numeric(6, 2) DEFAULT '0' NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"marked_for_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "source_type" NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"exam_id" text,
	"session_date" timestamp,
	"shift" integer,
	"author" text,
	"publisher" text,
	"edition" text,
	"isbn" text,
	"cover_image" text,
	"duration" integer,
	"total_questions" integer DEFAULT 0,
	"total_marks" numeric(8, 2) DEFAULT '0',
	"has_sectional_timing" boolean DEFAULT false,
	"instructions" text,
	"status" "source_status" DEFAULT 'draft' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "test_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source_id" text NOT NULL,
	"status" "test_attempt_status" DEFAULT 'in_progress' NOT NULL,
	"section_progress" jsonb DEFAULT '{}'::jsonb,
	"current_section_index" integer DEFAULT 0,
	"current_question_index" integer DEFAULT 0,
	"time_remaining" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"score" numeric(8, 2),
	"correct_count" integer,
	"incorrect_count" integer,
	"unattempted_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_attempt_section_result" (
	"id" text PRIMARY KEY NOT NULL,
	"test_attempt_id" text NOT NULL,
	"test_section_id" text NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"incorrect" integer DEFAULT 0 NOT NULL,
	"unattempted" integer DEFAULT 0 NOT NULL,
	"score" numeric(8, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_section" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"time_limit" integer,
	"marks" numeric(4, 2),
	"negative_marks" numeric(4, 2),
	"question_count" integer,
	"question_limit" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_section_subject" (
	"id" text PRIMARY KEY NOT NULL,
	"test_section_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "preferred_exam_id" text;--> statement-breakpoint
ALTER TABLE "bookmark_file" ADD CONSTRAINT "bookmark_file_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_item" ADD CONSTRAINT "bookmark_item_bookmark_file_id_bookmark_file_id_fk" FOREIGN KEY ("bookmark_file_id") REFERENCES "public"."bookmark_file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_item" ADD CONSTRAINT "bookmark_item_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter" ADD CONSTRAINT "chapter_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_chapter" ADD CONSTRAINT "exam_chapter_exam_id_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_chapter" ADD CONSTRAINT "exam_chapter_chapter_id_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subject" ADD CONSTRAINT "exam_subject_exam_id_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subject" ADD CONSTRAINT "exam_subject_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_chapter_id_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_appearance" ADD CONSTRAINT "question_appearance_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_appearance" ADD CONSTRAINT "question_appearance_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_appearance" ADD CONSTRAINT "question_appearance_test_section_id_test_section_id_fk" FOREIGN KEY ("test_section_id") REFERENCES "public"."test_section"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_option" ADD CONSTRAINT "question_option_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_response" ADD CONSTRAINT "question_response_test_attempt_id_test_attempt_id_fk" FOREIGN KEY ("test_attempt_id") REFERENCES "public"."test_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_response" ADD CONSTRAINT "question_response_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_response" ADD CONSTRAINT "question_response_chapter_id_chapter_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_response" ADD CONSTRAINT "question_response_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source" ADD CONSTRAINT "source_exam_id_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempt" ADD CONSTRAINT "test_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempt" ADD CONSTRAINT "test_attempt_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempt_section_result" ADD CONSTRAINT "test_attempt_section_result_test_attempt_id_test_attempt_id_fk" FOREIGN KEY ("test_attempt_id") REFERENCES "public"."test_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempt_section_result" ADD CONSTRAINT "test_attempt_section_result_test_section_id_test_section_id_fk" FOREIGN KEY ("test_section_id") REFERENCES "public"."test_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_section" ADD CONSTRAINT "test_section_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_section_subject" ADD CONSTRAINT "test_section_subject_test_section_id_test_section_id_fk" FOREIGN KEY ("test_section_id") REFERENCES "public"."test_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_section_subject" ADD CONSTRAINT "test_section_subject_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookmark_file_user_idx" ON "bookmark_file" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_file_user_name_idx" ON "bookmark_file" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "bookmark_item_file_idx" ON "bookmark_item" USING btree ("bookmark_file_id");--> statement-breakpoint
CREATE INDEX "bookmark_item_question_idx" ON "bookmark_item" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_item_unique_idx" ON "bookmark_item" USING btree ("bookmark_file_id","question_id");--> statement-breakpoint
CREATE INDEX "chapter_subject_idx" ON "chapter" USING btree ("subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chapter_slug_subject_idx" ON "chapter" USING btree ("slug","subject_id");--> statement-breakpoint
CREATE INDEX "exam_slug_idx" ON "exam" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "exam_chapter_exam_idx" ON "exam_chapter" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_chapter_chapter_idx" ON "exam_chapter" USING btree ("chapter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_chapter_unique_idx" ON "exam_chapter" USING btree ("exam_id","chapter_id");--> statement-breakpoint
CREATE INDEX "exam_subject_exam_idx" ON "exam_subject" USING btree ("exam_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_subject_unique_idx" ON "exam_subject" USING btree ("exam_id","subject_id");--> statement-breakpoint
CREATE INDEX "question_chapter_idx" ON "question" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "question_difficulty_idx" ON "question" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "question_is_pyq_idx" ON "question" USING btree ("is_pyq");--> statement-breakpoint
CREATE INDEX "qa_question_idx" ON "question_appearance" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "qa_source_idx" ON "question_appearance" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "qa_section_idx" ON "question_appearance" USING btree ("test_section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "qa_unique_idx" ON "question_appearance" USING btree ("question_id","source_id");--> statement-breakpoint
CREATE INDEX "option_question_idx" ON "question_option" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "qr_attempt_idx" ON "question_response" USING btree ("test_attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_attempt_question_idx" ON "question_response" USING btree ("test_attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "qr_subject_correct_idx" ON "question_response" USING btree ("subject_id","is_correct");--> statement-breakpoint
CREATE INDEX "qr_chapter_correct_idx" ON "question_response" USING btree ("chapter_id","is_correct");--> statement-breakpoint
CREATE INDEX "qr_attempt_subject_idx" ON "question_response" USING btree ("test_attempt_id","subject_id");--> statement-breakpoint
CREATE INDEX "source_type_idx" ON "source" USING btree ("type");--> statement-breakpoint
CREATE INDEX "source_exam_idx" ON "source" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "source_slug_idx" ON "source" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "source_pyq_unique_idx" ON "source" USING btree ("exam_id","session_date","shift");--> statement-breakpoint
CREATE INDEX "test_attempt_user_idx" ON "test_attempt" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_attempt_source_idx" ON "test_attempt" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "test_attempt_status_idx" ON "test_attempt" USING btree ("status");--> statement-breakpoint
CREATE INDEX "test_attempt_leaderboard_idx" ON "test_attempt" USING btree ("source_id","status","score");--> statement-breakpoint
CREATE INDEX "tasr_attempt_idx" ON "test_attempt_section_result" USING btree ("test_attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tasr_unique_idx" ON "test_attempt_section_result" USING btree ("test_attempt_id","test_section_id");--> statement-breakpoint
CREATE INDEX "test_section_source_idx" ON "test_section" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "test_section_order_idx" ON "test_section" USING btree ("source_id","order");--> statement-breakpoint
CREATE INDEX "tss_section_idx" ON "test_section_subject" USING btree ("test_section_id");--> statement-breakpoint
CREATE INDEX "tss_subject_idx" ON "test_section_subject" USING btree ("subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tss_unique_idx" ON "test_section_subject" USING btree ("test_section_id","subject_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_preferred_exam_id_exam_id_fk" FOREIGN KEY ("preferred_exam_id") REFERENCES "public"."exam"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "impersonated_by";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "banned";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "ban_reason";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "ban_expires";