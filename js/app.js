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

        const html = mode === 'preview' ? def.preview(block, allBlocks) : def.toHTML(block, allBlocks);

        if (mode === 'preview' && html.trim()) {
            return `<div class="preview-block-wrap" data-preview-id="${block.id}">${html}</div>`;
        }

        return html;
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

    function renderArticlePartsForBlocks(blocksList, mode) {
        let tocHTML = '';
        let contentHTML = '';

        blocksList.forEach(block => {
            const html = renderBlockContent(block, mode, blocksList);

            if (block.type === 'toc') {
                tocHTML += html + '\n';
            } else {
                contentHTML += '    ' + html + '\n';
            }
        });

        return { tocHTML, contentHTML };
    }

    function renderArticleParts(mode) {
        return renderArticlePartsForBlocks(blocks, mode);
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
            data: { level: 2, text: 'Пример заголовка' }
        },
        {
            id: uuid(),
            type: 'faq',
            data: {
                title: 'Часто задаваемые вопросы',
                items: [
                    { question: 'Можно ли использовать Apple Watch с Android?', answer: 'К сожалению, нет. Apple Watch жестко привязаны к экосистеме Apple. Для их первоначальной активации и полноценного использования требуется iPhone (модель 6s или новее).' },
                    { question: 'Можно ли плавать в часах Apple Watch?', answer: 'Да, все актуальные модели имеют влагозащиту.\n* SE и Series выдерживают погружение до 50 метров (подходят для бассейна).\n* Ultra поддерживают погружение до 100 метров и сертифицированы для рекреационного дайвинга на глубину до 40 метров.' },
                    { question: 'Какое время работы от батареи?', answer: 'Все актуальные модели работают до 18 часов в обычном режиме. Apple Watch Ultra 2 — до 36 часов. Быстрая зарядка позволяет полностью зарядить их за 1.5 часа.' },
                    { question: 'Есть ли в часах ЭКГ и измерение кислорода?', answer: 'Да, функции ЭКГ (ECG) и измерения уровня кислорода в крови (SpO2) доступны в моделях Series и Ultra. В модели SE эти функции отсутствуют.' },
                    { question: 'Какой размер дисплея лучше выбрать?', answer: 'Зависит от запястья:\n* 40/42 мм — для тонких запястий (от 130 мм)\n* 44/46 мм — средние и крупные запястья\n* 49 мм (Ultra) — для активного спорта и крупных запястий' }
                ]
            }
        },
        {
            id: uuid(),
            type: 'callout',
            data: {
                style: 'success',
                title: 'Руководство пользователя Apple Watch.pdf',
                text: 'Официальная полная инструкция по эксплуатации со всеми техническими характеристиками и описанием скрытых функций.',
                btnText: 'Скачать PDF',
                btnLink: '#',
                btnIcon: 'fa-file-pdf-o'
            }
        },
        {
            id: uuid(),
            type: 'callout',
            data: {
                style: 'info',
                title: 'Обратите внимание',
                text: 'Для работы функции ЭКГ необходимо, чтобы на вашем сопряженном iPhone была установлена последняя версия iOS.',
                btnText: 'Подробнее на Apple Support',
                btnLink: 'https://support.apple.com',
                btnIcon: 'fa-info-circle'
            }
        },
        {
            id: uuid(),
            type: 'callout',
            data: {
                style: 'warning',
                title: 'Важная рекомендация по эксплуатации',
                text: 'Не используйте неофициальные зарядные устройства во избежание перегрева аккумулятора и повреждения датчиков.',
                btnText: 'Оригинальные аксессуары',
                btnLink: '#',
                btnIcon: 'fa-exclamation-triangle'
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
            defaults: () => ({
                headers: ['Заголовок 1', 'Заголовок 2'],
                rows: [['Ячейка 1', 'Ячейка 2'], ['Ячейка 3', 'Ячейка 4']],
                striped: false,
                bordered: false,
                hover: false,
                condensed: false
            }),
            editForm(block) {
                const classes = [];
                if (block.data.striped) classes.push('table-striped');
                if (block.data.bordered) classes.push('table-bordered');
                if (block.data.hover) classes.push('table-hover');
                if (block.data.condensed) classes.push('table-condensed');
                const classStr = classes.join(' ');

                let html = `<div class="table-editor"><table class="${classStr}"><thead><tr>`;
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
                </div>`;

                // Add Bootstrap 3 style option checkboxes
                html += `<div class="table-styles-options" style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 12px; border-top: 1px dashed #eee; padding-top: 10px;">
                    <label style="display: flex; align-items: center; gap: 6px; font-weight: normal; cursor: pointer; font-size: 12px; margin: 0; user-select: none;">
                        <input type="checkbox" data-field="striped" ${block.data.striped ? 'checked' : ''}> Zebra (striped)
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; font-weight: normal; cursor: pointer; font-size: 12px; margin: 0; user-select: none;">
                        <input type="checkbox" data-field="bordered" ${block.data.bordered ? 'checked' : ''}> Сетка (bordered)
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; font-weight: normal; cursor: pointer; font-size: 12px; margin: 0; user-select: none;">
                        <input type="checkbox" data-field="hover" ${block.data.hover ? 'checked' : ''}> Подсветка (hover)
                    </label>
                    <label style="display: flex; align-items: center; gap: 6px; font-weight: normal; cursor: pointer; font-size: 12px; margin: 0; user-select: none;">
                        <input type="checkbox" data-field="condensed" ${block.data.condensed ? 'checked' : ''}> Компактная (condensed)
                    </label>
                </div></div>`;

                return html;
            },
            toHTML(block) {
                const classes = ['table'];
                if (block.data.striped) classes.push('table-striped');
                if (block.data.bordered) classes.push('table-bordered');
                if (block.data.hover) classes.push('table-hover');
                if (block.data.condensed) classes.push('table-condensed');

                const classStr = classes.join(' ');

                let html = `<div class="table-responsive"><table class="${classStr}"><thead><tr>`;
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

        faq: {
            label: 'FAQ',
            defaults: () => ({
                title: 'Часто задаваемые вопросы',
                items: [
                    { question: 'Сколько времени занимает замена линз?', answer: 'В среднем процедура установки линз занимает от 6 до 12 часов. В некоторых случаях срок может увеличиться до 2–3 дней.' },
                    { question: 'Какие линзы лучше выбрать: галоген, ксенон или Bi-LED?', answer: 'Bi-LED линзы — самый современный вариант. Они потребляют меньше энергии, работают до 50 000 часов, включаются мгновенно и не требуют блоков розжига. Ксенон требует времени для разогрева, а галоген уступает по яркости и долговечности.' },
                    { question: 'Что такое Bi-LED линзы?', answer: 'Bi-LED линзы — это оптические устройства, которые используют светодиоды (LED) в качестве источника света. Приставка «Bi» означает, что одна линза выполняет функции как ближнего, так и дальнего света.' },
                    { question: 'Какой световой поток у Bi-LED линз?', answer: 'Световой поток составляет от 3 000 до 4 000 лм на ближнем свете и от 5 000 до 8 000 лм на дальнем свете. Точные характеристики зависят от конкретной модели и производителя.' },
                    { question: 'Предоставляется ли гарантия на работу?', answer: 'Да, на работу и компоненты предоставляется гарантия до 2-х лет. После замены линз регулировка света проверяется и корректируется на стенде по ГОСТ.' },
                    { question: 'Нужно ли менять лампы после замены линз?', answer: 'Нет, при установке Bi-LED линз отдельные лампы не требуются — светодиоды уже встроены в модуль. Вы получаете полностью готовую к работе оптику.' },
                    { question: 'Сохраняется ли штатный функционал фар после замены?', answer: 'Да, все процедуры проводятся согласно техническому регламенту с полным сохранением функционала фар. Адаптивное освещение (AFS, AFLS, DLA, ILS) продолжает работать.' }
                ]
            }),
            editForm(block) {
                let html = `<div class="form-group"><label>Заголовок секции</label><input type="text" data-field="title" value="${escapeHtml(block.data.title)}"></div>`;
                html += `<div class="faq-editor">`;
                block.data.items.forEach((item, i) => {
                    html += `<div class="faq-editor-item">
                        <div class="faq-editor-header">
                            <span class="faq-editor-num">${i + 1}</span>
                            <input type="text" data-faq-question="${i}" value="${escapeHtml(item.question)}" placeholder="Вопрос">
                            <button class="btn btn-sm btn-ghost" data-action="remove-faq-item" data-index="${i}">&times;</button>
                        </div>
                        <textarea data-faq-answer="${i}" rows="3" placeholder="Ответ">${escapeHtml(item.answer)}</textarea>
                        ${agreeToolbarHtml()}
                    </div>`;
                });
                html += `</div><button class="btn btn-sm btn-ghost" data-action="add-faq-item">+ Добавить вопрос</button>`;
                return html;
            },
            toHTML(block) {
                const id = 'faq-' + block.id;
                let html = `<div class="article-faq" id="${id}">`;
                if (block.data.title) {
                    html += `<h2 class="article-faq-title">${escapeHtml(block.data.title)}</h2>`;
                }
                html += `<div class="article-faq-list">`;
                block.data.items.forEach((item, i) => {
                    html += `<div class="article-faq-item">
                        <div class="article-faq-question collapsed">${escapeHtml(item.question)}</div>
                        <div class="article-faq-collapse collapse">
                            <div class="article-faq-answer">${markdownToHtml(item.answer, false)}</div>
                        </div>
                    </div>`;
                });
                html += `</div></div>`;
                return html;
            },
            preview(block) {
                const id = 'preview-faq-' + block.id;
                let html = `<div class="article-faq" id="${id}">`;
                if (block.data.title) {
                    html += `<h2 class="article-faq-title">${escapeHtml(block.data.title)}</h2>`;
                }
                html += `<div class="article-faq-list">`;
                block.data.items.forEach((item, i) => {
                    html += `<div class="article-faq-item">
                        <div class="article-faq-question collapsed">${escapeHtml(item.question)}</div>
                        <div class="article-faq-collapse collapse">
                            <div class="article-faq-answer">${markdownToHtml(item.answer, true)}</div>
                        </div>
                    </div>`;
                });
                html += `</div></div>`;
                return html;
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
                    html += `<button type="button" class="article-tabs-btn ${i===0?'active':''}" data-tab="${i}">${escapeHtml(tab.title)}</button>`;
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
                    html += `<button type="button" class="article-tabs-btn ${i===0?'active':''}" data-tab="${i}">${escapeHtml(tab.title)}</button>`;
                });
                html += `</div><div class="article-tabs-panels">`;
                block.data.tabs.forEach((tab, i) => {
                    html += `<div class="article-tabs-panel" style="${i===0?'':'display:none'}">${markdownToHtml(tab.text, true)}</div>`;
                });
                html += `</div></div>`;
                return html;
            },
        },

        callout: {
            label: 'Инфо-блок',
            defaults: () => ({
                style: 'well',
                title: 'Шаблон статьи.zip',
                text: 'Описание файла или полезные инструкции к действию.',
                btnText: 'Скачать',
                btnLink: '#',
                btnIcon: 'fa-download'
            }),
            editForm(block) {
                return `
                    <div class="form-row">
                        <div class="form-group" style="flex:0 0 150px">
                            <label>Стиль оформления</label>
                            <select data-field="style">
                                <option value="well" ${block.data.style === 'well' ? 'selected' : ''}>Серый (Well)</option>
                                <option value="info" ${block.data.style === 'info' ? 'selected' : ''}>Синий (Info)</option>
                                <option value="success" ${block.data.style === 'success' ? 'selected' : ''}>Зеленый (Success)</option>
                                <option value="warning" ${block.data.style === 'warning' ? 'selected' : ''}>Желтый (Warning)</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex:0 0 150px">
                            <label>Иконка</label>
                            <select data-field="btnIcon">
                                <option value="fa-download" ${block.data.btnIcon === 'fa-download' ? 'selected' : ''}>Скачать (fa-download)</option>
                                <option value="fa-link" ${block.data.btnIcon === 'fa-link' ? 'selected' : ''}>Ссылка (fa-link)</option>
                                <option value="fa-file-pdf-o" ${block.data.btnIcon === 'fa-file-pdf-o' ? 'selected' : ''}>PDF (fa-file-pdf-o)</option>
                                <option value="fa-info-circle" ${block.data.btnIcon === 'fa-info-circle' ? 'selected' : ''}>Инфо (fa-info-circle)</option>
                                <option value="fa-exclamation-triangle" ${block.data.btnIcon === 'fa-exclamation-triangle' ? 'selected' : ''}>Внимание (fa-exclamation-triangle)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Заголовок плашки</label>
                        <input type="text" data-field="title" value="${escapeHtml(block.data.title)}">
                    </div>
                    <div class="form-group">
                        <label>Текст описания</label>
                        <textarea data-field="text" rows="3">${escapeHtml(block.data.text)}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Текст кнопки</label>
                            <input type="text" data-field="btnText" value="${escapeHtml(block.data.btnText)}">
                        </div>
                        <div class="form-group">
                            <label>Ссылка кнопки (URL)</label>
                            <input type="text" data-field="btnLink" value="${escapeHtml(block.data.btnLink)}">
                        </div>
                    </div>`;
            },
            toHTML(block) {
                const styleClass = block.data.style || 'well';
                const btnIcon = block.data.btnIcon || 'fa-download';
                const hasBtn = block.data.btnText ? true : false;
                
                let iconHTML = '';
                let btnIconHTML = '';
                
                if (styleClass === 'well') {
                    btnIconHTML = `<i class="fa ${escapeHtml(btnIcon)}"></i> `;
                } else {
                    iconHTML = `<i class="fa ${escapeHtml(btnIcon)}"></i> `;
                }

                return `<div class="article-callout style-${escapeHtml(styleClass)}">
    <div class="article-callout-row">
        <div class="article-callout-text-col">
            <h4 class="article-callout-title">${iconHTML}${escapeHtml(block.data.title)}</h4>
            <p class="article-callout-desc">${escapeHtml(block.data.text)}</p>
        </div>
        ${hasBtn ? `<div class="article-callout-btn-col">
            <a href="${escapeHtml(block.data.btnLink)}" class="article-callout-btn" target="_blank">${btnIconHTML}${escapeHtml(block.data.btnText)}</a>
        </div>` : ''}
    </div>
</div>`;
            },
            preview(block) {
                return this.toHTML(block);
            }
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

        alert: {
            label: 'Alert уведомление',
            defaults: () => ({
                style: 'info',
                text: 'Полезное примечание или совет...'
            }),
            editForm(block) {
                return `
                    <div class="form-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Тип предупреждения</label>
                            <select data-field="style">
                                <option value="info" ${block.data.style === 'info' ? 'selected' : ''}>Синий (Info)</option>
                                <option value="success" ${block.data.style === 'success' ? 'selected' : ''}>Зеленый (Success)</option>
                                <option value="warning" ${block.data.style === 'warning' ? 'selected' : ''}>Желтый (Warning)</option>
                                <option value="danger" ${block.data.style === 'danger' ? 'selected' : ''}>Красный (Danger)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Текст сообщения (поддерживает Markdown: **жирный**, *курсив*, [ссылка](url))</label>
                        <textarea data-field="text" rows="3">${escapeHtml(block.data.text)}</textarea>
                    </div>`;
            },
            toHTML(block) {
                const style = block.data.style || 'info';
                return `<div class="alert alert-${escapeHtml(style)}">${inlineFormat(block.data.text)}</div>`;
            },
            preview(block) {
                const style = block.data.style || 'info';
                return `<div class="alert alert-${escapeHtml(style)}">${inlineFormat(block.data.text, true)}</div>`;
            }
        },

        video: {
            label: 'Адаптивное видео',
            defaults: () => ({
                type: 'youtube',
                videoId: 'dQw4w9WgXcQ',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            }),
            editForm(block) {
                return `
                    <div class="form-group">
                        <label>Ссылка на видео (YouTube / RuTube / VK / Vimeo / Kinescope)</label>
                        <input type="text" class="video-url-input" data-field="url" value="${escapeHtml(block.data.url || '')}" placeholder="Например: https://rutube.ru/video/... или https://vk.com/video...">
                        <small style="color: #666; font-size: 11px;">Поддерживаются: YouTube, Vimeo, RuTube, Kinescope, VK Видео</small>
                    </div>
                    <div class="form-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Платформа</label>
                            <select class="video-type-select" data-field="type">
                                <option value="youtube" ${block.data.type === 'youtube' ? 'selected' : ''}>YouTube</option>
                                <option value="rutube" ${block.data.type === 'rutube' ? 'selected' : ''}>RuTube</option>
                                <option value="vk" ${block.data.type === 'vk' ? 'selected' : ''}>VK Видео</option>
                                <option value="kinescope" ${block.data.type === 'kinescope' ? 'selected' : ''}>Kinescope</option>
                                <option value="vimeo" ${block.data.type === 'vimeo' ? 'selected' : ''}>Vimeo</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>ID видео / Параметры</label>
                            <input type="text" class="video-id-input" data-field="videoId" value="${escapeHtml(block.data.videoId || '')}">
                        </div>
                    </div>`;
            },
            toHTML(block) {
                const type = block.data.type || 'youtube';
                const videoId = block.data.videoId || '';
                let embedUrl = '';
                if (type === 'youtube') {
                    embedUrl = `https://www.youtube.com/embed/${escapeHtml(videoId)}`;
                } else if (type === 'vimeo') {
                    embedUrl = `https://player.vimeo.com/video/${escapeHtml(videoId)}`;
                } else if (type === 'rutube') {
                    embedUrl = `https://rutube.ru/play/embed/${escapeHtml(videoId)}`;
                } else if (type === 'kinescope') {
                    embedUrl = `https://kinescope.io/embed/${escapeHtml(videoId)}`;
                } else if (type === 'vk') {
                    embedUrl = `https://vk.com/video_ext.php?${escapeHtml(videoId)}`;
                }
                
                return `<div class="article-video-wrapper">
    <div class="embed-responsive embed-responsive-16by9">
        <iframe class="embed-responsive-item" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
</div>`;
            },
            preview(block) {
                return this.toHTML(block);
            }
        },

        carousel: {
            label: 'Слайдер изображений',
            defaults: () => ({
                items: [
                    { src: 'image/catalog/demo/slide1.jpg', alt: 'Слайд 1', caption: 'Заголовок первого слайда' }
                ]
            }),
            editForm(block) {
                let html = `<div class="carousel-editor">`;
                const items = block.data.items || [];
                items.forEach((item, i) => {
                    html += `<div class="carousel-editor-item" style="border: 1px solid #ddd; padding: 10px; border-radius: 6px; margin-bottom: 10px; background: #fafafa; position: relative;">
                        <div style="position: absolute; right: 8px; top: 8px;">
                            <button class="btn btn-sm btn-danger" data-action="remove-carousel-item" data-index="${i}">&times;</button>
                        </div>
                        <div style="font-weight: bold; margin-bottom: 6px;">Слайд ${i + 1}</div>
                        <div class="form-group">
                            <label>Путь к картинке</label>
                            <input type="text" data-carousel-src="${i}" value="${escapeHtml(item.src)}" placeholder="image/catalog/folder/image.jpg">
                        </div>
                        <div class="form-group">
                            <label>Alt текст (для SEO)</label>
                            <input type="text" data-carousel-alt="${i}" value="${escapeHtml(item.alt)}" placeholder="Описание картинки">
                        </div>
                        <div class="form-group">
                            <label>Подпись / Описание</label>
                            <input type="text" data-carousel-caption="${i}" value="${escapeHtml(item.caption)}" placeholder="Текст на слайде">
                        </div>
                    </div>`;
                });
                html += `</div><button class="btn btn-sm btn-ghost" data-action="add-carousel-item">+ Добавить слайд</button>`;
                return html;
            },
            toHTML(block) {
                const id = 'carousel-' + block.id;
                const items = block.data.items || [];
                if (items.length === 0) {
                    return `<div class="alert alert-warning">Слайдер пуст. Добавьте изображения в редакторе.</div>`;
                }
                
                let indicators = '';
                let slides = '';
                
                items.forEach((item, i) => {
                    indicators += `<li data-target="#${id}" data-slide-to="${i}" class="${i === 0 ? 'active' : ''}"></li>`;
                    slides += `<div class="item ${i === 0 ? 'active' : ''}">
                        <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || '')}" style="width:100%; max-height:450px; object-fit:cover;">
                        ${item.caption ? `<div class="carousel-caption"><h3>${escapeHtml(item.caption)}</h3></div>` : ''}
                    </div>`;
                });
                
                return `<div id="${id}" class="carousel slide" data-ride="carousel">
    <ol class="carousel-indicators">
        ${indicators}
    </ol>
    <div class="carousel-inner" role="listbox">
        ${slides}
    </div>
    <a class="left carousel-control" href="#${id}" role="button" data-slide="prev">
        <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
        <span class="sr-only">Предыдущий</span>
    </a>
    <a class="right carousel-control" href="#${id}" role="button" data-slide="next">
        <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
        <span class="sr-only">Следующий</span>
    </a>
</div>`;
            },
            preview(block) {
                return this.toHTML(block);
            }
        },

        'before-after': {
            label: 'Слайдер До/После',
            defaults: () => ({
                beforeImg: 'image/catalog/demo/before.jpg',
                afterImg: 'image/catalog/demo/after.jpg',
                beforeLabel: 'До',
                afterLabel: 'После'
            }),
            editForm(block) {
                return `
                    <div class="form-group">
                        <label>Изображение ДО</label>
                        <input type="text" data-field="beforeImg" value="${escapeHtml(block.data.beforeImg || '')}" placeholder="image/catalog/folder/before.jpg">
                    </div>
                    <div class="form-group">
                        <label>Изображение ПОСЛЕ</label>
                        <input type="text" data-field="afterImg" value="${escapeHtml(block.data.afterImg || '')}" placeholder="image/catalog/folder/after.jpg">
                    </div>
                    <div class="form-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Ярлык ДО</label>
                            <input type="text" data-field="beforeLabel" value="${escapeHtml(block.data.beforeLabel || 'До')}">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Ярлык ПОСЛЕ</label>
                            <input type="text" data-field="afterLabel" value="${escapeHtml(block.data.afterLabel || 'После')}">
                        </div>
                    </div>`;
            },
            toHTML(block) {
                const id = 'ba-' + block.id;
                const beforeImg = escapeHtml(block.data.beforeImg || '');
                const afterImg = escapeHtml(block.data.afterImg || '');
                const beforeLabel = escapeHtml(block.data.beforeLabel || 'До');
                const afterLabel = escapeHtml(block.data.afterLabel || 'После');
                
                return `<div class="article-ba-slider" id="${id}">
    <div class="ba-image ba-after-img" style="background-image: url('${afterImg}');"></div>
    <div class="ba-image ba-before-img" style="background-image: url('${beforeImg}');"></div>
    <div class="ba-label ba-label-before">${beforeLabel}</div>
    <div class="ba-label ba-label-after">${afterLabel}</div>
    <input type="range" min="0" max="100" value="50" class="ba-handle-slider">
    <div class="ba-handle-bar"></div>
</div>`;
            },
            preview(block) {
                return this.toHTML(block);
            }
        },

        messengers: {
            label: 'Мессенджеры',
            defaults: () => ({
                whatsapp: '',
                telegram: '',
                viber: '',
                phone: ''
            }),
            editForm(block) {
                return `
                    <div class="form-group">
                        <label>WhatsApp (номер телефона в формате 79991234567)</label>
                        <input type="text" data-field="whatsapp" value="${escapeHtml(block.data.whatsapp || '')}" placeholder="Например: 79991234567">
                    </div>
                    <div class="form-group">
                        <label>Telegram (имя пользователя без @ или ссылка)</label>
                        <input type="text" data-field="telegram" value="${escapeHtml(block.data.telegram || '')}" placeholder="Например: username">
                    </div>
                    <div class="form-group">
                        <label>Viber (номер телефона в формате 79991234567 или ссылка)</label>
                        <input type="text" data-field="viber" value="${escapeHtml(block.data.viber || '')}" placeholder="Например: 79991234567">
                    </div>
                    <div class="form-group">
                        <label>Телефон для прямого вызова (в формате +79991234567)</label>
                        <input type="text" data-field="phone" value="${escapeHtml(block.data.phone || '')}" placeholder="Например: +79991234567">
                    </div>`;
            },
            toHTML(block) {
                let html = `<div class="article-messengers-row">`;
                
                if (block.data.whatsapp) {
                    const waClean = block.data.whatsapp.replace(/[^\d]/g, '');
                    html += `<a href="https://wa.me/${waClean}" class="messenger-btn messenger-wa" target="_blank" rel="noopener">
                        <i class="fa fa-whatsapp"></i> WhatsApp
                    </a>`;
                }
                
                if (block.data.telegram) {
                    let tgLink = block.data.telegram;
                    if (!tgLink.startsWith('http')) {
                        tgLink = `https://t.me/${tgLink.replace(/^@/, '')}`;
                    }
                    html += `<a href="${tgLink}" class="messenger-btn messenger-tg" target="_blank" rel="noopener">
                        <i class="fa fa-paper-plane"></i> Telegram
                    </a>`;
                }
                
                if (block.data.viber) {
                    let viberLink = block.data.viber;
                    if (!viberLink.startsWith('viber://') && !viberLink.startsWith('http')) {
                        const vibClean = viberLink.replace(/[^\d]/g, '');
                        viberLink = `viber://chat?number=%2B${vibClean}`;
                    }
                    html += `<a href="${viberLink}" class="messenger-btn messenger-viber" target="_blank" rel="noopener">
                        <i class="fa fa-comments"></i> Viber
                    </a>`;
                }
                
                if (block.data.phone) {
                    html += `<a href="tel:${block.data.phone}" class="messenger-btn messenger-phone">
                        <i class="fa fa-phone"></i> Позвонить
                    </a>`;
                }
                
                html += `</div>`;
                return html;
            },
            preview(block) {
                return this.toHTML(block);
            }
        },

        'product-card': {
            label: 'Карточка товара',
            defaults: () => ({
                name: 'Название товара',
                price: '7 500.00р.',
                img: 'image/catalog/demo/product.jpg',
                link: '#',
                btnText: 'Купить'
            }),
            editForm(block) {
                return `
                    <div class="form-group">
                        <label>Название товара</label>
                        <input type="text" data-field="name" value="${escapeHtml(block.data.name || '')}">
                    </div>
                    <div class="form-row">
                        <div class="form-group" style="flex: 1;">
                            <label>Цена</label>
                            <input type="text" data-field="price" value="${escapeHtml(block.data.price || '')}">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Текст кнопки</label>
                            <input type="text" data-field="btnText" value="${escapeHtml(block.data.btnText || 'Купить')}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Путь к картинке товара</label>
                        <input type="text" data-field="img" value="${escapeHtml(block.data.img || '')}" placeholder="image/catalog/folder/product.jpg">
                    </div>
                    <div class="form-group">
                        <label>Ссылка на страницу товара (URL)</label>
                        <input type="text" data-field="link" value="${escapeHtml(block.data.link || '#')}">
                    </div>`;
            },
            toHTML(block) {
                const name = escapeHtml(block.data.name || '');
                const price = escapeHtml(block.data.price || '');
                const img = escapeHtml(block.data.img || '');
                const link = escapeHtml(block.data.link || '#');
                const btnText = escapeHtml(block.data.btnText || 'Купить');
                
                return `<div class="article-product-card">
    <div class="product-card-img-wrap">
        <a href="${link}"><img src="${img}" alt="${name}"></a>
    </div>
    <div class="product-card-info">
        <h4 class="product-card-title"><a href="${link}">${name}</a></h4>
        <div class="product-card-footer">
            <div class="product-card-price">${price}</div>
            <a href="${link}" class="product-card-btn">${btnText}</a>
        </div>
    </div>
</div>`;
            },
            preview(block) {
                return this.toHTML(block);
            }
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
    function scrollToBlock(blockId) {
        setTimeout(() => {
            const ws = document.getElementById('workspace');
            const card = ws ? ws.querySelector(`.block-card[data-id="${blockId}"]`) : null;
            if (ws && card) {
                const wsRect = ws.getBoundingClientRect();
                const cardRect = card.getBoundingClientRect();
                const targetScrollTop = cardRect.top + ws.scrollTop - wsRect.top;
                
                ws.scrollTo({
                    top: targetScrollTop - 20,
                    behavior: 'smooth'
                });
                
                card.style.transition = 'background-color 0.4s';
                card.style.backgroundColor = '#fff9db';
                setTimeout(() => card.style.backgroundColor = '', 1000);
            }
            
            const preview = document.getElementById('previewPanel');
            const previewEl = preview ? preview.querySelector(`[data-preview-id="${blockId}"]`) : null;
            if (preview && previewEl) {
                const previewRect = preview.getBoundingClientRect();
                const previewElRect = previewEl.getBoundingClientRect();
                const targetPreviewScrollTop = previewElRect.top + preview.scrollTop - previewRect.top;
                
                preview.scrollTo({
                    top: targetPreviewScrollTop - 20,
                    behavior: 'smooth'
                });
                
                previewEl.style.transition = 'background-color 0.4s, box-shadow 0.4s';
                previewEl.style.backgroundColor = '#fff9db';
                previewEl.style.boxShadow = '0 0 10px rgba(241, 196, 15, 0.4)';
                setTimeout(() => {
                    previewEl.style.backgroundColor = '';
                    previewEl.style.boxShadow = '';
                }, 1000);
            }
        }, 250);
    }

    function addBlock(type) {
        const def = BLOCK_TYPES[type];
        if (!def) return;
        const block = { id: uuid(), type, data: def.defaults() };
        blocks.push(block);
        renderBlocks();
        updatePreview();
        scrollToBlock(block.id);
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
                if (fromId === block.id) return;

                let movedBlock = null;
                const topIdx = blocks.findIndex(b => b.id === fromId);
                if (topIdx !== -1) {
                    movedBlock = blocks[topIdx];
                    blocks.splice(topIdx, 1);
                } else {
                    const nested = findNestedBlock(fromId);
                    if (nested) {
                        movedBlock = nested.block;
                        nested.column.blocks.splice(nested.idx, 1);
                    }
                }

                if (movedBlock) {
                    const toIdx = blocks.indexOf(block);
                    blocks.splice(toIdx, 0, movedBlock);
                    renderBlocks();
                    updatePreview();
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
                dragState.dragging = childCard.dataset.childId;
                e.stopPropagation();
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', childCard.dataset.childId);
                childCard.classList.add('dragging');
            });
            childCard.addEventListener('dragend', () => {
                childCard.classList.remove('dragging');
                dragState.dragging = null;
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
            const updateField = () => {
                const field = el.dataset.field;
                if (el.type === 'checkbox') {
                    block.data[field] = el.checked;
                    
                    // Special behavior for table editor classes
                    if (block.type === 'table') {
                        const editorTable = form.querySelector('.table-editor table');
                        if (editorTable) {
                            const className = `table-${field}`;
                            if (el.checked) {
                                editorTable.classList.add(className);
                            } else {
                                editorTable.classList.remove(className);
                            }
                        }
                    }
                } else if (el.tagName === 'SELECT' && field === 'level') {
                    block.data[field] = parseInt(el.value);
                } else {
                    block.data[field] = el.value;
                }
                updatePreview();
            };
            el.addEventListener('input', updateField);
            el.addEventListener('change', updateField);
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

        // FAQ actions
        form.querySelectorAll('[data-action="add-faq-item"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const newIdx = block.data.items.length;
                block.data.items.push({ question: 'Новый вопрос?', answer: 'Ответ...' });
                const faqEditor = form.querySelector('.faq-editor');
                const itemHtml = `<div class="faq-editor-item">
                    <div class="faq-editor-header">
                        <span class="faq-editor-num">${newIdx + 1}</span>
                        <input type="text" data-faq-question="${newIdx}" value="Новый вопрос?" placeholder="Вопрос">
                        <button class="btn btn-sm btn-ghost" data-action="remove-faq-item" data-index="${newIdx}">&times;</button>
                    </div>
                    <textarea data-faq-answer="${newIdx}" rows="3" placeholder="Ответ">Ответ...</textarea>
                    ${agreeToolbarHtml()}
                </div>`;
                faqEditor.insertAdjacentHTML('beforeend', itemHtml);
                const newItem = faqEditor.lastElementChild;
                newItem.querySelector('[data-action="remove-faq-item"]').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(newItem.querySelector('[data-action="remove-faq-item"]').dataset.index);
                    block.data.items.splice(idx, 1);
                    newItem.remove();
                    updatePreview();
                });
                newItem.querySelector('[data-faq-question]').addEventListener('input', (e) => {
                    const idx = parseInt(e.target.dataset.faqQuestion);
                    block.data.items[idx].question = e.target.value;
                });
                newItem.querySelector('[data-faq-answer]').addEventListener('input', (e) => {
                    const idx = parseInt(e.target.dataset.faqAnswer);
                    block.data.items[idx].answer = e.target.value;
                });
                updatePreview();
            });
        });
        form.querySelectorAll('[data-action="remove-faq-item"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                block.data.items.splice(idx, 1);
                btn.closest('.faq-editor-item').remove();
                updatePreview();
            });
        });
        form.querySelectorAll('[data-faq-question]').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.faqQuestion);
                block.data.items[idx].question = input.value;
            });
        });
        form.querySelectorAll('[data-faq-answer]').forEach(textarea => {
            textarea.addEventListener('input', () => {
                const idx = parseInt(textarea.dataset.faqAnswer);
                block.data.items[idx].answer = textarea.value;
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
                updatePreview();
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

        // Video URL auto-parsing
        form.querySelectorAll('.video-url-input').forEach(input => {
            const handleVideoChange = () => {
                const parsed = parseVideoUrl(input.value);
                block.data.type = parsed.type;
                block.data.videoId = parsed.videoId;
                
                const typeSelect = form.querySelector('.video-type-select');
                const idInput = form.querySelector('.video-id-input');
                if (typeSelect) typeSelect.value = parsed.type;
                if (idInput) idInput.value = parsed.videoId;
                
                updatePreview();
            };
            input.addEventListener('input', handleVideoChange);
            input.addEventListener('change', handleVideoChange);
        });

        // Carousel Actions
        form.querySelectorAll('[data-action="add-carousel-item"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!block.data.items) block.data.items = [];
                const newIdx = block.data.items.length;
                block.data.items.push({ src: '', alt: `Слайд ${newIdx + 1}`, caption: '' });
                toggleEdit(block, btn.closest('.block-card'));
            });
        });
        form.querySelectorAll('[data-action="remove-carousel-item"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                if (block.data.items) {
                    block.data.items.splice(idx, 1);
                }
                toggleEdit(block, btn.closest('.block-card'));
            });
        });
        form.querySelectorAll('[data-carousel-src]').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.carouselSrc);
                if (block.data.items && block.data.items[idx]) {
                    block.data.items[idx].src = input.value;
                }
            });
        });
        form.querySelectorAll('[data-carousel-alt]').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.carouselAlt);
                if (block.data.items && block.data.items[idx]) {
                    block.data.items[idx].alt = input.value;
                }
            });
        });
        form.querySelectorAll('[data-carousel-caption]').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.carouselCaption);
                if (block.data.items && block.data.items[idx]) {
                    block.data.items[idx].caption = input.value;
                }
            });
        });
    }

    function parseVideoUrl(url) {
        let type = 'youtube';
        let videoId = '';
        if (!url) return { type, videoId };
        
        // YouTube
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const ytMatch = url.match(ytRegex);
        if (ytMatch) {
            return { type: 'youtube', videoId: ytMatch[1] };
        }
        
        // Vimeo
        const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch) {
            return { type: 'vimeo', videoId: vimeoMatch[1] };
        }
        
        // RuTube
        const rutubeRegex = /(?:rutube\.ru\/(?:video|play\/embed)\/)([a-zA-Z0-9]{32})/i;
        const rutubeMatch = url.match(rutubeRegex);
        if (rutubeMatch) {
            return { type: 'rutube', videoId: rutubeMatch[1] };
        }
        
        // Kinescope
        const kinescopeRegex = /(?:kinescope\.(?:ru|io)\/(?:embed\/)?)([a-zA-Z0-9-]+)/i;
        const kinescopeMatch = url.match(kinescopeRegex);
        if (kinescopeMatch) {
            return { type: 'kinescope', videoId: kinescopeMatch[1] };
        }
        
        // VK Video (ext player)
        const vkExtMatch = url.match(/vk\.com\/video_ext\.php\?([^"\s>]+)/i);
        if (vkExtMatch) {
            const query = vkExtMatch[1].replace(/&amp;/g, '&');
            return { type: 'vk', videoId: query };
        }
        
        // VK Video (page link)
        const vkPageMatch = url.match(/vk\.com\/video([0-9_-]+)/i);
        if (vkPageMatch) {
            const parts = vkPageMatch[1].split('_');
            return { type: 'vk', videoId: `oid=${parts[0]}&id=${parts[1]}` };
        }
        
        // Fallbacks
        if (url.length === 11) {
            return { type: 'youtube', videoId: url };
        } else if (/^\d+$/.test(url)) {
            return { type: 'vimeo', videoId: url };
        } else if (/^[a-zA-Z0-9]{32}$/.test(url)) {
            return { type: 'rutube', videoId: url };
        } else if (url.includes('oid=') && url.includes('id=')) {
            return { type: 'vk', videoId: url };
        }
        
        return { type: 'youtube', videoId: url };
    }

    function readFormData(block, form) {
        form.querySelectorAll('[data-field]').forEach(el => {
            const field = el.dataset.field;
            if (el.type === 'checkbox') {
                block.data[field] = el.checked;
            } else if (el.tagName === 'SELECT' && field === 'level') {
                block.data[field] = parseInt(el.value);
            } else {
                block.data[field] = el.value;
            }
        });
        form.querySelectorAll('[data-item]').forEach(el => {
            block.data.items[parseInt(el.dataset.item)] = el.value;
        });
        
        if (block.type === 'carousel') {
            block.data.items = [];
            form.querySelectorAll('.carousel-editor-item').forEach((itemEl, idx) => {
                const src = itemEl.querySelector('[data-carousel-src]').value;
                const alt = itemEl.querySelector('[data-carousel-alt]').value;
                const caption = itemEl.querySelector('[data-carousel-caption]').value;
                block.data.items.push({ src, alt, caption });
            });
        }
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
    const headerEl         = document.querySelector('.header');

    function syncMobileHeaderHeight() {
        if (!headerEl) return;

        document.documentElement.style.setProperty('--mobile-header-height', `${headerEl.offsetHeight}px`);
    }

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

        if (window.innerWidth <= 768) {
            document.body.classList.toggle('preview-mobile-open', !hidden);
        }

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
                if (window.innerWidth <= 768) {
                    if (icon)  { icon.className = 'fa fa-arrow-left'; }
                    if (label) { label.textContent = 'В конструктор'; }
                } else {
                    if (icon)  { icon.className = 'fa fa-eye-slash'; }
                    if (label) { label.textContent = 'Скрыть'; }
                }
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

    syncMobileHeaderHeight();
    window.addEventListener('resize', syncMobileHeaderHeight);

    // ── Mobile Hamburger Palette ─────────────────────────────
    const btnTogglePalette = $('#btnTogglePalette');
    const blockPalette = $('#blockPalette');
    const paletteOverlay = document.createElement('div');
    paletteOverlay.className = 'palette-overlay';
    document.body.appendChild(paletteOverlay);
    const btnToggleHeaderFields = $('#btnToggleHeaderFields');
    const mobileActions = document.querySelector('.mobile-actions');
    const btnToggleActions = $('#btnToggleActions');
    const mobileActionsMenu = $('#mobileActionsMenu');

    function closePalette() {
        if (blockPalette) {
            blockPalette.classList.remove('open');
        }

        paletteOverlay.classList.remove('open');
    }

    if (btnTogglePalette && blockPalette) {
        btnTogglePalette.addEventListener('click', () => {
            blockPalette.classList.toggle('open');
            paletteOverlay.classList.toggle('open');
        });

        paletteOverlay.addEventListener('click', closePalette);
    }

    function closeMobileActions() {
        if (mobileActions) {
            mobileActions.classList.remove('open');
        }
    }

    if (btnToggleActions && mobileActions) {
        btnToggleActions.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            mobileActions.classList.toggle('open');
        });
    }

    if (btnToggleHeaderFields) {
        btnToggleHeaderFields.addEventListener('click', (event) => {
            event.preventDefault();
            document.body.classList.toggle('mobile-header-fields-open');
            syncMobileHeaderHeight();
        });
    }

    if (mobileActionsMenu) {
        mobileActionsMenu.querySelectorAll('[data-forward-click]').forEach((item) => {
            item.addEventListener('click', () => {
                const target = document.querySelector(item.dataset.forwardClick);

                closeMobileActions();

                if (target) {
                    target.click();
                }
            });
        });
    }

    document.addEventListener('click', (event) => {
        if (mobileActions && !mobileActions.contains(event.target)) {
            closeMobileActions();
        }
    });

    // ── Block palette clicks ─────────────────────────────────
    $$('.block-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addBlock(btn.dataset.blockType);

            if (window.innerWidth <= 768) {
                closePalette();
            }
        });
    });

    // ── Tab switching (event delegation) ─────────────────────
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.article-tabs-nav [data-tab]');
        if (!btn) return;
        e.preventDefault();
        const nav = btn.parentNode;
        const wrapper = nav.parentNode;
        const panels = wrapper.querySelector('.article-tabs-panels');
        if (!panels) return;
        const idx = btn.dataset.tab;
        // deactivate all
        nav.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
        panels.querySelectorAll('.article-tabs-panel').forEach(p => p.style.display = 'none');
        // activate clicked
        btn.classList.add('active');
        const panel = panels.children[parseInt(idx, 10)];
        if (panel) {
            panel.style.display = 'block';
        }
    });

    // ── FAQ collapse toggle (event delegation for preview) ────
    document.addEventListener('click', function (e) {
        const question = e.target.closest('.article-faq-question');
        if (!question) return;
        
        const item = question.closest('.article-faq-item');
        if (!item) return;
        
        const targetEl = item.querySelector('.article-faq-collapse');
        if (!targetEl) return;
        
        const isCollapsed = targetEl.classList.contains('in');
        if (isCollapsed) {
            targetEl.classList.remove('in');
            question.classList.add('collapsed');
        } else {
            targetEl.classList.add('in');
            question.classList.remove('collapsed');
        }
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
<script type="text/javascript">
document.addEventListener('click', function(event) {
  // 1. FAQ Accordion Toggle
  var question = event.target.closest('.article-faq-question');
  if (question) {
    var item = question.closest('.article-faq-item');
    if (item) {
      var targetEl = item.querySelector('.article-faq-collapse');
      if (targetEl) {
        var isCollapsed = targetEl.classList.contains('in');
        if (isCollapsed) {
          targetEl.classList.remove('in');
          question.classList.add('collapsed');
        } else {
          targetEl.classList.add('in');
          question.classList.remove('collapsed');
        }
      }
    }
  }

  // 2. Tabs Switcher
  var tabBtn = event.target.closest('.article-tabs-nav button');
  if (tabBtn) {
    var nav = tabBtn.parentNode;
    var wrapper = nav.parentNode;
    var panels = wrapper.querySelector('.article-tabs-panels');
    if (nav && panels) {
      var idx = tabBtn.getAttribute('data-tab');
      var buttons = nav.querySelectorAll('[data-tab]');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
      }
      for (var j = 0; j < panels.children.length; j++) {
        panels.children[j].style.display = 'none';
      }
      tabBtn.classList.add('active');
      var panel = panels.children[parseInt(idx, 10)];
      if (panel) {
        panel.style.display = 'block';
      }
    }
  }

  // 3. Carousel Slider Control
  var control = event.target.closest('.carousel-control');
  if (control) {
    event.preventDefault();
    var targetId = control.getAttribute('href') || control.dataset.target;
    var carousel = document.querySelector(targetId);
    if (carousel) {
      var inner = carousel.querySelector('.carousel-inner');
      if (inner) {
        var items = Array.from(inner.querySelectorAll('.item'));
        var activeIdx = items.findIndex(function(item) { return item.classList.contains('active'); });
        if (activeIdx !== -1) {
          var nextIdx = activeIdx;
          if (control.getAttribute('data-slide') === 'next') {
            nextIdx = (activeIdx + 1) % items.length;
          } else {
            nextIdx = (activeIdx - 1 + items.length) % items.length;
          }
          items[activeIdx].classList.remove('active');
          items[nextIdx].classList.add('active');
          var indicators = Array.from(carousel.querySelectorAll('.carousel-indicators li'));
          if (indicators.length) {
            indicators[activeIdx].classList.remove('active');
            indicators[nextIdx].classList.add('active');
          }
        }
      }
    }
  }
});

document.addEventListener('input', function(event) {
  // 4. Before/After Slider Range
  var slider = event.target;
  if (slider && slider.classList.contains('ba-handle-slider')) {
    var container = slider.closest('.article-ba-slider');
    if (container) {
      var val = slider.value;
      var beforeImg = container.querySelector('.ba-before-img');
      var handleBar = container.querySelector('.ba-handle-bar');
      if (beforeImg) {
        beforeImg.style.width = val + '%';
      }
      if (handleBar) {
        handleBar.style.left = val + '%';
      }
    }
  }
});
</script>
</body>
</html>`;

        downloadFile(fullHTML, `content-${slug}.html`, 'text/html');
    });

    // ── Export CSS ───────────────────────────────────────────
    $('#btnExportCSS').addEventListener('click', () => {
        const css = getExportedCSS();
        downloadFile(css, `content-constructor.css`, 'text/css');
    });

    // ── Export JSON ──────────────────────────────────────────
    const btnExportJSON = $('#btnExportJSON');
    if (btnExportJSON) {
        btnExportJSON.addEventListener('click', () => {
            const dataToExport = {
                title: titleInput.value || '',
                slug: slugInput.value || '',
                blocks: blocks
            };
            const jsonStr = JSON.stringify(dataToExport, null, 2);
            const slug = slugInput.value || 'content-template';
            downloadFile(jsonStr, `constructor-${slug}.json`, 'application/json');
        });
    }

    // ── Import JSON ──────────────────────────────────────────
    const btnImportJSON = $('#btnImportJSON');
    const importFileInput = $('#importFile');
    if (btnImportJSON && importFileInput) {
        btnImportJSON.addEventListener('click', () => {
            importFileInput.click();
        });
        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const parsed = JSON.parse(evt.target.result);
                    if (!parsed || !Array.isArray(parsed.blocks)) {
                        throw new Error('Неверный формат JSON-файла. Должно быть поле blocks в виде массива.');
                    }
                    if (confirm('Импортировать шаблон? Текущие блоки будут полностью заменены.')) {
                        if (parsed.title !== undefined) titleInput.value = parsed.title;
                        if (parsed.slug !== undefined) slugInput.value = parsed.slug;
                        
                        blocks = parsed.blocks;
                        blocks.forEach(b => {
                            if (b.type === 'grid' && b.data.columns) {
                                b.data.columns.forEach(col => {
                                    if (!col.id) col.id = uuid();
                                });
                            }
                            refreshBlockIds(b);
                        });
                        
                        renderBlocks();
                        updatePreview();
                    }
                } catch (err) {
                    alert('Ошибка при импорте JSON: ' + err.message);
                }
                e.target.value = '';
            };
            reader.readAsText(file);
        });
    }

    // ── Presets Dropdown ─────────────────────────────────────
    const presetDropdown = $('#presetDropdown');
    if (presetDropdown) {
        presetDropdown.addEventListener('change', (e) => {
            if (confirm('Вы уверены, что хотите загрузить этот шаблон? Текущие блоки в конструкторе будут заменены.')) {
                loadPresetTemplate(e.target.value);
            }
            e.target.value = '';
        });
    }

    function loadPresetTemplate(presetName) {
        let newBlocks = [];
        if (presetName === 'review') {
            newBlocks = [
                {
                    type: 'heading',
                    data: { level: 2, text: 'Обзор и ключевые особенности товара' }
                },
                {
                    type: 'toc',
                    data: {}
                },
                {
                    type: 'paragraph',
                    data: { text: 'В данном обзоре мы подробно рассмотрим технические характеристики, преимущества и практический опыт использования устройства. Вы узнаете все важные нюансы перед покупкой.' }
                },
                {
                    type: 'product-card',
                    data: {
                        name: 'Беспроводные наушники SoundPro Max',
                        price: '12 990.00р.',
                        img: 'image/catalog/demo/soundpro.jpg',
                        link: '#',
                        btnText: 'Купить со скидкой'
                    }
                },
                {
                    type: 'grid',
                    data: {
                        pcPattern: [6, 6],
                        mobilePerRow: 1,
                        columns: [
                            {
                                blocks: [
                                    {
                                        type: 'image',
                                        data: {
                                            srcType: 'path',
                                            src: 'image/catalog/demo/soundpro-details.jpg',
                                            alt: 'Комплектация и детали',
                                            caption: 'Комплект поставки SoundPro Max'
                                        }
                                    }
                                ]
                            },
                            {
                                blocks: [
                                    {
                                        type: 'paragraph',
                                        data: { text: '### Превосходное звучание и автономность\n\n*   **Активное шумоподавление (ANC)** блокирует до 98% внешних шумов.\n*   **До 40 часов работы** на одном заряде с отключенным шумоподавлением.\n*   Быстрая зарядка за 10 минут обеспечивает еще 5 часов прослушивания.' }
                                    }
                                ]
                            }
                        ]
                    }
                },
                {
                    type: 'faq',
                    data: {
                        title: 'Часто задаваемые вопросы о SoundPro Max',
                        items: [
                            { question: 'Какая гарантия на устройство?', answer: 'На оригинальные наушники SoundPro Max предоставляется официальная гарантия 12 месяцев с момента покупки.' },
                            { question: 'Совместимы ли они с Android/iOS?', answer: 'Да, наушники используют Bluetooth 5.2 и работают с любыми смартфонами, планшетами и компьютерами.' }
                        ]
                    }
                },
                {
                    type: 'callout',
                    data: {
                        style: 'info',
                        title: 'Акционное предложение',
                        text: 'До конца недели при покупке наушников вы получаете защитный чехол в подарок!',
                        btnText: 'Перейти к акции',
                        btnLink: '#',
                        btnIcon: 'fa-link'
                    }
                }
            ];
        } else if (presetName === 'instructions') {
            newBlocks = [
                {
                    type: 'heading',
                    data: { level: 2, text: 'Инструкция по установке и настройке оборудования' }
                },
                {
                    type: 'paragraph',
                    data: { text: 'Внимательно ознакомьтесь с данным руководством перед началом монтажа. Несоблюдение правил может привести к выходу устройства из строя.' }
                },
                {
                    type: 'grid',
                    data: {
                        pcPattern: [6, 6],
                        mobilePerRow: 1,
                        columns: [
                            {
                                blocks: [
                                    {
                                        type: 'before-after',
                                        data: {
                                            beforeImg: 'image/catalog/demo/before.jpg',
                                            afterImg: 'image/catalog/demo/after.jpg',
                                            beforeLabel: 'До установки',
                                            afterLabel: 'После установки'
                                        }
                                    }
                                ]
                            },
                            {
                                blocks: [
                                    {
                                        type: 'paragraph',
                                        data: { text: '### Шаги установки\n\n1.  **Подготовка**: Отключите питание на щитке.\n2.  **Монтаж**: Закрепите кронштейн на стене.\n3.  **Подключение**: Подсоедините провода по схеме.\n4.  **Проверка**: Включите питание и проверьте индикацию.' }
                                    }
                                ]
                            }
                        ]
                    }
                },
                {
                    type: 'alert',
                    data: {
                        style: 'warning',
                        text: '**Внимание:** Все работы по электрическому подключению должны производиться квалифицированным специалистом.'
                    }
                },
                {
                    type: 'callout',
                    data: {
                        style: 'well',
                        title: 'Скачать руководство пользователя PDF',
                        text: 'Полная инструкция со спецификациями и схемами подключения в формате PDF.',
                        btnText: 'Скачать PDF (4.2 МБ)',
                        btnLink: '#',
                        btnIcon: 'fa-file-pdf-o'
                    }
                }
            ];
        } else if (presetName === 'faq') {
            newBlocks = [
                {
                    type: 'heading',
                    data: { level: 2, text: 'Услуги и ответы на вопросы' }
                },
                {
                    type: 'paragraph',
                    data: { text: 'Мы предоставляем широкий спектр услуг по установке, диагностике и модернизации автомобильной оптики. Ниже приведены подробные ответы на часто задаваемые вопросы.' }
                },
                {
                    type: 'image',
                    data: {
                        srcType: 'path',
                        src: 'image/catalog/demo/services.jpg',
                        alt: 'Наши услуги',
                        caption: 'Профессиональная установка в специализированном сервисе'
                    }
                },
                {
                    type: 'faq',
                    data: {
                        title: 'Популярные вопросы',
                        items: [
                            { question: 'Сколько времени занимает замена линз?', answer: 'В среднем процедура установки линз занимает от 6 до 12 часов. В некоторых случаях срок может увеличиться до 2–3 дней.' },
                            { question: 'Предоставляется ли гарантия на работу?', answer: 'Да, на работу и компоненты предоставляется гарантия до 2-х лет. Регулировка света корректируется на стенде по ГОСТ.' }
                        ]
                    }
                },
                {
                    type: 'messengers',
                    data: {
                        whatsapp: '+79991234567',
                        telegram: 'username',
                        viber: '+79991234567',
                        phone: '+79991234567'
                    }
                }
            ];
        }

        newBlocks.forEach(block => {
            if (block.type === 'grid' && block.data.columns) {
                block.data.columns.forEach(col => {
                    if (!col.id) col.id = uuid();
                });
            }
            refreshBlockIds(block);
        });

        blocks = newBlocks;
        renderBlocks();
        updatePreview();
    }

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
    padding: 8px 10px;
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

/* Bootstrap 3 Table Styles */
.description table.table-striped tbody tr:nth-of-type(odd) td {
    background-color: #f9f9f9;
}
.description table.table-bordered {
    border: 1px solid #ddd;
}
.description table.table-bordered th,
.description table.table-bordered td {
    border: 1px solid #ddd;
}
.description table.table-hover tbody tr:hover td {
    background-color: #f5f5f5;
}
.description table.table-condensed th,
.description table.table-condensed td {
    padding: 5px;
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

/* --- FAQ --- */
.article-faq {
    margin: 20px 0;
}

.article-faq-title {
    font-family: var(--description-font-bold), sans-serif;
    font-size: 27px;
    font-weight: 500;
    margin: 20px 0px 15px;
    color: #2c2c2c;
    line-height: 1.2;
}

.article-faq-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.article-faq-item {
    border: none;
    border-bottom: 1px solid #eaeaea;
    overflow: visible;
    transition: border-color 0.2s;
}

.article-faq-item:hover {
    border-color: #cfd8dc;
}

.article-faq-question {
    font-family: var(--description-font-bold), sans-serif;
    font-weight: 500;
    font-size: 16px !important;
    padding: 10px 40px 10px 12px !important;
    cursor: pointer;
    outline: none;
    display: flex !important;
    align-items: center !important;
    gap: 12px;
    transition: color 0.2s;
    background: transparent;
    position: relative !important;
    color: #2c2c2c;
    width: 100% !important;
    box-sizing: border-box !important;
    text-align: left;
}

.article-faq-question:hover {
    background: transparent;
    color: #1a1a1a;
}

.article-faq-question::before {
    content: "?";
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid #cfd8dc;
    color: #78909c;
    font-size: 12px;
    font-weight: 400;
    flex-shrink: 0;
    box-sizing: border-box;
}

.article-faq-question::after {
    content: "" !important;
    position: absolute !important;
    right: 20px !important;
    left: auto !important;
    top: 50% !important;
    width: 8px !important;
    height: 8px !important;
    border-right: 1.5px solid #a0aab2 !important;
    border-bottom: 1.5px solid #a0aab2 !important;
    transform: translateY(-50%) rotate(45deg) !important;
    transition: transform 0.2s, border-color 0.2s;
}

.article-faq-question:not(.collapsed)::after {
    transform: translateY(-50%) rotate(-135deg) !important;
}

.collapse {
    display: none;
}

.collapse.in {
    display: block !important;
}

.article-faq-answer {
    padding: 0px 12px 12px 50px;
    background: transparent;
    font-size: 16px !important;
    line-height: 1.6;
    color: #555;
    border-top: none;
}

.article-faq-answer p {
    margin: 0 0 8px 0;
    text-indent: 0 !important;
}

.article-faq-answer p:last-child {
    margin-bottom: 0;
}

/* --- Вкладки (Tabs) --- */
.description .article-tabs {
    margin: 20px 0;
}

.description .article-tabs-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    border-bottom: 2px solid #eee;
}

.description .article-tabs-nav [data-tab] {
    appearance: none;
    -webkit-appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    margin: 0;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    background: #f5f5f5;
    cursor: pointer;
    text-decoration: none;
    font-family: inherit;
    line-height: 1.35;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    box-shadow: none;
    transition: all .15s;
}

.description .article-tabs-nav [data-tab].active {
    background: #fff;
    color: #4a90d9;
    border-color: #ddd;
    border-bottom-color: #fff;
    margin-bottom: -2px;
}

.description .article-tabs-panels {
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 6px 6px;
}

.description .article-tabs-panel {
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

/* --- Инфо-блок (Callout) --- */
.description .article-callout {
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 6px;
    box-sizing: border-box;
}
.description .article-callout.style-well {
    background: #f8f9fa;
    border: 1px solid #e2e8f0;
}
.description .article-callout.style-info {
    background: #f0f7ff;
    border: 1px solid #d0e7ff;
    border-left: 5px solid #3182ce;
}
.description .article-callout.style-success {
    background: #f0fff4;
    border: 1px solid #c6f6d5;
    border-left: 5px solid #38a169;
}
.description .article-callout.style-warning {
    background: #fffaf0;
    border: 1px solid #feebc8;
    border-left: 5px solid #dd6b20;
}
.description .article-callout-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
}
.description .article-callout-text-col {
    flex: 1;
    min-width: 250px;
}
.description .article-callout-btn-col {
    flex-shrink: 0;
}
.description .article-callout-title {
    font-family: var(--description-font-bold), sans-serif;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 6px 0;
    line-height: 1.3;
    text-align: left;
}
.description .article-callout.style-well .article-callout-title { color: #2c3e50; }
.description .article-callout.style-info .article-callout-title { color: #2b6cb0; }
.description .article-callout.style-success .article-callout-title { color: #2f855a; }
.description .article-callout.style-warning .article-callout-title { color: #c05621; }

.description .article-callout-desc {
    margin: 0 !important;
    font-size: 13px;
    line-height: 1.45;
    color: #4a5568;
    text-indent: 0 !important;
    text-align: left;
}
.description .article-callout-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 6px;
    font-family: var(--description-font-bold), sans-serif;
    font-weight: 600;
    font-size: 13px;
    text-decoration: none !important;
    transition: background 0.2s, transform 0.1s;
    cursor: pointer;
}
.description .article-callout.style-well .article-callout-btn { background: #4a90d9; color: #fff; }
.description .article-callout.style-well .article-callout-btn:hover { background: #3a7bc8; }
.description .article-callout.style-info .article-callout-btn { background: #3182ce; color: #fff; }
.description .article-callout.style-info .article-callout-btn:hover { background: #2b6cb0; }
.description .article-callout.style-success .article-callout-btn { background: #38a169; color: #fff; }
.description .article-callout.style-success .article-callout-btn:hover { background: #2f855a; }
.description .article-callout.style-warning .article-callout-btn { background: #dd6b20; color: #fff; }
.description .article-callout.style-warning .article-callout-btn:hover { background: #c05621; }

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

    .description table.table-condensed th,
    .description table.table-condensed td {
        padding: 5px;
    }

    .description .article-tabs-nav [data-tab] {
        padding: 8px 14px;
        font-size: 13px;
    }

    .description .article-tabs-panel {
        padding: 12px 14px;
    }

    .description .article-callout-row {
        display: block !important;
    }
    .description .article-callout-btn-col {
        margin-top: 15px;
    }
    .description .article-callout-btn {
        display: flex;
        justify-content: center;
        width: 100%;
    }
}

/* --- Alert Box Block --- */
.description .alert {
    padding: 15px 20px;
    margin-bottom: 22px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-family: var(--description-font), sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    border-left: 4px solid transparent;
}
.description .alert-info {
    background-color: #ebf5ff;
    border-color: #d0e7ff;
    border-left-color: #3182ce;
    color: #2b6cb0;
}
.description .alert-success {
    background-color: #f0fdf4;
    border-color: #dcfce7;
    border-left-color: #22c55e;
    color: #15803d;
}
.description .alert-warning {
    background-color: #fffbeb;
    border-color: #fef3c7;
    border-left-color: #f59e0b;
    color: #b45309;
}
.description .alert-danger {
    background-color: #fef2f2;
    border-color: #fee2e2;
    border-left-color: #ef4444;
    color: #b91c1c;
}

/* --- Responsive Video Block --- */
.description .article-video-wrapper {
    margin-bottom: 25px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.description .embed-responsive {
    position: relative;
    display: block;
    height: 0;
    padding: 0;
    overflow: hidden;
}
.description .embed-responsive-16by9 {
    padding-bottom: 56.25%;
}
.description .embed-responsive .embed-responsive-item,
.description .embed-responsive iframe,
.description .embed-responsive embed,
.description .embed-responsive object,
.description .embed-responsive video {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
}

/* --- Image Gallery Carousel Block --- */
.description .carousel {
    position: relative;
    margin-bottom: 25px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.description .carousel-inner {
    position: relative;
    width: 100%;
    overflow: hidden;
}
.description .carousel-inner > .item {
    position: relative;
    display: none;
    transition: .6s ease-in-out left;
}
.description .carousel-inner > .item > img {
    line-height: 1;
}
.description .carousel-inner > .active {
    display: block;
}
.description .carousel-indicators {
    position: absolute;
    bottom: 10px;
    left: 50%;
    z-index: 15;
    width: 60%;
    padding-left: 0;
    margin-left: -30%;
    text-align: center;
    list-style: none;
    margin-bottom: 0;
}
.description .carousel-indicators li {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin: 1px;
    text-indent: -999px;
    cursor: pointer;
    background-color: rgba(0,0,0,0);
    border: 1px solid #fff;
    border-radius: 10px;
    transition: background-color .15s;
}
.description .carousel-indicators .active {
    width: 12px;
    height: 12px;
    margin: 0;
    background-color: #fff;
}
.description .carousel-control {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 15%;
    font-size: 20px;
    color: #fff;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0,0,0,.6);
    background-color: rgba(0,0,0,0);
    filter: alpha(opacity=50);
    opacity: .5;
    transition: opacity .15s;
    cursor: pointer;
}
.description .carousel-control:hover {
    color: #fff;
    text-decoration: none;
    filter: alpha(opacity=90);
    opacity: .9;
}
.description .carousel-control .glyphicon-chevron-left,
.description .carousel-control .glyphicon-chevron-right {
    display: none !important;
}
.description .carousel-control::before {
    content: '';
    position: absolute;
    top: 50%;
    margin-top: -10px;
    width: 20px;
    height: 20px;
    border-top: 3px solid #fff;
    border-left: 3px solid #fff;
}
.description .carousel-control.left::before {
    left: 50%;
    margin-left: -10px;
    transform: rotate(-45deg);
}
.description .carousel-control.right::before {
    right: 50%;
    margin-right: -10px;
    transform: rotate(135deg);
}
.description .carousel-control.right {
    right: 0;
    left: auto;
}
.description .carousel-caption {
    position: absolute;
    right: 15%;
    bottom: 20px;
    left: 15%;
    z-index: 10;
    padding-top: 20px;
    padding-bottom: 20px;
    color: #fff;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0,0,0,.6);
}
.description .carousel-caption h3 {
    margin: 0;
    font-size: 18px;
    font-weight: bold;
    background: rgba(0, 0, 0, 0.4);
    display: inline-block;
    padding: 6px 14px;
    border-radius: 4px;
}

/* --- Interactive Before/After Image Slider Block --- */
.description .article-ba-slider {
    position: relative;
    width: 100%;
    height: 380px;
    margin-bottom: 25px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    user-select: none;
}
.description .ba-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
}
.description .ba-before-img {
    width: 50%;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 2;
}
.description .ba-after-img {
    z-index: 1;
}
.description .ba-label {
    position: absolute;
    bottom: 12px;
    padding: 4px 8px;
    background: rgba(0,0,0,0.6);
    color: #fff;
    font-size: 11px;
    font-weight: bold;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 1px;
    z-index: 4;
}
.description .ba-label-before {
    left: 12px;
}
.description .ba-label-after {
    right: 12px;
}
.description .ba-handle-slider {
    position: absolute;
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 100%;
    background: transparent;
    outline: none;
    margin: 0;
    z-index: 5;
    cursor: ew-resize;
}
.description .ba-handle-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #5446f8;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: ew-resize;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%235446f8' d='M16 17.01V14h-8v3.01L4 13l4-4.01V12h8V8.99L20 13l-4 4.01z'/%3E%3C/svg%3E");
    background-position: center;
    background-repeat: no-repeat;
    background-size: 20px;
}
.description .ba-handle-slider::-moz-range-thumb {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #5446f8;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: ew-resize;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%235446f8' d='M16 17.01V14h-8v3.01L4 13l4-4.01V12h8V8.99L20 13l-4 4.01z'/%3E%3C/svg%3E");
    background-position: center;
    background-repeat: no-repeat;
    background-size: 20px;
}
.description .ba-handle-bar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: #fff;
    margin-left: -1px;
    z-index: 3;
    pointer-events: none;
    box-shadow: 0 0 8px rgba(0,0,0,0.3);
}

/* --- Messenger Quick Buttons Block --- */
.description .article-messengers-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 25px;
    font-family: var(--description-font), sans-serif;
}
.description .messenger-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #fff !important;
    text-decoration: none !important;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    min-width: 130px;
    cursor: pointer;
}
.description .messenger-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    color: #fff !important;
}
.description .messenger-btn:active {
    transform: translateY(0);
}
.description .messenger-btn i {
    font-size: 16px;
}
.description .messenger-wa {
    background: #25d366;
}
.description .messenger-wa:hover {
    background: #20ba5a;
}
.description .messenger-tg {
    background: #0088cc;
}
.description .messenger-tg:hover {
    background: #0077b5;
}
.description .messenger-viber {
    background: #7360f2;
}
.description .messenger-viber:hover {
    background: #5e4be6;
}
.description .messenger-phone {
    background: #2d3e50;
}
.description .messenger-phone:hover {
    background: #212f3d;
}

/* --- OpenCart Product Card Block --- */
.description .article-product-card {
    display: flex;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    padding: 16px;
    margin-bottom: 25px;
    gap: 16px;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: box-shadow 0.25s;
    font-family: var(--description-font), sans-serif;
}
.description .article-product-card:hover {
    box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}
.description .product-card-img-wrap {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.description .product-card-img-wrap img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}
.description .product-card-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.description .product-card-title {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.4;
    font-family: var(--description-font-bold), sans-serif;
}
.description .product-card-title a {
    color: #1a1a1a;
    text-decoration: none;
}
.description .product-card-title a:hover {
    color: #5446f8;
}
.description .product-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}
.description .product-card-price {
    font-size: 18px;
    font-weight: bold;
    color: #1a1a1a;
}
.description .product-card-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #5446f8;
    color: #fff !important;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none !important;
    transition: background 0.15s;
    cursor: pointer;
}
.description .product-card-btn:hover {
    background: #4335e6;
}

@media (max-width: 767px) {
    .description .article-product-card {
        flex-direction: column;
        align-items: stretch;
    }
    .description .product-card-img-wrap {
        width: 100%;
        height: 140px;
    }
    .description .product-card-footer {
        flex-direction: row;
        width: 100%;
    }
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
                    var match = contents.match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i);
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
    <file path="catalog/view/theme/*/template/common/header.twig">
        <operation>
            <search><![CDATA[</head>]]></search>
            <add position="before"><![CDATA[
<link href="catalog/view/theme/default/stylesheet/content-constructor.css" rel="stylesheet" />
            ]]></add>
        </operation>
    </file>

    <!-- 3. Storefront Anchor Scroll Handler, FAQ & Tabs -->
    <file path="catalog/view/theme/*/template/common/footer.twig">
        <operation>
            <search><![CDATA[</body>]]></search>
            <add position="before"><![CDATA[
<script type="text/javascript"><!--
document.addEventListener('click', function(event) {
  // 1. Smooth Scroll for anchors
  var link = event.target.closest('a.anchor[data-destination]');
  if (link) {
    var selector = link.getAttribute('data-destination');
    if (selector && selector.charAt(0) === '#') {
      var target = document.querySelector(selector);
      if (target) {
        event.preventDefault();
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', selector);
        } else {
          window.location.hash = selector;
        }
        var targetTop = target.getBoundingClientRect().top + window.pageYOffset - 20;
        try {
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        } catch (e) {
          window.scrollTo(0, targetTop);
        }
      }
    }
  }

  // 2. FAQ Accordion Toggle
  var question = event.target.closest('.article-faq-question');
  if (question) {
    var item = question.closest('.article-faq-item');
    if (item) {
      var targetEl = item.querySelector('.article-faq-collapse');
      if (targetEl) {
        var isCollapsed = targetEl.classList.contains('in');
        if (isCollapsed) {
          targetEl.classList.remove('in');
          question.classList.add('collapsed');
        } else {
          targetEl.classList.add('in');
          question.classList.remove('collapsed');
        }
      }
    }
  }

  // 3. Tabs Switcher
  var tabBtn = event.target.closest('.article-tabs-nav button');
  if (tabBtn) {
    var nav = tabBtn.parentNode;
    var wrapper = nav.parentNode;
    var panels = wrapper.querySelector('.article-tabs-panels');
    if (nav && panels) {
      var idx = tabBtn.getAttribute('data-tab');
      var buttons = nav.querySelectorAll('[data-tab]');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
      }
      for (var j = 0; j < panels.children.length; j++) {
        panels.children[j].style.display = 'none';
      }
      tabBtn.classList.add('active');
      var panel = panels.children[parseInt(idx, 10)];
      if (panel) {
        panel.style.display = 'block';
      }
    }
  }
});
//--></script>
            ]]></add>
        </operation>
    </file>
</modification>`;

            zip.file("install.xml", installXmlContent);
            zip.file("upload/catalog/view/theme/default/stylesheet/content-constructor.css", getExportedCSS());

            btnDownloadZip.disabled = true;
            btnDownloadZip.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Сборка...';

            const fontPaths = [
                { zip: "upload/catalog/view/theme/default/stylesheet/fonts/VenrynSans-Regular.woff", local: "css/VenrynSans-Regular.woff?v=1.0.3" },
                { zip: "upload/catalog/view/theme/default/stylesheet/fonts/VenrynSans-SemiBold.woff", local: "css/VenrynSans-SemiBold.woff?v=1.0.3" }
            ];

            const isLocal = location.protocol === 'file:';

            const loadFonts = isLocal
                ? Promise.all(fontPaths.map(fp => {
                    return new Promise((resolve) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', fp.local, true);
                        xhr.responseType = 'arraybuffer';
                        xhr.onload = () => resolve(xhr.status === 200 ? { data: xhr.response, path: fp.zip } : null);
                        xhr.onerror = () => resolve(null);
                        xhr.send();
                    });
                }))
                : Promise.all(fontPaths.map(fp =>
                    fetch(fp.local).then(res => res.ok ? res.arrayBuffer().then(d => ({ data: d, path: fp.zip })) : null).catch(() => null)
                ));

            loadFonts.then(results => {
                results.forEach(item => {
                    if (item) zip.file(item.path, item.data);
                });

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
                    var match = contents.match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i);
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
    <version>1.1</version>
    <author>Tom</author>
    <link>https://opencartforum.com.ru/</link>
    <file path="catalog/view/theme/*/template/common/header.twig">
        <operation>
            <search><![CDATA[</head>]]></search>
            <add position="before"><![CDATA[
<link href="catalog/view/theme/default/stylesheet/content-constructor.css" rel="stylesheet" />
            ]]></add>
        </operation>
    </file>
    <file path="catalog/view/theme/*/template/common/footer.twig">
        <operation>
            <search><![CDATA[</body>]]></search>
            <add position="before"><![CDATA[
<script type="text/javascript"><!--
document.addEventListener('click', function(event) {
  // 1. Smooth Scroll for anchors
  var link = event.target.closest('a.anchor[data-destination]');
  if (link) {
    var selector = link.getAttribute('data-destination');
    if (selector && selector.charAt(0) === '#') {
      var target = document.querySelector(selector);
      if (target) {
        event.preventDefault();
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', selector);
        } else {
          window.location.hash = selector;
        }
        var targetTop = target.getBoundingClientRect().top + window.pageYOffset - 20;
        try {
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        } catch (e) {
          window.scrollTo(0, targetTop);
        }
      }
    }
  }

  // 2. FAQ Accordion Toggle
  var question = event.target.closest('.article-faq-question');
  if (question) {
    var item = question.closest('.article-faq-item');
    if (item) {
      var targetEl = item.querySelector('.article-faq-collapse');
      if (targetEl) {
        var isCollapsed = targetEl.classList.contains('in');
        if (isCollapsed) {
          targetEl.classList.remove('in');
          question.classList.add('collapsed');
        } else {
          targetEl.classList.add('in');
          question.classList.remove('collapsed');
        }
      }
    }
  }

  // 3. Tabs Switcher
  var tabBtn = event.target.closest('.article-tabs-nav button');
  if (tabBtn) {
    var nav = tabBtn.parentNode;
    var wrapper = nav.parentNode;
    var panels = wrapper.querySelector('.article-tabs-panels');
    if (nav && panels) {
      var idx = tabBtn.getAttribute('data-tab');
      var buttons = nav.querySelectorAll('[data-tab]');
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
      }
      for (var j = 0; j < panels.children.length; j++) {
        panels.children[j].style.display = 'none';
      }
      tabBtn.classList.add('active');
      var panel = panels.children[parseInt(idx, 10)];
      if (panel) {
        panel.style.display = 'block';
      }
    }
  }
});
//--></script>
            ]]></add>
        </operation>
    </file>
