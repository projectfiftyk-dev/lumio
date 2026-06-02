package com.lumio.api.service.mapper;

import com.lumio.api.domain.LumioCharacter;
import com.lumio.api.transfer.CharacterRequest;
import com.lumio.api.transfer.CharacterResponse;
import org.springframework.stereotype.Component;

@Component
public class CharacterMapper {

    public CharacterResponse toResponse(LumioCharacter character) {
        return new CharacterResponse(
                character.getId(),
                character.getPath().getId(),
                character.getSlug(),
                character.getName(),
                character.getDescription(),
                character.getPersonality(),
                character.getAvatarPath(),
                character.getVoiceId(),
                character.getCreatedAt(),
                character.getUpdatedAt()
        );
    }

    public void applyUpdate(LumioCharacter character, CharacterRequest request) {
        character.setSlug(request.slug());
        character.setName(request.name());
        character.setDescription(request.description());
        character.setPersonality(request.personality());
    }
}
