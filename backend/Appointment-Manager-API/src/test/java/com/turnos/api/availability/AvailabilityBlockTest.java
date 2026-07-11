package com.turnos.api.availability;

import com.turnos.api.professionals.Professional;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class AvailabilityBlockTest {

    @Test
    void validatesRangeAndBlockingBehavior() {
        AvailabilityBlock block = new AvailabilityBlock(
                new Professional("Professional", "pro@email.com", "123"),
                LocalDateTime.of(2027, 5, 24, 12, 0),
                LocalDateTime.of(2027, 5, 24, 14, 0),
                "Lunch",
                AvailabilityBlockType.MANUAL_BLOCK
        );

        assertThat(block.hasValidRange()).isTrue();
        assertThat(block.blocksDateTime(LocalDateTime.of(2027, 5, 24, 13, 0))).isTrue();
        assertThat(block.blocksDateTime(LocalDateTime.of(2027, 5, 24, 14, 0))).isFalse();
        assertThat(block.blocksRange(
                LocalDateTime.of(2027, 5, 24, 13, 30),
                LocalDateTime.of(2027, 5, 24, 14, 30)
        )).isTrue();

        block.deactivate();

        assertThat(block.blocksRange(
                LocalDateTime.of(2027, 5, 24, 13, 30),
                LocalDateTime.of(2027, 5, 24, 14, 30)
        )).isFalse();
    }
}
