package com.lumio.api.config;

import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class EnumConverters implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToContentStatus());
        registry.addConverter(new StringToVertical());
    }

    static class StringToContentStatus implements Converter<String, ContentStatus> {
        @Override
        public ContentStatus convert(@NonNull String source) {
            return ContentStatus.fromValue(source);
        }
    }

    static class StringToVertical implements Converter<String, Vertical> {
        @Override
        public Vertical convert(@NonNull String source) {
            return Vertical.fromValue(source);
        }
    }
}
