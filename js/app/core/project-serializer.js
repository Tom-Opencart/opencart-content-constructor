/* ============================================================
   Content Constructor — core/project-serializer.js
   Сериализация и десериализация проекта (JSON <-> Object)
   ============================================================ */

function serializeProject(projectState, schemaSpec) {
    if (!projectState) return null;
    return {
        title: projectState.title || '',
        slug: projectState.slug || '',
        siteUrl: projectState.siteUrl || '',
        project: {
            siteUrl: projectState.siteUrl || ''
        },
        theme: {
            preset: (projectState.theme && projectState.theme.preset) || 'default',
            accent: (projectState.theme && projectState.theme.accent) || '#5446f8',
            bg: (projectState.theme && projectState.theme.bg) || '#F3F2FF',
            text: (projectState.theme && projectState.theme.text) || '#1A1A1A'
        },
        ai_specification: schemaSpec || {},
        blocks: projectState.blocks || []
    };
}

function extractJSONFromString(text) {
    text = text.trim();
    // 1. Try direct JSON parse
    try {
        return JSON.parse(text);
    } catch (e) {
        // Direct parse failed, continue extraction
    }

    // 2. Try to match comment CONSTRUCTOR_JSON (if embedded in HTML)
    const commentRegex = /<!--\s*CONSTRUCTOR_JSON:\s*([\s\S]*?)\s*-->/i;
    const commentMatch = text.match(commentRegex);
    if (commentMatch && commentMatch[1]) {
        try {
            return JSON.parse(commentMatch[1].trim());
        } catch (e) {
            // Ignore comment parse failure, try other matches
        }
    }

    // 3. Try to match markdown code block
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = text.match(codeBlockRegex);
    if (match && match[1]) {
        try {
            return JSON.parse(match[1].trim());
        } catch (e) {
            // If markdown parsing failed, try extracting from that match below
            text = match[1].trim();
        }
    }

    // 4. Fallback to extracting everything between the first { and the last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const extracted = text.substring(firstBrace, lastBrace + 1);
        try {
            return JSON.parse(extracted);
        } catch (e) {
            // Ignore failure, throw custom error below
        }
    }

    throw new Error('Не удалось извлечь корректный JSON из текста.');
}
