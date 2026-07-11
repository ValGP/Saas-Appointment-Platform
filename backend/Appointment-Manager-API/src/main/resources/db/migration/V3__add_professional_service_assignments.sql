ALTER TABLE professionals
    ADD COLUMN service_assignment_mode VARCHAR(30) NOT NULL DEFAULT 'ALL_SERVICES';

ALTER TABLE professionals
    ADD CONSTRAINT ck_professionals_service_assignment_mode
    CHECK (service_assignment_mode IN ('ALL_SERVICES', 'SELECTED_SERVICES'));

CREATE TABLE professional_services (
    professional_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_professional_services PRIMARY KEY (professional_id, service_id),
    CONSTRAINT fk_professional_services_professional FOREIGN KEY (professional_id) REFERENCES professionals (id),
    CONSTRAINT fk_professional_services_service FOREIGN KEY (service_id) REFERENCES services (id)
);

CREATE INDEX idx_professional_services_professional_id ON professional_services (professional_id);
CREATE INDEX idx_professional_services_service_id ON professional_services (service_id);
