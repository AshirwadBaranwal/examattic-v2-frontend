ALTER TABLE "test_section_subject" ADD COLUMN "marks" numeric(4, 2) DEFAULT '4.00';--> statement-breakpoint
ALTER TABLE "test_section_subject" ADD COLUMN "negative_marks" numeric(4, 2) DEFAULT '1.00';--> statement-breakpoint
ALTER TABLE "test_section_subject" ADD COLUMN "question_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "test_section_subject" ADD COLUMN "question_limit" integer;--> statement-breakpoint
ALTER TABLE "test_section" DROP COLUMN "marks";--> statement-breakpoint
ALTER TABLE "test_section" DROP COLUMN "negative_marks";--> statement-breakpoint
ALTER TABLE "test_section" DROP COLUMN "question_count";--> statement-breakpoint
ALTER TABLE "test_section" DROP COLUMN "question_limit";