package com.turnos.api.notifications;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NotificationConfig {

    @Bean
    @ConditionalOnMissingBean(NotificationService.class)
    NotificationService notificationService() {
        return new NoOpNotificationService();
    }
}
