# -*- coding: utf-8 -*-
import os
from datetime import datetime, timezone

BUILD_VERSION = "1.6.6"

def build():
    # Order of concatenation
    files_order = [
        "js/app/core/utils.js",
        "js/app/core/theme-service.js",
        "js/app/core/schema.js",
        "js/app/state/session-store.js",
        "js/app/state/autosave.js",
        "js/app/core/project-serializer.js",
        "js/app/state/project-store.js",
        "js/app/blocks/registry.js",
        "js/app/blocks/types/heading.js",
        "js/app/blocks/types/paragraph.js",
        "js/app/blocks/types/faq.js",
        "js/app/blocks/types/tabs.js",
        "js/app/render/render-article.js",
        "js/app/render/render-preview.js",
        "js/app/render/render-workspace.js",
        "js/app/export/export-json.js",
        "js/app/export/export-css.js",
        "js/app/export/export-html.js",
        "js/app/export/export-ocmod-xml.js",
        "js/app/export/export-ocmod-zip.js",
        "js/app/export/export-article-zip.js",
        "js/app/ui/modals.js",
        "js/app/ui/dropdowns.js",
        "js/app/ui/header-actions.js",
        "js/app/ui/mobile-layout.js",
        "js/app/ui/help-modal.js",
        "js/app/ui/ai-assistant.js",
        "js/app/ui/dragdrop.js",
        "js/app/bootstrap.js",
        "js/app/app-entry.js"
    ]
    
    concatenated_code = []
    
    for filepath in files_order:
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            return False
        
        print(f"Reading: {filepath}")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            concatenated_code.append(content)
            
    build_meta = {
        "version": BUILD_VERSION,
        "built_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    }

    build_meta_js = (
        "    window.CONTENT_CONSTRUCTOR_BUILD = {\n"
        f"        version: '{build_meta['version']}',\n"
        f"        builtAt: '{build_meta['built_at']}'\n"
        "    };\n\n"
    )

    # Wrap in IIFE
    final_output = "(function () {\n    'use strict';\n\n"
    final_output += build_meta_js
    for code in concatenated_code:
        final_output += code + "\n\n"
    final_output += "})();\n"
    
    output_path = "js/app.js"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(final_output)
        
    print(f"Successfully compiled {output_path}!")
    return True

if __name__ == "__main__":
    build()
