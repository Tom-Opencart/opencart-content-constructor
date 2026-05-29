/* ============================================================
   Content Constructor — app.js
   ============================================================ */

(function () {
    'use strict';

    // ── Helpers ──────────────────────────────────────────────
    function uuid() {
        return 'b' + Math.random().toString(36).slice(2, 10);
    }

    function slugify(text) {
        const map = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
        return text.toLowerCase().replace(/[а-яё]/g, c => map[c] || c).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    function escapeHtml(text) {
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    const GRID_PC_PRESETS = {
        2: [[6, 6], [4, 8], [8, 4], [3, 9], [9, 3]],
        3: [[4, 4, 4], [3, 6, 3], [6, 3, 3], [3, 3, 6]],
        4: [[3, 3, 3, 3]]
    };

    function formatGridPattern(pattern) {
        return pattern.join('+');
    }

    function parseGridPattern(value) {
        return value.split('+').map(v => parseInt(v, 10)).filter(Boolean);
    }

    function getGridPattern(sectionCount) {
        return GRID_PC_PRESETS[sectionCount][0].slice();
    }

    function createGridColumn() {
        return { id: uuid(), blocks: [] };
    }

    function refreshBlockIds(block) {
        block.id = uuid();

        if (block.type === 'grid') {
            block.data.columns.forEach(column => {
                column.id = uuid();
                column.blocks.forEach(child => refreshBlockIds(child));
            });
        }

        return block;
    }

    function getGridColumnClasses(block, idx) {
        const pc = block.data.pcPattern[idx] || 12;
        const mobilePerRow = parseInt(block.data.mobilePerRow, 10) || 1;
        const xs = mobilePerRow === 2 ? 6 : 12;

        return `col-xs-${xs} col-md-${pc}`;
    }

    function renderBlockContent(block, mode, allBlocks) {
        const def = BLOCK_TYPES[block.type];

        if (!def) {
            return '';
        }

        return mode === 'preview' ? def.preview(block, allBlocks) : def.toHTML(block, allBlocks);
    }

    function renderContentBlocks(contentBlocks, mode) {
        let html = '';

        contentBlocks.forEach(block => {
            html += renderBlockContent(block, mode, blocks) + '\n';
        });

        return html;
    }

    function renderGridHtml(block, mode) {
        let html = '<div class="row article-grid-row">\n';

        block.data.columns.forEach((column, idx) => {
            html += `  <div class="${getGridColumnClasses(block, idx)}">\n`;
            html += renderContentBlocks(column.blocks, mode);
            html += '  </div>\n';
        });

        html += '</div>';

        return html;
    }

    function renderArticleParts(mode) {
        let tocHTML = '';
        let contentHTML = '';

        blocks.forEach(block => {
            const html = renderBlockContent(block, mode, blocks);

            if (block.type === 'toc') {
                tocHTML += html + '\n';
            } else {
                contentHTML += '    ' + html + '\n';
            }
        });

        return { tocHTML, contentHTML };
    }

    function renderGridWorkspace(block) {
        const pattern = formatGridPattern(block.data.pcPattern);
        let html = `<div class="grid-workspace">
            <div class="grid-workspace-help">Bootstrap 3 row: PC ${pattern}, mobile ${block.data.mobilePerRow} в ряд. Перетащите блоки в нужную секцию.</div>
            <div class="row grid-workspace-row">`;

        block.data.columns.forEach((column, idx) => {
            html += `<div class="${getGridColumnClasses(block, idx)}">
                <div class="grid-column-drop" data-grid-column="${column.id}">
                    <div class="grid-column-head">
                        <span>md-${block.data.pcPattern[idx]}</span>
                        <button type="button" class="grid-column-remove" data-action="remove-grid-column" data-column-id="${column.id}" title="Удалить секцию и вернуть блоки вниз">&times;</button>
                    </div>`;

            if (column.blocks.length) {
                column.blocks.forEach(child => {
                    const childDef = BLOCK_TYPES[child.type];
                    html += `<div class="grid-child-card" draggable="true" data-child-id="${child.id}" data-column-id="${column.id}">
                        <div class="grid-child-head">
                            <span>${childDef ? childDef.label : child.type}</span>
                            <button type="button" class="grid-child-remove" data-action="remove-grid-child" data-child-id="${child.id}" data-column-id="${column.id}" title="Удалить вложенный блок">&times;</button>
                        </div>
                        <div class="grid-child-preview">${renderBlockContent(child, 'preview', blocks)}</div>
                    </div>`;
                });
            } else {
                html += '<div class="grid-column-empty">Пусто</div>';
            }

            html += '</div></div>';
        });

        html += '</div></div>';

        return html;
    }

    // ── State ────────────────────────────────────────────────
    let blocks = [
        {
            id: uuid(),
            type: 'heading',
            data: { level: 2, text: 'Apple Watch: Полный обзор умных часов' }
        },
        {
            id: uuid(),
            type: 'toc',
            data: {}
        },
        {
            id: uuid(),
            type: 'heading',
            data: { level: 2, text: 'История развития и модельный ряд' }
        },
        {
            id: uuid(),
            type: 'paragraph',
            data: { text: 'Умные часы **Apple Watch** были впервые представлены в 2014 году и с тех пор стали самым популярным носимым устройством в мире. Они прошли путь от простого аксессуара-компаньона для iPhone до полноценного медицинского гаджета и незаменимого помощника при тренировках.\n\nСегодня модельный ряд разделен на три ключевые категории:\n* **Apple Watch SE** — сбалансированное бюджетное решение.\n* **Apple Watch Series** — классические флагманские часы с передовыми датчиками.\n* **Apple Watch Ultra** — защищенная модель для экстремального спорта с увеличенной автономностью.' }
        },
        {
            id: uuid(),
            type: 'heading',
            data: { level: 3, text: 'Сравнение актуальных моделей' }
        },
        {
            id: uuid(),
            type: 'table',
            data: {
                headers: ['Характеристика', 'Apple Watch SE 2', 'Apple Watch Series 10', 'Apple Watch Ultra 2'],
                rows: [
                    ['Материал корпуса', 'Алюминий', 'Алюминий / Титан', 'Титан аэрокосмический'],
                    ['Размер дисплея', '40 / 44 мм', '42 / 46 мм (тонкие рамки)', '49 мм (плоский экран, 3000 нит)'],
                    ['Датчик кислорода (SpO2)', 'Нет', 'Да', 'Да'],
                    ['ЭКГ (ECG)', 'Нет', 'Да', 'Да'],
                    ['Время работы', 'До 18 часов', 'До 18 часов (быстрая зарядка)', 'До 36 часов']
                ]
            }
        },
        {
            id: uuid(),
            type: 'heading',
            data: { level: 2, text: 'Ключевые функции для здоровья и спорта' }
        },
        {
            id: uuid(),
            type: 'paragraph',
            data: { text: 'Основной акцент Apple делает на **мониторинге здоровья** и безопасности пользователя. Часы способны предупреждать о критических изменениях пульса, распознавать падения и даже вызывать службу спасения при автомобильных авариях.' }
        },
        {
            id: uuid(),
            type: 'heading',
            data: { level: 2, text: 'Примеры Bootstrap-сетки внутри статьи' }
        },
        {
            id: uuid(),
            type: 'paragraph',
            data: { text: 'Ниже показаны два множественных блока. Это обычная Bootstrap 3 сетка: секции используют `col-xs-* col-md-*`, а внутрь можно перетаскивать стандартные блоки конструктора.' }
        },
        {
            id: uuid(),
            type: 'grid',
            data: {
                pcPattern: [6, 6],
                mobilePerRow: 1,
                columns: [
                    {
                        id: uuid(),
                        blocks: [
                            {
                                id: uuid(),
                                type: 'image',
                                data: {
                                    srcType: 'path',
                                    src: 'https://placehold.co/900x600/e8f0fe/334155?text=Apple+Watch',
                                    localSrc: '',
                                    alt: 'Apple Watch на руке',
                                    caption: 'Пример: изображение слева'
                                }
                            }
                        ]
                    },
                    {
                        id: uuid(),
                        blocks: [
                            {
                                id: uuid(),
                                type: 'paragraph',
                                data: { text: '**Схема 6+6:** слева размещена картинка, справа текстовый блок. На мобильной версии выбран режим 1 в ряд, поэтому секции аккуратно складываются друг под другом.' }
                            }
                        ]
                    }
                ]
            }
        },
        {
            id: uuid(),
            type: 'grid',
            data: {
                pcPattern: [4, 4, 4],
                mobilePerRow: 2,
                columns: [
                    {
                        id: uuid(),
                        blocks: [
                            {
                                id: uuid(),
                                type: 'image',
                                data: {
                                    srcType: 'path',
                                    src: 'https://placehold.co/600x420/f0fdf4/166534?text=Activity',
                                    localSrc: '',
                                    alt: 'Активность Apple Watch',
                                    caption: 'Активность'
                                }
                            }
                        ]
                    },
                    {
                        id: uuid(),
                        blocks: [
                            {
                                id: uuid(),
                                type: 'image',
                                data: {
                                    srcType: 'path',
                                    src: 'https://placehold.co/600x420/fef2f2/991b1b?text=Health',
                                    localSrc: '',
                                    alt: 'Здоровье Apple Watch',
                                    caption: 'Здоровье'
                                }
                            }
                        ]
                    },
                    {
                        id: uuid(),
                        blocks: [
                            {
                                id: uuid(),
                                type: 'image',
                                data: {
                                    srcType: 'path',
                                    src: 'https://placehold.co/600x420/fff7ed/9a3412?text=Notifications',
                                    localSrc: '',
                                    alt: 'Уведомления Apple Watch',
                                    caption: 'Уведомления'
                                }
                            }
                        ]
                    }
                ]
            }
        },
        {
            id: uuid(),
            type: 'quote',
            data: { text: 'Технологии в сфере здоровья должны быть доступны каждому. Наша цель с Apple Watch — создать устройство, которое незаметно оберегает вашу жизнь и мотивирует двигаться вперед.', author: 'Тим Кук, CEO Apple' }
        },
        {
            id: uuid(),
            type: 'link',
            data: { text: 'Пользовательское соглашение и условия гарантии Apple', href: '', title: '', isPopup: true, infoId: '5', linkType: 'popup' }
        },
        {
            id: uuid(),
            type: 'heading',
            data: { level: 2, text: 'Часто задаваемые вопросы (FAQ)' }
        },
        {
            id: uuid(),
            type: 'spoiler',
            data: {
                title: 'Можно ли использовать Apple Watch с Android?',
                text: 'К сожалению, нет.\nApple Watch жестко привязаны к экосистеме Apple. Для их первоначальной активации и полноценного использования требуется iPhone (модель Xs или новее).'
            }
        },
        {
            id: uuid(),
            type: 'spoiler',
            data: {
                title: 'Можно ли плавать в часах Apple Watch?',
                text: 'Да, все актуальные модели имеют влагозащиту.\n* SE и Series выдерживают погружение до 50 метров (подходят для бассейна).\n* Ultra поддерживают погружение до 100 метров и сертифицированы для рекреационного дайвинга на глубину до 40 метров.'
            }
        }
    ];
    let dragState = { dragging: null, over: null };

    // ── DOM refs ─────────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const blocksContainer = $('#blocksContainer');
    const workspaceEmpty = $('#workspaceEmpty');
    const previewContent = $('#previewContent');
    const titleInput = $('#articleTitle');
    const slugInput = $('#articleSlug');

    // ── Block Type Definitions ───────────────────────────────
    const BLOCK_TYPES = {
        heading: {
            label: 'Заголовок',
            defaults: () => ({ level: 2, text: 'Заголовок' }),
            editForm(block, onChange) {
                return `
                    <div class="form-row">
                        <div class="form-group" style="flex:0 0 100px">
                            <label>Уровень</label>
                            <select data-field="level">
                                <option value="1" ${block.data.level===1?'selected':''}>H1</option>
                                <option value="2" ${block.data.level===2?'selected':''}>H2</option>
                                <option value="3" ${block.data.level===3?'selected':''}>H3</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Текст</label>
                            <input type="text" data-field="text" value="${escapeHtml(block.data.text)}">
                        </div>
                    </div>`;
            },
            toHTML(block, allBlocks) {
                const headings = allBlocks ? allBlocks.filter(b => b.type === 'heading') : [];
                const idx = headings.findIndex(h => h.id === block.id);
                const idAttr = idx !== -1 ? ` id="heading${idx + 1}"` : '';
                return `<h${block.data.level}${idAttr}>${escapeHtml(block.data.text)}</h${block.data.level}>`;
            },
            preview(block, allBlocks) {
                return this.toHTML(block, allBlocks);
            },
        },

        paragraph: {
            label: 'Параграф',
            defaults: () => ({ text: 'Текст абзаца...' }),
            editForm(block) {
                return `<div class="form-group"><label>Текст (поддержка Markdown: **жирный**, *курсив*, [ссылка](url), списки, новые строки)</label>${agreeToolbarHtml()}<textarea data-field="text" rows="6">${escapeHtml(block.data.text)}</textarea></div>`;
            },
            toHTML(block) { return markdownToHtml(block.data.text, false); },
            preview(block) { return markdownToHtml(block.data.text, true); },
        },

        quote: {
            label: 'Цитата',
            defaults: () => ({ text: 'Текст цитаты...', author: '' }),
            editForm(block) {
                return `
                    <div class="form-group"><label>Текст цитаты</label>${agreeToolbarHtml()}<textarea data-field="text" rows="3">${escapeHtml(block.data.text)}</textarea></div>
                    <div class="form-group"><label>Автор (необязательно)</label><input type="text" data-field="author" value="${escapeHtml(block.data.author)}"></div>`;
            },
            toHTML(block, isPreview = false) {
                let html = `<blockquote><p>${inlineFormat(block.data.text, isPreview)}</p>`;
                if (block.data.author) html += `<i>— ${escapeHtml(block.data.author)}</i>`;
                html += `</blockquote>`;
                return html;
            },
            preview(block) { return this.toHTML(block, true); },
        },

        table: {
            label: 'Таблица',
            defaults: () => ({ headers: ['Заголовок 1', 'Заголовок 2'], rows: [['Ячейка 1', 'Ячейка 2'], ['Ячейка 3', 'Ячейка 4']] }),
            editForm(block) {
                let html = `<div class="table-editor"><table><thead><tr>`;
                block.data.headers.forEach((h, i) => {
                    html += `<th><input class="th-input" data-col="${i}" value="${escapeHtml(h)}"></th>`;
                });
                html += `</tr></thead><tbody>`;
                block.data.rows.forEach((row, ri) => {
                    html += `<tr>`;
                    row.forEach((cell, ci) => {
                        html += `<td><input data-row="${ri}" data-col="${ci}" value="${escapeHtml(cell)}"></td>`;
                    });
                    html += `</tr>`;
                });
                html += `</tbody></table>`;
                html += `<div class="table-editor-actions">
                    <button class="btn btn-sm btn-ghost" data-action="add-col">+ Столбец</button>
                    <button class="btn btn-sm btn-ghost" data-action="add-row">+ Строка</button>
                    <button class="btn btn-sm btn-ghost" data-action="remove-col">− Столбец</button>
                    <button class="btn btn-sm btn-ghost" data-action="remove-row">− Строка</button>
                </div></div>`;
                return html;
            },
            toHTML(block) {
                let html = `<div class="table-responsive"><table><thead><tr>`;
                block.data.headers.forEach(h => { html += `<th>${escapeHtml(h)}</th>`; });
                html += `</tr></thead><tbody>`;
                block.data.rows.forEach(row => {
                    html += `<tr>`;
                    row.forEach(cell => { html += `<td>${escapeHtml(cell)}</td>`; });
                    html += `</tr>`;
                });
                html += `</tbody></table></div>`;
                return html;
            },
            preview(block) {
                return this.toHTML(block);
            },
        },

        'ordered-list': {
            label: 'Нумерованный список',
            defaults: () => ({ items: ['Пункт 1', 'Пункт 2', 'Пункт 3'] }),
            editForm(block) {
                let html = `<div class="form-group"><label>Пункты</label>`;
                block.data.items.forEach((item, i) => {
                    html += `<div class="form-row" style="margin-bottom:4px">
                        <input type="text" data-item="${i}" value="${escapeHtml(item)}" style="flex:1">
                        <button class="btn btn-sm btn-ghost" data-action="remove-item" data-index="${i}">&times;</button>
                    </div>`;
                });
                html += `</div><button class="btn btn-sm btn-ghost" data-action="add-item">+ Добавить пункт</button>`;
                return html;
            },
            toHTML(block, isPreview = false) {
                return `<ol>${block.data.items.map(i => `<li>${inlineFormat(i, isPreview)}</li>`).join('')}</ol>`;
            },
            preview(block) { return this.toHTML(block, true); },
        },

        'unordered-list': {
            label: 'Маркированный список',
            defaults: () => ({ items: ['Пункт 1', 'Пункт 2', 'Пункт 3'] }),
            editForm(block) {
                let html = `<div class="form-group"><label>Пункты</label>`;
                block.data.items.forEach((item, i) => {
                    html += `<div class="form-row" style="margin-bottom:4px">
                        <input type="text" data-item="${i}" value="${escapeHtml(item)}" style="flex:1">
                        <button class="btn btn-sm btn-ghost" data-action="remove-item" data-index="${i}">&times;</button>
                    </div>`;
                });
                html += `</div><button class="btn btn-sm btn-ghost" data-action="add-item">+ Добавить пункт</button>`;
                return html;
            },
            toHTML(block, isPreview = false) {
                return `<ul>${block.data.items.map(i => `<li>${inlineFormat(i, isPreview)}</li>`).join('')}</ul>`;
            },
            preview(block) { return this.toHTML(block, true); },
        },

        image: {
            label: 'Изображение',
            defaults: () => ({ srcType: 'path', src: '', localSrc: '', alt: 'Изображение', caption: '' }),
            editForm(block) {
                const domainInputEl = document.getElementById('articleDomain');
                const domainVal = domainInputEl ? domainInputEl.value.trim() : '';
                return `
                    <div class="form-group">
                        <label>Источник изображения</label>
                        <select data-field="srcType" class="img-src-type-select">
                            <option value="path" ${block.data.srcType==='path'?'selected':''}>Путь в OpenCart / Ссылка</option>
                            <option value="local" ${block.data.srcType==='local'?'selected':''}>Загрузить локальный файл (для превью)</option>
                        </select>
                    </div>
                    
                    <div class="img-src-path-group" style="display: ${block.data.srcType==='local'?'none':'block'}">
                        <div class="form-group">
                            <label>Путь к изображению в OpenCart</label>
                            <input type="text" data-field="src" value="${escapeHtml(block.data.src)}" placeholder="image/catalog/folder/image.jpg">
                            <small style="color:#777;font-size:11px;margin-top:2px;display:block;">
                                В превью отобразится с использованием домена из шапки: <b>${domainVal || 'не указан'}</b>
                            </small>
                        </div>
                    </div>
                    
                    <div class="img-src-local-group" style="display: ${block.data.srcType==='local'?'block':'none'}">
                        <div class="form-group">
                            <label>Выберите локальный файл</label>
                            <input type="file" class="img-local-file-input" accept="image/*">
                            <input type="hidden" data-field="localSrc" value="${escapeHtml(block.data.localSrc || '')}">
                            <div class="img-local-thumb" style="margin-top:6px;">
                                ${block.data.localSrc ? `<img src="${block.data.localSrc}" style="max-height:80px;border-radius:4px;display:block;">` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="form-row" style="margin-top:8px;">
                        <div class="form-group"><label>Alt текст</label><input type="text" data-field="alt" value="${escapeHtml(block.data.alt)}"></div>
                        <div class="form-group"><label>Подпись (необязательно)</label><input type="text" data-field="caption" value="${escapeHtml(block.data.caption)}"></div>
                    </div>`;
            },
            toHTML(block) {
                let imgUrl = '';
                if (block.data.srcType === 'local') {
                    imgUrl = block.data.localSrc || '';
                } else {
                    imgUrl = block.data.src || '';
                }
                
                // If both are empty, use SVG placeholder
                if (!imgUrl) {
                    imgUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="%23f5f5f5"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="%23888" dominant-baseline="middle" text-anchor="middle">Изображение OpenCart (${escapeHtml(block.data.alt || 'Заглушка')})</text></svg>`;
                }
                
                let html = `<img alt="${escapeHtml(block.data.alt || 'Изображение')}" class="img-responsive" style="width: 100%;" src="${imgUrl}" loading="lazy">`;
                if (block.data.caption) {
                    html += `<p style="text-align:center;font-size:13px;color:#888;margin-top:5px;text-indent:0!important;">${escapeHtml(block.data.caption)}</p>`;
                }
                return html;
            },
            preview(block) {
                let imgUrl = '';
                if (block.data.srcType === 'local') {
                    imgUrl = block.data.localSrc || '';
                } else {
                    imgUrl = block.data.src || '';
                    if (imgUrl && !imgUrl.startsWith('http://') && !imgUrl.startsWith('https://') && !imgUrl.startsWith('data:')) {
                        const domainInputEl = document.getElementById('articleDomain');
                        const domainVal = domainInputEl ? domainInputEl.value.trim() : '';
                        if (domainVal) {
                            const base = domainVal.endsWith('/') ? domainVal : domainVal + '/';
                            const path = imgUrl.startsWith('/') ? imgUrl.substring(1) : imgUrl;
                            imgUrl = base + path;
                        }
                    }
                }
                
                if (!imgUrl) {
                    // Inline SVG placeholder
                    imgUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="%23F3F2FF"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="%235446f8" dominant-baseline="middle" text-anchor="middle">Заглушка: ${escapeHtml(block.data.src || 'файл не выбран')}</text></svg>`;
                }
                
                let html = `<img alt="${escapeHtml(block.data.alt || 'Изображение')}" class="img-responsive" style="width: 100%;" src="${imgUrl}" loading="lazy">`;
                if (block.data.caption) {
                    html += `<p style="text-align:center;font-size:13px;color:#888;margin-top:5px;text-indent:0!important;">${escapeHtml(block.data.caption)}</p>`;
                }
                return html;
            },
        },

        grid: {
            label: 'Bootstrap сетка',
            defaults: () => {
                const pcPattern = getGridPattern(2);

                return {
                    pcPattern,
                    mobilePerRow: 1,
                    columns: pcPattern.map(() => createGridColumn())
                };
            },
            editForm(block) {
                const sectionCount = block.data.columns.length;
                const patternOptions = GRID_PC_PRESETS[sectionCount].map(pattern => {
                    const value = formatGridPattern(pattern);
                    const selected = formatGridPattern(block.data.pcPattern) === value ? 'selected' : '';

                    return `<option value="${value}" ${selected}>${value}</option>`;
                }).join('');

                return `
                    <div class="grid-help">Это Bootstrap 3 row. Перетаскивайте обычные блоки в нужную секцию. PC-схема всегда суммируется в 12, mobile ограничен 1 или 2 блоками в ряд.</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Секций</label>
                            <select data-grid-field="sectionCount">
                                <option value="2" ${sectionCount===2?'selected':''}>2</option>
                                <option value="3" ${sectionCount===3?'selected':''}>3</option>
                                <option value="4" ${sectionCount===4?'selected':''}>4</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>PC схема md</label>
                            <select data-grid-field="pcPattern">${patternOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>Mobile</label>
                            <select data-grid-field="mobilePerRow">
                                <option value="1" ${block.data.mobilePerRow===1?'selected':''}>1 в ряд</option>
                                <option value="2" ${block.data.mobilePerRow===2?'selected':''}>2 в ряд</option>
                            </select>
                        </div>
                    </div>`;
            },
            toHTML(block) {
                return renderGridHtml(block, 'toHTML');
            },
            preview(block) {
                return renderGridHtml(block, 'preview');
            },
        },

        link: {
            label: 'Ссылка',
            defaults: () => ({ text: 'Текст ссылки', href: 'https://', title: '', isPopup: false, infoId: '5', linkType: 'regular' }),
            editForm(block) {
                const isPopup = block.data.isPopup || block.data.linkType === 'popup';
                const infoId = block.data.infoId || '5';
                return `
                    <div class="form-group">
                        <label>Текст ссылки</label>
                        <input type="text" data-field="text" value="${escapeHtml(block.data.text)}">
                    </div>
                    <div class="form-row" style="margin-bottom: 8px;">
                        <div class="form-group">
                            <label>Тип ссылки</label>
                            <select data-field="linkType" class="link-type-select">
                                <option value="regular" ${!isPopup ? 'selected' : ''}>Обычная ссылка</option>
                                <option value="popup" ${isPopup ? 'selected' : ''}>Всплывающая статья OpenCart (класс agree)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="regular-link-group" style="display: ${isPopup ? 'none' : 'block'}; margin-bottom: 8px;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>URL (Адрес ссылки)</label>
                                <input type="text" data-field="href" value="${escapeHtml(block.data.href || 'https://')}">
                            </div>
                            <div class="form-group">
                                <label>Title подсказка (необязательно)</label>
                                <input type="text" data-field="title" value="${escapeHtml(block.data.title || '')}">
                            </div>
                        </div>
                    </div>
                    
                    <div class="popup-link-group" style="display: ${isPopup ? 'block' : 'none'}; margin-bottom: 8px;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>ID статьи OpenCart (information_id)</label>
                                <input type="number" data-field="infoId" value="${escapeHtml(infoId)}" placeholder="Например: 5">
                                <small style="color: #666; font-size: 11px; margin-top: 4px; display: block;">
                                    Ссылка для OpenCart: <code class="generated-popup-link">/index.php?route=information/information/agree&information_id=${infoId}</code>
                                </small>
                            </div>
                        </div>
                    </div>`;
            },
            toHTML(block) {
                const isPopup = block.data.isPopup || block.data.linkType === 'popup';
                if (isPopup) {
                    const infoId = block.data.infoId || '5';
                    const href = `/index.php?route=information/information/agree&information_id=${infoId}`;
                    return `<p><a class="agree" href="${href}"><b>${escapeHtml(block.data.text)}</b></a></p>`;
                } else {
                    const title = block.data.title ? ` title="${escapeHtml(block.data.title)}"` : '';
                    const href = block.data.href || 'https://';
                    return `<p><a href="${escapeHtml(href)}"${title}>${escapeHtml(block.data.text)}</a></p>`;
                }
            },
            preview(block) {
                const isPopup = block.data.isPopup || block.data.linkType === 'popup';
                if (isPopup) {
                    const infoId = block.data.infoId || '5';
                    const href = `/index.php?route=information/information/agree&information_id=${infoId}`;
                    return `<p><a class="agree" href="${href}" onclick="alert('Эмуляция OpenCart: Открытие статьи с ID = ${infoId} в модальном окне (через AJAX/Bootstrap modal). В реальности сработает автоматически благодаря встроенному скрипту OpenCart.'); return false;"><b>${escapeHtml(block.data.text)}</b></a></p>`;
                }
                return this.toHTML(block);
            },
        },

        popup: {
            label: 'Попап окно',
            defaults: () => ({ text: 'Условия соглашения', infoId: '5', styleType: 'button', btnClass: 'btn-primary', btnSize: '' }),
            editForm(block) {
                const infoId = block.data.infoId || '5';
                const styleType = block.data.styleType || 'button';
                const btnClass = block.data.btnClass || 'btn-primary';
                const btnSize = block.data.btnSize || '';
                return `
                    <div class="form-group">
                        <label>Текст ссылки/кнопки</label>
                        <input type="text" data-field="text" value="${escapeHtml(block.data.text)}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>ID статьи OpenCart (information_id)</label>
                            <input type="number" data-field="infoId" value="${escapeHtml(infoId)}">
                        </div>
                        <div class="form-group">
                            <label>Тип элемента</label>
                            <select data-field="styleType" class="popup-style-select">
                                <option value="link" ${styleType==='link'?'selected':''}>Текстовая ссылка с иконкой</option>
                                <option value="button" ${styleType==='button'?'selected':''}>Кнопка Bootstrap 3</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="popup-btn-options" style="display: ${styleType === 'button' ? 'block' : 'none'}; margin-top: 8px;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Цвет кнопки (Bootstrap Class)</label>
                                <select data-field="btnClass">
                                    <option value="btn-default" ${btnClass==='btn-default'?'selected':''}>Default (Серый)</option>
                                    <option value="btn-primary" ${btnClass==='btn-primary'?'selected':''}>Primary (Синий)</option>
                                    <option value="btn-success" ${btnClass==='btn-success'?'selected':''}>Success (Зеленый)</option>
                                    <option value="btn-info" ${btnClass==='btn-info'?'selected':''}>Info (Голубой)</option>
                                    <option value="btn-warning" ${btnClass==='btn-warning'?'selected':''}>Warning (Оранжевый)</option>
                                    <option value="btn-danger" ${btnClass==='btn-danger'?'selected':''}>Danger (Красный)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Размер кнопки</label>
                                <select data-field="btnSize">
                                    <option value="btn-sm" ${btnSize==='btn-sm'?'selected':''}>Маленькая</option>
                                    <option value="" ${btnSize===''?'selected':''}>Обычная</option>
                                    <option value="btn-lg" ${btnSize==='btn-lg'?'selected':''}>Большая</option>
                                    <option value="btn-block" ${btnSize==='btn-block'?'selected':''}>На всю ширину</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group" style="margin-top: 8px;">
                        <small style="color: #666; font-size: 11px;">
                            Ссылка для OpenCart (agree): <code class="generated-popup-link">/index.php?route=information/information/agree&information_id=${infoId}</code>
                        </small>
                    </div>`;
            },
            toHTML(block) {
                const infoId = block.data.infoId || '5';
                const href = `/index.php?route=information/information/agree&information_id=${infoId}`;
                const styleType = block.data.styleType || 'link';
                if (styleType === 'button') {
                    const btnClass = block.data.btnClass || 'btn-primary';
                    const btnSize = block.data.btnSize || '';
                    const fullClass = `btn ${btnClass} ${btnSize} agree`.trim().replace(/\s+/g, ' ');
                    return `<p style="text-align: center; text-indent: 0 !important;"><a class="${fullClass}" href="${href}">${escapeHtml(block.data.text)}</a></p>`;
                } else {
                    return `<p style="text-indent: 0 !important;"><a class="agree link-popup-action" href="${href}"><i class="fa fa-info-circle" style="margin-right: 6px;"></i><b>${escapeHtml(block.data.text)}</b></a></p>`;
                }
            },
            preview(block) {
                const infoId = block.data.infoId || '5';
                const href = `/index.php?route=information/information/agree&information_id=${infoId}`;
                const styleType = block.data.styleType || 'link';
                const onclick = `onclick="alert('Эмуляция OpenCart: Открытие статьи с ID = ${infoId} в модальном окне (через AJAX/Bootstrap modal). В реальности сработает автоматически благодаря встроенному скрипту OpenCart.'); return false;"`;
                if (styleType === 'button') {
                    const btnClass = block.data.btnClass || 'btn-primary';
                    const btnSize = block.data.btnSize || '';
                    const fullClass = `btn ${btnClass} ${btnSize} agree`.trim().replace(/\s+/g, ' ');
                    return `<p style="text-align: center; text-indent: 0 !important;"><a class="${fullClass}" href="${href}" ${onclick}>${escapeHtml(block.data.text)}</a></p>`;
                } else {
                    return `<p style="text-indent: 0 !important;"><a class="agree link-popup-action" href="${href}" ${onclick}><i class="fa fa-info-circle" style="margin-right: 6px;"></i><b>${escapeHtml(block.data.text)}</b></a></p>`;
                }
            },
        },

        spoiler: {
            label: 'Спойлер',
            defaults: () => ({ title: 'Нажмите чтобы развернуть', text: 'Скрытый контент...' }),
            editForm(block) {
                return `
                    <div class="form-group"><label>Заголовок спойлера</label><input type="text" data-field="title" value="${escapeHtml(block.data.title)}"></div>
                    <div class="form-group"><label>Текст (поддерживает Markdown: списки, абзацы, "Ключ :: Описание")</label>${agreeToolbarHtml()}<textarea data-field="text" rows="5">${escapeHtml(block.data.text)}</textarea></div>`;
            },
            toHTML(block) {
                return `<details><summary>${escapeHtml(block.data.title)}</summary>${markdownToHtml(block.data.text, false)}</details>`;
            },
            preview(block) {
                return `<details><summary>${escapeHtml(block.data.title)}</summary>${markdownToHtml(block.data.text, true)}</details>`;
            },
        },

        tabs: {
            label: 'Вкладки',
            defaults: () => ({ tabs: [{ title: 'Вкладка 1', text: 'Содержимое вкладки 1' }, { title: 'Вкладка 2', text: 'Содержимое вкладки 2' }] }),
            editForm(block) {
                let html = `<div class="tabs-editor">`;
                block.data.tabs.forEach((tab, i) => {
                    html += `<div class="tab-editor-item">
                        <div class="tab-editor-header">
                            <input type="text" data-tab-title="${i}" value="${escapeHtml(tab.title)}" placeholder="Заголовок вкладки">
                            <button class="btn btn-sm btn-ghost" data-action="remove-tab" data-index="${i}">&times;</button>
                        </div>
                        ${agreeToolbarHtml()}
                        <textarea data-tab-text="${i}" rows="3" placeholder="Содержимое">${escapeHtml(tab.text)}</textarea>
                    </div>`;
                });
                html += `</div><button class="btn btn-sm btn-ghost" data-action="add-tab">+ Добавить вкладку</button>`;
                return html;
            },
            toHTML(block) {
                const id = 'tabs-' + block.id;
                let html = `<div class="article-tabs" id="${id}"><div class="article-tabs-nav">`;
                block.data.tabs.forEach((tab, i) => {
                    html += `<button class="${i===0?'active':''}" data-tab="${i}">${escapeHtml(tab.title)}</button>`;
                });
                html += `</div><div class="article-tabs-panels">`;
                block.data.tabs.forEach((tab, i) => {
                    html += `<div class="article-tabs-panel" style="${i===0?'':'display:none'}">${markdownToHtml(tab.text, false)}</div>`;
                });
                html += `</div></div>`;
                return html;
            },
            preview(block) {
                const id = 'preview-' + block.id;
                let html = `<div class="article-tabs" id="${id}"><div class="article-tabs-nav">`;
                block.data.tabs.forEach((tab, i) => {
                    html += `<button class="${i===0?'active':''}" data-tab="${i}">${escapeHtml(tab.title)}</button>`;
                });
                html += `</div><div class="article-tabs-panels">`;
                block.data.tabs.forEach((tab, i) => {
                    html += `<div class="article-tabs-panel" style="${i===0?'':'display:none'}">${markdownToHtml(tab.text, true)}</div>`;
                });
                html += `</div></div>`;
                return html;
            },
        },

        toc: {
            label: 'Оглавление',
            defaults: () => ({}),
            editForm() {
                return `<p style="color:#888;font-size:12px">Оглавление генерируется автоматически из заголовков H2 и H3.</p>`;
            },
            toHTML(block, allBlocks) { return generateTOC(allBlocks); },
            preview(block, allBlocks) { return generateTOC(allBlocks); },
        },
    };

    // ── Inline formatting ────────────────────────────────────
    function inlineFormat(text, isPreview = false) {
        let s = escapeHtml(text);
        s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
        s = s.replace(/\*(.+?)\*/g, '<i>$1</i>');
        s = s.replace(/`(.+?)`/g, '<code>$1</code>');
        
        s = s.replace(/\[(.+?)\]\((.+?)\)/g, (match, linkText, url) => {
            let isAgree = false;
            let infoId = '';
            
            if (url.startsWith('agree:') || url.startsWith('popup:')) {
                isAgree = true;
                infoId = url.split(':')[1];
            } else {
                const matchAgree = url.match(/information\/information\/agree.*[?&]information_id=(\d+)/);
                if (matchAgree) {
                    isAgree = true;
                    infoId = matchAgree[1];
                }
            }
            
            if (isAgree) {
                const href = `index.php?route=information/information/agree&information_id=${infoId}`;
                if (isPreview) {
                    return `<a class="agree" href="${href}" onclick="alert('\u0412 OpenCart: \u041e\u0442\u043a\u0440\u044b\u0442\u0438\u0435 \u043c\u043e\u0434\u0430\u043b\u044c\u043dого \u043e\u043a\u043d\u0430 \u0441 ID = ${infoId} (\u0447\u0435\u0440ез AJAX/Bootstrap modal). \u0412 \u0440\u0435\u0430\u043bьно\u0439 \u0441\u0438\u0441теме \u0441\u0440аботает \u0430в\u0442оматич\u0435ски \u0431лагодаря agree...'); return false;">${linkText}</a>`;
                } else {
                    return `<a class="agree" href="${href}">${linkText}</a>`;
                }
            }
            return `<a href="${url}">${linkText}</a>`;
        });
        return s;
    }

    function agreeToolbarHtml() {
        return `<div class="textarea-tools">
            <input type="number" min="1" value="5" data-agree-info-id title="ID информационной статьи OpenCart">
            <button type="button" class="btn btn-sm btn-ghost" data-action="insert-agree-link" title="Обернуть выделенный текст в OpenCart agree-ссылку">agree</button>
            <span class="textarea-tools-hint">Выделите текст и нажмите agree</span>
        </div>`;
    }

    function insertAgreeLinkFromSelection(block, form, trigger) {
        const textareas = Array.from(form.querySelectorAll('textarea'));
        const activeTextarea = textareas.includes(document.activeElement) ? document.activeElement : null;
        const textarea = activeTextarea && activeTextarea.selectionStart !== activeTextarea.selectionEnd
            ? activeTextarea
            : textareas.find(el => el.selectionStart !== el.selectionEnd);

        if (!textarea) {
            alert('Выделите текст в поле редактора, который нужно открыть через agree-попап.');
            return;
        }

        const infoInput = trigger.closest('.textarea-tools').querySelector('[data-agree-info-id]');
        const cleanInfoId = infoInput ? infoInput.value.trim() : '';

        if (!/^\d+$/.test(cleanInfoId)) {
            alert('ID статьи должен быть числом.');
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.slice(start, end);

        textarea.setRangeText(`[${selectedText}](agree:${cleanInfoId})`, start, end, 'end');
        syncTextareaData(block, textarea);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        updatePreview();
    }

    function syncTextareaData(block, textarea) {
        if (textarea.dataset.field) {
            block.data[textarea.dataset.field] = textarea.value;
        } else if (textarea.dataset.tabText !== undefined) {
            const idx = parseInt(textarea.dataset.tabText);
            block.data.tabs[idx].text = textarea.value;
        }
    }

    // ── Markdown to HTML parser ──────────────────────────────
    function markdownToHtml(text, isPreview = false) {
        if (!text) return '';
        const lines = text.split(/\r?\n/);
        let html = '';
        let listType = null; // 'ul', 'ol', 'dl', or null
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) {
                if (listType) {
                    html += `</${listType}>\n`;
                    listType = null;
                }
                continue;
            }
            
            // Check if it's an unordered list item
            if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
                if (listType && listType !== 'ul') {
                    html += `</${listType}>\n`;
                    listType = null;
                }
                if (!listType) {
                    html += '<ul>\n';
                    listType = 'ul';
                }
                const cleanLine = line.replace(/^[\*\-\•]\s+/, '');
                html += `<li>${inlineFormat(cleanLine, isPreview)}</li>\n`;
                continue;
            }
            
            // Check if it's an ordered list item
            if (/^\d+\.\s+/.test(line)) {
                if (listType && listType !== 'ol') {
                    html += `</${listType}>\n`;
                    listType = null;
                }
                if (!listType) {
                    html += '<ol>\n';
                    listType = 'ol';
                }
                const cleanLine = line.replace(/^\d+\.\s+/, '');
                html += `<li>${inlineFormat(cleanLine, isPreview)}</li>\n`;
                continue;
            }
            
            // Check if it's a description list item (dt :: dd)
            if (line.includes('::')) {
                if (listType && listType !== 'dl') {
                    html += `</${listType}>\n`;
                    listType = null;
                }
                if (!listType) {
                    html += '<dl>\n';
                    listType = 'dl';
                }
                const parts = line.split('::');
                const dt = parts[0].trim();
                const dd = parts.slice(1).join('::').trim();
                html += `<dt>${inlineFormat(dt, isPreview)}</dt><dd>${inlineFormat(dd, isPreview)}</dd>\n`;
                continue;
            }
            
            // Default line is a paragraph
            if (listType) {
                html += `</${listType}>\n`;
                listType = null;
            }
            html += `<p>${inlineFormat(line, isPreview)}</p>\n`;
        }
        
        if (listType) {
            html += `</${listType}>\n`;
        }
        
        return html;
    }

    // ── TOC generator ────────────────────────────────────────
    function generateTOC(allBlocks) {
        const headings = allBlocks ? allBlocks.filter(b => b.type === 'heading') : [];
        if (headings.length === 0) return '<p style="color:#aaa;font-style:italic">Добавьте заголовки H2/H3 для генерации оглавления</p>';
        
        let html = `<div class="blog-content">`;
        html += `<div class="bold menu-content-title">Содержание<i class="fa fa-chevron-down"></i></div>`;
        html += `<ul>`;
        headings.forEach((h, idx) => {
            const isSub = h.data.level === 3;
            const targetId = `heading${idx + 1}`;
            if (isSub) {
                html += `<li style="list-style: none;"><ul class="ogli3"><li><a class="anchor" href="#${targetId}" data-destination="#${targetId}">${escapeHtml(h.data.text)}</a></li></ul></li>`;
            } else {
                html += `<li><a class="anchor" href="#${targetId}" data-destination="#${targetId}">${escapeHtml(h.data.text)}</a></li>`;
            }
        });
        html += `</ul>`;
        html += `</div>`;
        return html;
    }

    // ── Block CRUD ───────────────────────────────────────────
    function addBlock(type) {
        const def = BLOCK_TYPES[type];
        if (!def) return;
        const block = { id: uuid(), type, data: def.defaults() };
        blocks.push(block);
        renderBlocks();
        updatePreview();
    }

    function removeBlock(id) {
        const idx = blocks.findIndex(b => b.id === id);

        if (idx === -1) {
            return;
        }

        const block = blocks[idx];
        const returnedBlocks = block.type === 'grid' ? getGridChildren(block) : [];
        blocks.splice(idx, 1, ...returnedBlocks);
        renderBlocks();
        updatePreview();
    }

    function duplicateBlock(id) {
        const idx = blocks.findIndex(b => b.id === id);
        if (idx === -1) return;
        const clone = JSON.parse(JSON.stringify(blocks[idx]));
        refreshBlockIds(clone);
        blocks.splice(idx + 1, 0, clone);
        renderBlocks();
        updatePreview();
    }

    function moveBlock(fromIdx, toIdx) {
        if (fromIdx === toIdx) return;
        const [moved] = blocks.splice(fromIdx, 1);
        blocks.splice(toIdx > fromIdx ? toIdx - 1 : toIdx, 0, moved);
        renderBlocks();
        updatePreview();
    }

    function getGridChildren(block) {
        if (!block || block.type !== 'grid') {
            return [];
        }

        return block.data.columns.flatMap(column => column.blocks);
    }

    function findGridColumn(gridBlock, columnId) {
        return gridBlock.data.columns.find(column => column.id === columnId);
    }

    function findNestedBlock(childId) {
        for (const gridBlock of blocks) {
            if (gridBlock.type !== 'grid') continue;

            for (const column of gridBlock.data.columns) {
                const idx = column.blocks.findIndex(child => child.id === childId);

                if (idx !== -1) {
                    return { gridBlock, column, idx, block: column.blocks[idx] };
                }
            }
        }

        return null;
    }

    function moveBlockIntoGrid(blockId, gridBlock, columnId) {
        if (!gridBlock || gridBlock.type !== 'grid' || blockId === gridBlock.id) {
            return;
        }

        const column = findGridColumn(gridBlock, columnId);

        if (!column) {
            return;
        }

        let movedBlock = null;
        const topIdx = blocks.findIndex(block => block.id === blockId);

        if (topIdx !== -1) {
            movedBlock = blocks[topIdx];

            if (movedBlock.type === 'grid') {
                return;
            }

            blocks.splice(topIdx, 1);
        } else {
            const nested = findNestedBlock(blockId);

            if (!nested) {
                return;
            }

            movedBlock = nested.block;
            nested.column.blocks.splice(nested.idx, 1);
        }

        column.blocks.push(movedBlock);
        renderBlocks();
        updatePreview();
    }

    function removeGridChild(columnId, childId) {
        const nested = findNestedBlock(childId);

        if (!nested || nested.column.id !== columnId) {
            return;
        }

        nested.column.blocks.splice(nested.idx, 1);
        renderBlocks();
        updatePreview();
    }

    function removeGridColumn(gridBlock, columnId) {
        const gridIdx = blocks.findIndex(block => block.id === gridBlock.id);
        const columnIdx = gridBlock.data.columns.findIndex(column => column.id === columnId);

        if (gridIdx === -1 || columnIdx === -1 || gridBlock.data.columns.length <= 1) {
            return;
        }

        const [removedColumn] = gridBlock.data.columns.splice(columnIdx, 1);
        const count = gridBlock.data.columns.length;
        gridBlock.data.pcPattern = getGridPattern(count);

        if (gridBlock.data.mobilePerRow > count) {
            gridBlock.data.mobilePerRow = 1;
        }

        blocks.splice(gridIdx + 1, 0, ...removedColumn.blocks);
        renderBlocks();
        updatePreview();
    }

    function updateGridSectionCount(gridBlock, count) {
        const gridIdx = blocks.findIndex(block => block.id === gridBlock.id);
        const currentCount = gridBlock.data.columns.length;

        if (gridIdx === -1 || count === currentCount || !GRID_PC_PRESETS[count]) {
            return;
        }

        if (count > currentCount) {
            while (gridBlock.data.columns.length < count) {
                gridBlock.data.columns.push(createGridColumn());
            }
        } else {
            const removedColumns = gridBlock.data.columns.splice(count);
            const returnedBlocks = removedColumns.flatMap(column => column.blocks);
            blocks.splice(gridIdx + 1, 0, ...returnedBlocks);
        }

        gridBlock.data.pcPattern = getGridPattern(count);

        if (gridBlock.data.mobilePerRow > count) {
            gridBlock.data.mobilePerRow = 1;
        }

        renderBlocks();
        updatePreview();
    }

    function updateGridPcPattern(gridBlock, value) {
        const pattern = parseGridPattern(value);

        if (pattern.length !== gridBlock.data.columns.length || pattern.reduce((sum, col) => sum + col, 0) !== 12) {
            return;
        }

        gridBlock.data.pcPattern = pattern;
        renderBlocks();
        updatePreview();
    }

    function updateGridMobilePerRow(gridBlock, value) {
        const mobilePerRow = parseInt(value, 10);

        if (![1, 2].includes(mobilePerRow)) {
            return;
        }

        gridBlock.data.mobilePerRow = mobilePerRow;
        renderBlocks();
        updatePreview();
    }

    // ── Render blocks in workspace ───────────────────────────
    function renderBlocks() {
        workspaceEmpty.style.display = blocks.length === 0 ? 'flex' : 'none';
        blocksContainer.innerHTML = '';

        blocks.forEach((block, idx) => {
            const def = BLOCK_TYPES[block.type];
            const card = document.createElement('div');
            card.className = 'block-card';
            card.dataset.id = block.id;
            card.dataset.idx = idx;
            card.draggable = true;

            const preview = block.type === 'grid' ? renderGridWorkspace(block) : def.preview(block, blocks);

            card.innerHTML = `
                <div class="block-header">
                    <span class="drag-handle" title="Перетащить">&#9776;</span>
                    <span class="block-type-label">${def.label}</span>
                    <div class="block-actions">
                        <button class="block-action-btn" data-action="edit" title="Редактировать">&#9998;</button>
                        <button class="block-action-btn" data-action="duplicate" title="Дублировать">&#10697;</button>
                        <button class="block-action-btn delete" data-action="delete" title="Удалить">&#10005;</button>
                    </div>
                </div>
                <div class="block-body">
                    <div class="block-preview">${preview}</div>
                </div>`;

            // DnD events
            card.addEventListener('dragstart', (e) => {
                dragState.dragging = block.id;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', block.id);
            });
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                dragState.dragging = null;
                $$('.block-card').forEach(c => c.classList.remove('drag-over'));
            });
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                $$('.block-card').forEach(c => c.classList.remove('drag-over'));
                card.classList.add('drag-over');
            });
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                const fromId = e.dataTransfer.getData('text/plain');
                const fromBlock = blocks.find(b => b.id === fromId);
                const toBlock = block;
                if (fromBlock && fromBlock.id !== toBlock.id) {
                    const fromIdx = blocks.indexOf(fromBlock);
                    const toIdx = blocks.indexOf(toBlock);
                    moveBlock(fromIdx, toIdx);
                }
            });

            // Action buttons
            card.querySelector('[data-action="delete"]').addEventListener('click', () => removeBlock(block.id));
            card.querySelector('[data-action="duplicate"]').addEventListener('click', () => duplicateBlock(block.id));
            card.querySelector('[data-action="edit"]').addEventListener('click', () => toggleEdit(block, card));

            if (block.type === 'grid') {
                bindGridWorkspaceEvents(block, card);
            }

            blocksContainer.appendChild(card);
        });
    }

    function bindGridWorkspaceEvents(gridBlock, card) {
        card.querySelectorAll('.grid-column-drop').forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
                zone.classList.add('grid-column-over');
            });
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('grid-column-over');
            });
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.remove('grid-column-over');
                moveBlockIntoGrid(e.dataTransfer.getData('text/plain'), gridBlock, zone.dataset.gridColumn);
            });
        });

        card.querySelectorAll('.grid-child-card').forEach(childCard => {
            childCard.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', childCard.dataset.childId);
                childCard.classList.add('dragging');
            });
            childCard.addEventListener('dragend', () => {
                childCard.classList.remove('dragging');
            });
        });

        card.querySelectorAll('[data-action="remove-grid-child"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeGridChild(btn.dataset.columnId, btn.dataset.childId);
            });
        });

        card.querySelectorAll('[data-action="remove-grid-column"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeGridColumn(gridBlock, btn.dataset.columnId);
            });
        });
    }

    // ── Edit mode ────────────────────────────────────────────
    function toggleEdit(block, card) {
        const body = card.querySelector('.block-body');
        const def = BLOCK_TYPES[block.type];

        // If already editing, close
        if (body.querySelector('.edit-form')) {
            renderBlocks();
            return;
        }

        body.innerHTML = `<div class="edit-form">${def.editForm(block)}</div><div class="form-actions"><button class="btn btn-sm btn-primary" data-action="save">Сохранить</button><button class="btn btn-sm btn-ghost" data-action="cancel">Отмена</button></div>`;

        // Bind form events
        const form = body.querySelector('.edit-form');
        bindFormEvents(block, form, body);

        body.querySelector('[data-action="save"]').addEventListener('click', () => {
            readFormData(block, form);
            renderBlocks();
            updatePreview();
        });
        body.querySelector('[data-action="cancel"]').addEventListener('click', () => renderBlocks());
    }

    function bindFormEvents(block, form, body) {
        // Generic field bindings
        form.querySelectorAll('[data-field]').forEach(el => {
            el.addEventListener('input', () => {
                // Live update block data on input for instant feedback
            });
        });

        form.querySelectorAll('[data-action="insert-agree-link"]').forEach(btn => {
            btn.addEventListener('click', () => insertAgreeLinkFromSelection(block, form, btn));
        });

        form.querySelectorAll('[data-grid-field]').forEach(select => {
            select.addEventListener('change', () => {
                if (block.type !== 'grid') {
                    return;
                }

                if (select.dataset.gridField === 'sectionCount') {
                    updateGridSectionCount(block, parseInt(select.value, 10));
                } else if (select.dataset.gridField === 'pcPattern') {
                    updateGridPcPattern(block, select.value);
                } else if (select.dataset.gridField === 'mobilePerRow') {
                    updateGridMobilePerRow(block, select.value);
                }
            });
        });

        // List add/remove items
        form.querySelectorAll('[data-action="add-item"]').forEach(btn => {
            btn.addEventListener('click', () => {
                block.data.items.push('Новый пункт');
                toggleEdit(block, btn.closest('.block-card'));
            });
        });
        form.querySelectorAll('[data-action="remove-item"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                block.data.items.splice(idx, 1);
                toggleEdit(block, btn.closest('.block-card'));
            });
        });

        // Table actions
        form.querySelectorAll('[data-action="add-col"]').forEach(btn => {
            btn.addEventListener('click', () => {
                block.data.headers.push('Новый столбец');
                block.data.rows.forEach(row => row.push(''));
                toggleEdit(block, btn.closest('.block-card'));
            });
        });
        form.querySelectorAll('[data-action="add-row"]').forEach(btn => {
            btn.addEventListener('click', () => {
                block.data.rows.push(new Array(block.data.headers.length).fill(''));
                toggleEdit(block, btn.closest('.block-card'));
            });
        });
        form.querySelectorAll('[data-action="remove-col"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (block.data.headers.length <= 1) return;
                block.data.headers.pop();
                block.data.rows.forEach(row => row.pop());
                toggleEdit(block, btn.closest('.block-card'));
            });
        });
        form.querySelectorAll('[data-action="remove-row"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (block.data.rows.length <= 1) return;
                block.data.rows.pop();
                toggleEdit(block, btn.closest('.block-card'));
            });
        });

        // Tabs actions
        form.querySelectorAll('[data-action="add-tab"]').forEach(btn => {
            btn.addEventListener('click', () => {
                block.data.tabs.push({ title: 'Новая вкладка', text: '' });
                toggleEdit(block, btn.closest('.block-card'));
            });
        });
        form.querySelectorAll('[data-action="remove-tab"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                block.data.tabs.splice(idx, 1);
                toggleEdit(block, btn.closest('.block-card'));
            });
        });

        // Table cell inputs
        form.querySelectorAll('.table-editor input').forEach(input => {
            input.addEventListener('input', () => {
                const ri = input.dataset.row;
                const ci = input.dataset.col;
                if (ri !== undefined && ci !== undefined) {
                    block.data.rows[parseInt(ri)][parseInt(ci)] = input.value;
                } else if (ci !== undefined) {
                    block.data.headers[parseInt(ci)] = input.value;
                }
            });
        });

        // Tab title/text inputs
        form.querySelectorAll('[data-tab-title]').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.tabTitle);
                block.data.tabs[idx].title = input.value;
            });
        });
        form.querySelectorAll('[data-tab-text]').forEach(textarea => {
            textarea.addEventListener('input', () => {
                const idx = parseInt(textarea.dataset.tabText);
                block.data.tabs[idx].text = textarea.value;
            });
        });

        // Image local file input handler
        form.querySelectorAll('.img-local-file-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(evt) {
                    const base64 = evt.target.result;
                    block.data.localSrc = base64;
                    
                    const hiddenInput = form.querySelector('[data-field="localSrc"]');
                    if (hiddenInput) {
                        hiddenInput.value = base64;
                    }
                    
                    let thumb = form.querySelector('.img-local-thumb');
                    if (!thumb) {
                        thumb = document.createElement('div');
                        thumb.className = 'img-local-thumb';
                        thumb.style.marginTop = '6px';
                        input.parentNode.appendChild(thumb);
                    }
                    thumb.innerHTML = `<img src="${base64}" style="max-height:80px;border-radius:4px;display:block;">`;
                    updatePreview();
                };
                reader.readAsDataURL(file);
            });
        });

        // Image source type change handler
        form.querySelectorAll('.img-src-type-select').forEach(select => {
            select.addEventListener('change', () => {
                const type = select.value;
                block.data.srcType = type;
                
                const pathGroup = form.querySelector('.img-src-path-group');
                const localGroup = form.querySelector('.img-src-local-group');
                
                if (pathGroup && localGroup) {
                    pathGroup.style.display = type === 'path' ? 'block' : 'none';
                    localGroup.style.display = type === 'local' ? 'block' : 'none';
                }
                updatePreview();
            });
        });

        // Link type change handler
        form.querySelectorAll('.link-type-select').forEach(select => {
            select.addEventListener('change', () => {
                const type = select.value;
                block.data.linkType = type;
                block.data.isPopup = (type === 'popup');
                
                const regularGroup = form.querySelector('.regular-link-group');
                const popupGroup = form.querySelector('.popup-link-group');
                
                if (regularGroup && popupGroup) {
                    regularGroup.style.display = type === 'regular' ? 'block' : 'none';
                    popupGroup.style.display = type === 'popup' ? 'block' : 'none';
                }
                
                if (type === 'popup' && !block.data.infoId) {
                    block.data.infoId = '5';
                    const infoInput = form.querySelector('[data-field="infoId"]');
                    if (infoInput) infoInput.value = '5';
                }
                updatePreview();
            });
        });

        // Popup ID input live link preview generator helper
        form.querySelectorAll('[data-field="infoId"]').forEach(input => {
            input.addEventListener('input', () => {
                const codeEl = form.querySelector('.generated-popup-link');
                if (codeEl) {
                    codeEl.textContent = `/index.php?route=information/information/agree&information_id=${input.value || 'ID'}`;
                }
            });
        });

        // Popup block style change handler (button options toggle)
        form.querySelectorAll('.popup-style-select').forEach(select => {
            select.addEventListener('change', () => {
                const type = select.value;
                const optionsGroup = form.querySelector('.popup-btn-options');
                if (optionsGroup) {
                    optionsGroup.style.display = type === 'button' ? 'block' : 'none';
                }
                updatePreview();
            });
        });
    }

    function readFormData(block, form) {
        form.querySelectorAll('[data-field]').forEach(el => {
            const field = el.dataset.field;
            if (el.tagName === 'SELECT' && field === 'level') {
                block.data[field] = parseInt(el.value);
            } else {
                block.data[field] = el.value;
            }
        });
        form.querySelectorAll('[data-item]').forEach(el => {
            block.data.items[parseInt(el.dataset.item)] = el.value;
        });
    }

    // ── Live preview ─────────────────────────────────────────
    let previewTimer = null;
    let previewWindow = null;

    function updateNewWindowContent() {
        if (!previewWindow || previewWindow.closed) return;
        
        const title = titleInput.value || 'Превью статьи';
        const { tocHTML, contentHTML } = renderArticleParts('preview');

        const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} — Превью</title>
    <base href="${window.location.href}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="css/constructor.css">
    <style>
        body { background: #fff; padding: 40px 20px; overflow-y: auto; height: auto; }
        .new-window-preview-container { max-width: 900px; margin: 0 auto; width: 100%; }
    </style>
</head>
<body>
    <div class="preview-content new-window-preview-container">
        ${tocHTML}
        <div class="description">
            ${contentHTML}
        </div>
    </div>
</body>
</html>`;

        try {
            previewWindow.document.open();
            previewWindow.document.write(html);
            previewWindow.document.close();
        } catch (e) {
            console.error('Ошибка обновления нового окна:', e);
        }
    }

    function updatePreview() {
        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
            if (blocks.length === 0) {
                previewContent.innerHTML = '<p class="preview-empty">Превью появится после добавления блоков</p>';
                return;
            }
            const { tocHTML, contentHTML } = renderArticleParts('preview');
            previewContent.innerHTML = tocHTML + '<div class="description">\n' + contentHTML + '</div>';
            
            if (previewWindow && !previewWindow.closed) {
                updateNewWindowContent();
            }
        }, 200);
    }

    // ── Slug auto-update & Domain changes ────────────────────
    titleInput.addEventListener('input', () => {
        slugInput.value = slugify(titleInput.value);
    });

    const domainInput = $('#articleDomain');
    if (domainInput) {
        domainInput.addEventListener('input', () => {
            updatePreview();
        });
    }

    // ── Fullscreen Preview Toggle ────────────────────────────
    const btnToggleFullscreen = $('#btnToggleFullscreen');
    const btnHidePreview   = $('#btnHidePreview');
    const btnShowPreview   = $('#btnShowPreview');
    const previewPanel     = $('#previewPanel');
    function resetPreviewFullscreen() {
        if (!previewPanel || !btnToggleFullscreen) return;

        previewPanel.classList.remove('fullscreen');
        const icon = btnToggleFullscreen.querySelector('i');
        if (icon) {
            icon.classList.replace('fa-compress', 'fa-expand');
        }
        btnToggleFullscreen.title = 'Развернуть на весь экран';
    }

    function setPreviewHidden(hidden) {
        document.body.classList.toggle('preview-hidden', hidden);

        // Update toggle button state
        if (btnHidePreview) {
            const icon  = btnHidePreview.querySelector('i');
            const label = btnHidePreview.querySelector('.preview-toggle-label');
            if (hidden) {
                if (icon)  { icon.className = 'fa fa-eye'; }
                if (label) { label.textContent = 'Показать'; }
                btnHidePreview.classList.add('is-hidden');
                btnHidePreview.title = 'Показать превью';
            } else {
                if (icon)  { icon.className = 'fa fa-eye-slash'; }
                if (label) { label.textContent = 'Скрыть'; }
                btnHidePreview.classList.remove('is-hidden');
                btnHidePreview.title = 'Скрыть превью';
            }
        }

        if (hidden) {
            resetPreviewFullscreen();
        } else {
            updatePreview();
        }
    }

    if (btnToggleFullscreen && previewPanel) {
        btnToggleFullscreen.addEventListener('click', () => {
            const isFullscreen = previewPanel.classList.toggle('fullscreen');
            const icon = btnToggleFullscreen.querySelector('i');
            if (icon) {
                if (isFullscreen) {
                    icon.classList.replace('fa-expand', 'fa-compress');
                    btnToggleFullscreen.title = 'Свернуть превью';
                } else {
                    icon.classList.replace('fa-compress', 'fa-expand');
                    btnToggleFullscreen.title = 'Развернуть на весь экран';
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && previewPanel.classList.contains('fullscreen')) {
                previewPanel.classList.remove('fullscreen');
                const icon = btnToggleFullscreen.querySelector('i');
                if (icon) {
                    icon.classList.replace('fa-compress', 'fa-expand');
                    btnToggleFullscreen.title = 'Развернуть на весь экран';
                }
            }
        });
    }

    if (btnHidePreview) {
        btnHidePreview.addEventListener('click', () => {
            const isHidden = document.body.classList.contains('preview-hidden');
            setPreviewHidden(!isHidden);
        });
    }

    if (btnShowPreview) {
        btnShowPreview.addEventListener('click', () => {
            const isHidden = document.body.classList.contains('preview-hidden');
            setPreviewHidden(!isHidden);
        });
    }

    // ── Open in New Window ───────────────────────────────────
    const btnOpenNewWindow = $('#btnOpenNewWindow');
    if (btnOpenNewWindow) {
        btnOpenNewWindow.addEventListener('click', () => {
            if (previewWindow && !previewWindow.closed) {
                previewWindow.focus();
                updateNewWindowContent();
            } else {
                previewWindow = window.open('', '_blank');
                setTimeout(updateNewWindowContent, 50);
            }
        });
    }

    // ── Block palette clicks ─────────────────────────────────
    $$('.block-btn').forEach(btn => {
        btn.addEventListener('click', () => addBlock(btn.dataset.blockType));
    });

    // ── Tab switching (event delegation) ─────────────────────
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.article-tabs-nav button');
        if (!btn) return;
        const nav = btn.parentNode;
        const wrapper = nav.parentNode;
        const panels = wrapper.querySelector('.article-tabs-panels');
        if (!panels) return;
        const idx = btn.dataset.tab;
        // deactivate all
        nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        panels.querySelectorAll('.article-tabs-panel').forEach(p => p.style.display = 'none');
        // activate clicked
        btn.classList.add('active');
        panels.children[parseInt(idx)].style.display = 'block';
    });

    // ── Copy HTML to Clipboard ───────────────────────────────
    $('#btnCopyHTML').addEventListener('click', () => {
        const { tocHTML, contentHTML } = renderArticleParts('toHTML');

        const cleanHTML = `${tocHTML}<div class="description">\n${contentHTML}</div>`;

        navigator.clipboard.writeText(cleanHTML).then(() => {
            const btn = $('#btnCopyHTML');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<span class="btn-icon"><i class="fa fa-check"></i></span> Скопировано!';
            btn.style.background = '#2ecc71';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '#27ae60';
            }, 2000);
        }).catch(err => {
            console.error('Не удалось скопировать текст: ', err);
            alert('Не удалось скопировать автоматически. Скопируйте код из экспортированного файла.');
        });
    });

    // ── Copy Slug to Clipboard ────────────────────────────────
    const btnCopySlug = $('#btnCopySlug');
    if (btnCopySlug) {
        btnCopySlug.addEventListener('click', () => {
            const slug = slugInput.value.trim();
            if (!slug) return;
            navigator.clipboard.writeText(slug).then(() => {
                btnCopySlug.classList.add('copied');
                btnCopySlug.innerHTML = '<i class="fa fa-check"></i>';
                setTimeout(() => {
                    btnCopySlug.classList.remove('copied');
                    btnCopySlug.innerHTML = '<i class="fa fa-clone"></i>';
                }, 2000);
            }).catch(() => {
                alert('Не удалось скопировать slug.');
            });
        });
    }

    // ── Export TXT (Clean HTML for OpenCart) ─────────────────
    const btnExportTXT = $('#btnExportTXT');
    if (btnExportTXT) {
        btnExportTXT.addEventListener('click', () => {
            const title = titleInput.value || 'Статья';
            const slug = slugInput.value || slugify(title) || 'article';

            const { tocHTML, contentHTML } = renderArticleParts('toHTML');

            const cleanHTML = `${tocHTML}<div class="description">\n${contentHTML}</div>`;
            downloadFile(cleanHTML, `content-${slug}.txt`, 'text/plain');
        });
    }

    // ── Export HTML ──────────────────────────────────────────
    $('#btnExportHTML').addEventListener('click', () => {
        const title = titleInput.value || 'Контент';
        const slug = slugInput.value || slugify(title) || 'content';
        const cssFile = `content-constructor.css`;

        const { tocHTML, contentHTML } = renderArticleParts('toHTML');

        const fullHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="${cssFile}">
</head>
<body>
${tocHTML}<div class="description">
${contentHTML}</div>
</body>
</html>`;

        downloadFile(fullHTML, `content-${slug}.html`, 'text/html');
    });

    // ── Export CSS ───────────────────────────────────────────
    $('#btnExportCSS').addEventListener('click', () => {
        const css = getExportedCSS();
        downloadFile(css, `content-constructor.css`, 'text/css');
    });

    function getExportedCSS() {
        return `/* content-constructor.css — Стили для разметки */
/* Генерировано OpenCart Content Constructor */

:root {
    --description-font: 'Venryn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --description-font-bold: 'Venryn Bold', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --background_main_color: #F3F2FF;
    --background_additional_color: #F9F8FF;
    --accent_background_color: #5446f8;
    --main_color: #1A1A1A;
    --additional_color: #3e3e3e;
}

@font-face {
    font-family: 'Venryn';
    src: url('fonts/VenrynSans-Regular.woff?v=1.0.3') format('woff');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
@font-face {
    font-family: 'Venryn Bold';
    src: url('fonts/VenrynSans-SemiBold.woff?v=1.0.3') format('woff');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
}

/* --- Оглавление (TOC) --- */
.blog-content {
    background-color: var(--background_main_color, #F3F2FF);
    padding: 20px;
    border-radius: 5px;
    margin-bottom: 25px;
}
.blog-content .menu-content-title {
    font-family: var(--description-font-bold), sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: var(--main_color, #1A1A1A);
    margin: 0px;
    padding: 0px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.blog-content ul {
    list-style-type: disc;
    padding: 0px 0px 0px 25px;
    margin: 15px 0px 10px;
}
.blog-content ul li {
    margin-bottom: 5px;
}
.blog-content ul li a.anchor {
    color: var(--main_color, #1A1A1A);
    text-decoration: none;
    font-family: var(--description-font), sans-serif;
    font-size: 14px;
    transition: color 0.2s;
}
.blog-content ul li a.anchor:hover {
    color: var(--accent_background_color, #5446f8);
    text-decoration: underline;
}
.blog-content .ogli3 {
    list-style-type: circle;
    padding: 0px 0px 0px 25px;
    margin: 15px 0px 0px;
}

/* --- Базовые стили контента --- */
.description {
    font-family: var(--description-font), sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: var(--main_color, #1A1A1A);
    text-align: justify;
    word-wrap: break-word;
}

.description h1 {
    font-family: var(--description-font-bold), sans-serif;
    font-size: 32px;
    font-weight: 500;
    margin: 0 0 20px 0;
    color: #2c2c2c;
    line-height: 1.2;
}

.description h2 {
    font-family: var(--description-font-bold), sans-serif;
    font-size: 27px;
    font-weight: 500;
    margin: 20px 0px 25px;
    color: #2c2c2c;
    line-height: 1.2;
    padding-bottom: 0;
    border-bottom: none;
    text-align: left;
}

.description h3 {
    font-family: var(--description-font-bold), sans-serif;
    font-size: 21px;
    font-weight: 500;
    margin: 20px 0px 10px;
    color: #2c2c2c;
    line-height: 1.2;
    text-align: left;
}

.description p {
    margin: 0 0 10px 0;
    text-indent: 15px;
    line-height: 1.5;
}

.description .article-grid-row {
    margin-top: 20px;
    margin-bottom: 20px;
}

.description .article-grid-row p:first-child {
    margin-top: 0;
}

.description .row {
    margin-left: -15px;
    margin-right: -15px;
}

.description .row:before,
.description .row:after {
    content: " ";
    display: table;
}

.description .row:after {
    clear: both;
}

.description [class*="col-xs-"],
.description [class*="col-md-"] {
    position: relative;
    min-height: 1px;
    padding-left: 15px;
    padding-right: 15px;
}

.description .col-xs-6,
.description .col-xs-12 {
    float: left;
}

.description .col-xs-6 {
    width: 50%;
}

.description .col-xs-12 {
    width: 100%;
}

@media (min-width: 992px) {
    .description .col-md-3,
    .description .col-md-4,
    .description .col-md-6,
    .description .col-md-8,
    .description .col-md-9,
    .description .col-md-12 {
        float: left;
    }

    .description .col-md-3 {
        width: 25%;
    }

    .description .col-md-4 {
        width: 33.33333333%;
    }

    .description .col-md-6 {
        width: 50%;
    }

    .description .col-md-8 {
        width: 66.66666667%;
    }

    .description .col-md-9 {
        width: 75%;
    }

    .description .col-md-12 {
        width: 100%;
    }
}

.description b,
.description strong {
    font-family: var(--description-font-bold), sans-serif;
    font-weight: 500;
}

.description a {
    color: var(--accent_background_color, #5446f8);
    text-decoration: underline;
}

.description a:hover {
    color: var(--accent_background_color, #5446f8);
    text-decoration: underline;
}

.description .btn-popup-action {
    display: inline-block;
    background: var(--accent_background_color, #5446f8);
    color: #fff;
    padding: 10px 24px;
    border-radius: 5px;
    text-decoration: none;
    font-family: var(--description-font-bold), sans-serif;
    font-weight: 500;
    transition: background 0.2s;
}
.description .btn-popup-action:hover {
    background: #3e30d6 !important;
    color: #fff !important;
    text-decoration: none !important;
}
.description .link-popup-action {
    color: var(--accent_background_color, #5446f8);
    text-decoration: underline;
    font-family: var(--description-font-bold), sans-serif;
    font-weight: 500;
}

/* --- Цитаты (blockquote) --- */
.description blockquote {
    font-family: var(--description-font), sans-serif;
    font-size: 16px;
    margin: 30px 0px;
    padding: 10px 20px;
    border-left: 5px solid var(--accent_background_color, #5446f8);
    background: transparent;
    border-top: none;
    border-right: none;
    border-bottom: none;
    border-radius: 0;
    font-style: normal;
    color: var(--main_color, #1A1A1A);
}

.description blockquote p {
    margin: 0;
}

/* --- Таблицы --- */
.table-responsive {
    width: 100%;
    overflow-x: auto;
    margin: 20px 0;
}

.description table {
    width: 100%;
    border-collapse: collapse;
    font-size: 16px;
    text-align: left;
    line-height: 1.3;
    margin-bottom: 30px;
}

.description table th,
.description table td {
    border: 1px solid var(--background_main_color, #F3F2FF);
    padding: 5px;
    text-align: left;
    font-size: 16px;
}

.description table th {
    background: var(--background_main_color, #F3F2FF);
    font-family: var(--description-font-bold), sans-serif;
    font-weight: 500;
}

.description table tbody tr td {
    background: #ffffff;
}

/* --- Списки --- */
.description ul,
.description ol {
    margin: 0 0 10px 0;
    padding-left: 40px;
}

.description li {
    margin-bottom: 0px;
    text-indent: 0px;
}

/* --- Спойлеры / Аккордеоны (details/summary) --- */
.description details {
    margin: 16px 0;
    border: 1px solid var(--background_main_color, #F3F2FF);
    border-radius: 5px;
    background: var(--background_additional_color, #F9F8FF);
}

.description details summary {
    font-family: var(--description-font-bold), sans-serif;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    padding: 10px 30px;
    transition: color 0.2s;
    position: relative;
    list-style: none;
}

.description details summary::-webkit-details-marker {
    display: none;
}

.description details summary::after {
    content: "▶";
    font-size: 0.8em;
    left: 10px;
    color: var(--accent_background_color, #5446f8);
    transition: transform 0.2s;
    position: absolute;
    top: 13px;
}

.description details[open] summary::after {
    content: "▼";
}

.description details summary + p,
.description details > *:not(summary) {
    padding: 5px 30px;
    background: rgb(255, 255, 255);
    margin: 0px;
    text-indent: 0px !important;
}

.description details > p:last-child,
.description details > ul:last-child,
.description details > ol:last-child,
.description details > dl:last-child {
    padding-bottom: 10px;
}

/* --- Вкладки (Tabs) --- */
.article-tabs {
    margin: 20px 0;
}

.article-tabs-nav {
    display: flex;
    gap: 4px;
    border-bottom: 2px solid #eee;
}

.article-tabs-nav button {
    padding: 10px 20px;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    transition: all .15s;
}

.article-tabs-nav button.active {
    background: #fff;
    color: #4a90d9;
    border-color: #ddd;
    border-bottom-color: #fff;
    margin-bottom: -2px;
}

.article-tabs-panels {
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 6px 6px;
}

.article-tabs-panel {
    padding: 16px 20px;
}

/* --- Изображения --- */
.description img.img-responsive {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
    border-radius: 4px;
}

/* --- Код --- */
.description code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
    color: #c7254e;
}

/* --- Адаптивность --- */
@media (max-width: 768px) {
    .description {
        font-size: 15px;
    }

    .description h1 { font-size: 24px; }
    .description h2 { font-size: 20px; }
    .description h3 { font-size: 17px; }

    .description table {
        font-size: 13px;
        min-width: 300px;
    }

    .description table th,
    .description table td {
        padding: 8px 10px;
    }

    .article-tabs-nav button {
        padding: 8px 14px;
        font-size: 13px;
    }

    .article-tabs-panel {
        padding: 12px 14px;
    }
}`;
    }

    // ── Download helper ──────────────────────────────────────
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Help Modal Handlers ──────────────────────────────────
    const btnHelp = $('#btnHelp');
    const helpModal = $('#helpModal');
    const btnCloseHelp = $('#btnCloseHelp');

    if (btnHelp && helpModal && btnCloseHelp) {
        btnHelp.addEventListener('click', () => {
            helpModal.style.display = 'flex';
        });

        btnCloseHelp.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });

        // Close on overlay click
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.style.display = 'none';
            }
        });

        // Help Modal Tab Switcher
        const helpTabsNav = helpModal.querySelector('.help-tabs-nav');
        if (helpTabsNav) {
            const tabBtns = helpTabsNav.querySelectorAll('.help-tab-btn');
            const tabContents = helpModal.querySelectorAll('.help-tab-content');

            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetTab = btn.getAttribute('data-help-tab');
                    
                    // Toggle active buttons
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Toggle active contents
                    tabContents.forEach(content => {
                        if (content.id === targetTab) {
                            content.style.display = 'block';
                        } else {
                            content.style.display = 'none';
                        }
                    });
                });
            });
        }
    }

    // ── Donate Modal Handlers ────────────────────────────────
    const btnDonate = $('#btnDonate');
    const donateModal = $('#donateModal');
    const btnCloseDonate = $('#btnCloseDonate');

    if (btnDonate && donateModal && btnCloseDonate) {
        btnDonate.addEventListener('click', () => {
            donateModal.style.display = 'flex';
        });

        btnCloseDonate.addEventListener('click', () => {
            donateModal.style.display = 'none';
        });

        donateModal.addEventListener('click', (e) => {
            if (e.target === donateModal) {
                donateModal.style.display = 'none';
            }
        });

        // Copy actions for payment elements
        donateModal.querySelectorAll('.btn-copy-payment').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-copy-target');
                const targetEl = $('#' + targetId);
                if (targetEl) {
                    let text = targetEl.textContent.trim();
                    if (targetId === 'valYoomoneyCard') {
                        text = text.replace(/\s+/g, ''); // strip spaces for card numbers
                    }
                    
                    const copyText = (str) => {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            return navigator.clipboard.writeText(str);
                        } else {
                            const textarea = document.createElement('textarea');
                            textarea.value = str;
                            textarea.style.position = 'fixed';
                            textarea.style.opacity = '0';
                            document.body.appendChild(textarea);
                            textarea.select();
                            try {
                                document.execCommand('copy');
                                document.body.removeChild(textarea);
                                return Promise.resolve();
                            } catch (e) {
                                document.body.removeChild(textarea);
                                return Promise.reject(e);
                            }
                        }
                    };
                    copyText(text).then(() => {
                        const icon = btn.querySelector('i');
                        btn.classList.add('copied');
                        if (icon) {
                            icon.className = 'fa fa-check';
                        }
                        
                        setTimeout(() => {
                            btn.classList.remove('copied');
                            if (icon) {
                                icon.className = 'fa fa-clone';
                            }
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy: ', err);
                    });
                }
            });
        });
    }

    // Dynamic downloads of OCMOD files
    const btnDownloadZip = $('#btnDownloadZip');
    if (btnDownloadZip) {
        btnDownloadZip.addEventListener('click', () => {
            if (typeof JSZip === 'undefined') {
                alert('Библиотека JSZip не загружена. Проверьте подключение к интернету.');
                return;
            }

            const zip = new JSZip();

            // 1. Add install.xml (combined modification)
            const installXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<modification>
    <name>OpenCart Content Constructor - Integration Package</name>
    <code>content_constructor_integration</code>
    <version>1.0</version>
    <author>Tom</author>
    <link>https://opencartforum.com.ru/</link>

    <!-- 1. Summernote Import Button in Admin Panel Footer -->
    <file path="admin/view/template/common/footer.twig">
        <operation>
            <search><![CDATA[</body>]]></search>
            <add position="before"><![CDATA[
<script type="text/javascript"><!--
(function($) {
  if (typeof $.fn.summernote !== 'undefined') {
    var originalSummernote = $.fn.summernote;
    $.fn.summernote = function(options) {
      if (typeof options === 'object') {
        options.buttons = options.buttons || {};
        options.buttons.import_constructor = function(context) {
          var ui = $.summernote.ui;
          var $note = context.$note;
          var button = ui.button({
            contents: '<i class="fa fa-file-text-o" style="color: #27ae60; font-weight: bold;" />',
            tooltip: 'Импортировать из Конструктора (.txt / .html)',
            click: function () {
              var fileInput = $('<input type="file" accept=".txt,.html" style="display:none">');
              $('body').append(fileInput);
              fileInput.click();
              fileInput.on('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(evt) {
                  var contents = evt.target.result;
                  if (contents.indexOf('<body') !== -1) {
                    var match = contents.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                    if (match && match[1]) {
                      contents = match[1];
                    }
                  }
                  contents = contents.trim();
                  if (confirm('Очистить редактор перед импортом?\\nНажмите "ОК" для полной замены текста.\\nНажмите "Отмена" для вставки в текущую позицию курсора.')) {
                    $note.summernote('code', contents);
                  } else {
                    $note.summernote('pasteHTML', contents);
                  }
                };
                reader.readAsText(file);
                fileInput.remove();
              });
            }
          });
          return button.render();
        };
        if (options.toolbar) {
          for (var i = 0; i < options.toolbar.length; i++) {
            if (options.toolbar[i][0] === 'insert') {
              if (options.toolbar[i][1].indexOf('import_constructor') === -1) {
                options.toolbar[i][1].push('import_constructor');
              }
              break;
            }
          }
        }
      }
      return originalSummernote.apply(this, arguments);
    };
  }
})(jQuery);
//--></script>
            ]]></add>
        </operation>
    </file>

    <!-- 2. Storefront Stylesheet Link Injection -->
    <file path="catalog/view/template/common/header.twig">
        <operation>
            <search><![CDATA[</head>]]></search>
            <add position="before"><![CDATA[
<link href="catalog/view/theme/default/stylesheet/content-constructor.css" rel="stylesheet" />
            ]]></add>
        </operation>
    </file>
</modification>`;

            zip.file("install.xml", installXmlContent);
            zip.file("upload/catalog/view/theme/default/stylesheet/content-constructor.css", getExportedCSS());

            btnDownloadZip.disabled = true;
            btnDownloadZip.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Сборка...';

            const font1Promise = fetch('css/VenrynSans-Regular.woff?v=1.0.3').then(res => res.arrayBuffer());
            const font2Promise = fetch('css/VenrynSans-SemiBold.woff?v=1.0.3').then(res => res.arrayBuffer());

            Promise.all([font1Promise, font2Promise]).then(([font1Data, font2Data]) => {
                zip.file("upload/catalog/view/theme/default/stylesheet/fonts/VenrynSans-Regular.woff", font1Data);
                zip.file("upload/catalog/view/theme/default/stylesheet/fonts/VenrynSans-SemiBold.woff", font2Data);

                return zip.generateAsync({ type: "blob" });
            }).then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'content_constructor.ocmod.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                btnDownloadZip.disabled = false;
                btnDownloadZip.innerHTML = '<i class="fa fa-file-archive-o"></i> Скачать .ocmod.zip';
            }).catch((err) => {
                console.error('Ошибка генерации архива:', err);
                alert('Не удалось сгенерировать ZIP-архив.');
                btnDownloadZip.disabled = false;
                btnDownloadZip.innerHTML = '<i class="fa fa-file-archive-o"></i> Скачать .ocmod.zip';
            });
        });
    }

    const btnDownloadImportXml = $('#btnDownloadImportXml');
    if (btnDownloadImportXml) {
        btnDownloadImportXml.addEventListener('click', () => {
            const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<modification>
    <name>OpenCart Content Constructor - Summernote Import</name>
    <code>content_constructor_import</code>
    <version>1.0</version>
    <author>Tom</author>
    <link>https://opencartforum.com.ru/</link>
    <file path="admin/view/template/common/footer.twig">
        <operation>
            <search><![CDATA[</body>]]></search>
            <add position="before"><![CDATA[
<script type="text/javascript"><!--
(function($) {
  if (typeof $.fn.summernote !== 'undefined') {
    var originalSummernote = $.fn.summernote;
    $.fn.summernote = function(options) {
      if (typeof options === 'object') {
        options.buttons = options.buttons || {};
        options.buttons.import_constructor = function(context) {
          var ui = $.summernote.ui;
          var $note = context.$note;
          var button = ui.button({
            contents: '<i class="fa fa-file-text-o" style="color: #27ae60; font-weight: bold;" />',
            tooltip: 'Импортировать из Конструктора (.txt / .html)',
            click: function () {
              var fileInput = $('<input type="file" accept=".txt,.html" style="display:none">');
              $('body').append(fileInput);
              fileInput.click();
              fileInput.on('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(evt) {
                  var contents = evt.target.result;
                  if (contents.indexOf('<body') !== -1) {
                    var match = contents.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                    if (match && match[1]) {
                      contents = match[1];
                    }
                  }
                  contents = contents.trim();
                  if (confirm('Очистить редактор перед импортом?\\nНажмите "ОК" для полной замены текста.\\nНажмите "Отмена" для вставки в текущую позицию курсора.')) {
                    $note.summernote('code', contents);
                  } else {
                    $note.summernote('pasteHTML', contents);
                  }
                };
                reader.readAsText(file);
                fileInput.remove();
              });
            }
          });
          return button.render();
        };
        if (options.toolbar) {
          for (var i = 0; i < options.toolbar.length; i++) {
            if (options.toolbar[i][0] === 'insert') {
              if (options.toolbar[i][1].indexOf('import_constructor') === -1) {
                options.toolbar[i][1].push('import_constructor');
              }
              break;
            }
          }
        }
      }
      return originalSummernote.apply(this, arguments);
    };
  }
})(jQuery);
//--></script>
            ]]></add>
        </operation>
    </file>
</modification>`;
            downloadFile(xmlContent, 'content_constructor.ocmod.xml', 'text/xml');
        });
    }

    const btnDownloadStylesXml = $('#btnDownloadStylesXml');
    if (btnDownloadStylesXml) {
        btnDownloadStylesXml.addEventListener('click', () => {
            const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<modification>
    <name>OpenCart Content Constructor - Global Stylesheet</name>
    <code>content_constructor_styles</code>
    <version>1.0</version>
    <author>Tom</author>
    <link>https://opencartforum.com.ru/</link>
    <file path="catalog/view/template/common/header.twig">
        <operation>
            <search><![CDATA[</head>]]></search>
            <add position="before"><![CDATA[
<link href="catalog/view/theme/default/stylesheet/content-constructor.css" rel="stylesheet" />
            ]]></add>
        </operation>
    </file>
</modification>`;
            downloadFile(xmlContent, 'content_styles.ocmod.xml', 'text/xml');
        });
    }

    // ── Initial Render ───────────────────────────────────────
    renderBlocks();
    updatePreview();

})();
