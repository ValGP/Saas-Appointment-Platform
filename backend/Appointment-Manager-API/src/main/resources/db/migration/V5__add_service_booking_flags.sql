ALTER TABLE services
    ADD COLUMN online_bookable BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE services
    ADD COLUMN requires_evaluation BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE services
SET online_bookable = FALSE
WHERE requires_evaluation = TRUE;