</modification>`;
            downloadFile(xmlContent, 'content_styles.ocmod.xml', 'text/xml');
        });
    }

    // ── Article ZIP Exporter ──────────────────────────────────
    function collectAllImageBlocks(blocksList) {
        let imageBlocks = [];
        blocksList.forEach(block => {
            if (block.type === 'image') {
                imageBlocks.push(block);
            } else if (block.type === 'grid' && block.data && block.data.columns) {
                block.data.columns.forEach(col => {
                    if (col.blocks) {
                        imageBlocks.push(...collectAllImageBlocks(col.blocks));
                    }
                });
            }
        });
        return imageBlocks;
    }

    function getExtensionFromMime(mime) {
        if (mime.includes('png')) return 'png';
        if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
        if (mime.includes('gif')) return 'gif';
        if (mime.includes('webp')) return 'webp';
        if (mime.includes('svg')) return 'svg';
        return 'png';
    }

    function getExtensionFromPath(path) {
        const parts = path.split('.');
        if (parts.length > 1) {
            const ext = parts.pop().toLowerCase();
            if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
                return ext === 'jpeg' ? 'jpg' : ext;
            }
        }
        return 'png';
    }

    const btnExportZIP = $('#btnExportZIP');
    if (btnExportZIP) {
        btnExportZIP.addEventListener('click', () => {
            if (typeof JSZip === 'undefined') {
                alert('Библиотека JSZip не загружена. Проверьте подключение к интернету.');
                return;
            }

            const title = titleInput ? titleInput.value : 'Статья';
            const slug = slugInput ? slugInput.value.trim() : slugify(title) || 'article';

            btnExportZIP.disabled = true;
            btnExportZIP.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Экспорт...';

            const copiedBlocks = JSON.parse(JSON.stringify(blocks));
            const imageBlocks = collectAllImageBlocks(copiedBlocks);
            const zipPromises = [];

            const zip = new JSZip();

            imageBlocks.forEach((imgBlock, idx) => {
                let imgPromise = null;
                let ext = 'png';
                
                if (imgBlock.data.srcType === 'local') {
                    const b64Data = imgBlock.data.localSrc;
                    if (b64Data && b64Data.startsWith('data:')) {
                        const mimeMatch = b64Data.match(/^data:(image\/[a-z+]+);base64,/);
                        if (mimeMatch) {
                            ext = getExtensionFromMime(mimeMatch[1]);
                        }
                        const rawB64 = b64Data.substring(b64Data.indexOf(';base64,') + 8);
                        imgPromise = Promise.resolve({
                            data: rawB64,
                            isBase64: true,
                            ext: ext
                        });
                    }
                }
                
                if (!imgPromise && imgBlock.data.src) {
                    const srcPath = imgBlock.data.src;
                    ext = getExtensionFromPath(srcPath);
                    
                    let url = srcPath;
                    if (url.startsWith('image/catalog/content-constructor/')) {
                        const filename = url.substring('image/catalog/content-constructor/'.length);
                        url = 'image/' + filename;
                    }
                    
                    imgPromise = fetch(url)
                        .then(res => {
                            if (!res.ok) throw new Error('Fetch failed');
                            return res.arrayBuffer();
                        })
                        .then(buf => {
                            return {
                                data: buf,
                                isBase64: false,
                                ext: ext
                            };
                        })
                        .catch(err => {
                            console.warn('Could not fetch image for ZIP packaging:', url, err);
                            return null;
                        });
                }
                
                if (imgPromise) {
                    const newFilename = `${slug}-img-${idx + 1}`;
                    zipPromises.push(
                        imgPromise.then(res => {
                            if (res) {
                                const finalExt = res.ext || ext;
                                const zipPath = `image/catalog/content-constructor/${slug}/${newFilename}.${finalExt}`;
                                
                                imgBlock.data.src = zipPath;
                                imgBlock.data.srcType = 'path';
                                
                                return {
                                    path: zipPath,
                                    data: res.data,
                                    isBase64: res.isBase64
                                };
                            }
                            return null;
                        })
                    );
                }
            });

            Promise.all(zipPromises).then(imagesToAdd => {
                imagesToAdd.forEach(img => {
                    if (img) {
                        if (img.isBase64) {
                            zip.file(img.path, img.data, { base64: true });
                        } else {
                            zip.file(img.path, img.data);
                        }
                    }
                });

                // Generate clean HTML
                const { tocHTML, contentHTML } = renderArticlePartsForBlocks(copiedBlocks, 'toHTML');
                const cleanHTML = `${tocHTML}<div class="description">\n${contentHTML}</div>`;

                // Add HTML to zip
                zip.file(`content-${slug}.html`, cleanHTML);

                return zip.generateAsync({ type: "blob" });
            }).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `article-${slug}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                btnExportZIP.disabled = false;
                btnExportZIP.innerHTML = '<span class="btn-icon"><i class="fa fa-file-archive-o"></i></span> Скачать ZIP статьи';
            }).catch(err => {
                console.error('Ошибка при экспорте ZIP статьи:', err);
                alert('Не удалось экспортировать статью в ZIP-архив.');
                btnExportZIP.disabled = false;
                btnExportZIP.innerHTML = '<span class="btn-icon"><i class="fa fa-file-archive-o"></i></span> Скачать ZIP статьи';
            });
        });
    }

    // ── Global Drag & Drop workspace targets ─────────────────
    blocksContainer.addEventListener('dragover', (e) => {
        if (dragState.dragging) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }
    });

    blocksContainer.addEventListener('drop', (e) => {
        if (e.target === blocksContainer || e.target === workspaceEmpty || e.target.classList.contains('blocks-container')) {
            e.preventDefault();
            const fromId = e.dataTransfer.getData('text/plain');
            
            let movedBlock = null;
            const topIdx = blocks.findIndex(b => b.id === fromId);
            if (topIdx !== -1) {
                movedBlock = blocks[topIdx];
                blocks.splice(topIdx, 1);
            } else {
                const nested = findNestedBlock(fromId);
                if (nested) {
                    movedBlock = nested.block;
                    nested.column.blocks.splice(nested.idx, 1);
                }
            }
            
            if (movedBlock) {
                blocks.push(movedBlock);
                renderBlocks();
                updatePreview();
            }
        }
    });

    // ── Initial Render ───────────────────────────────────────
    renderBlocks();
    updatePreview();

    if (window.innerWidth <= 768) {
        document.body.classList.add('preview-hidden');
    }

    syncMobileHeaderHeight();

})();
