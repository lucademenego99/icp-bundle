import { createCodeMirror } from './ceCreation.js';

import ceTemplateBase from './html/ceTemplateBase.html';
import ceTemplateTabs from './html/ceTemplateTabs.html';

import ceStyleBase from './styles/ceStyleBase.css';
import ceStyleDark from './styles/ceStyleDark.css';
import ceStyleDarkVertical from './styles/ceStyleDarkVertical.css';
import ceStyleLightVertical from './styles/ceStyleLightVertical.css';
import ceStyleTabs from './styles/ceStyleTabs.css';

export default function createComponents() {

    /**
     * Generate Light components:
     * - <javascript-editor />
     * - <typescript-editor />
     * - <java-editor />
     * - <cpp-editor />
     */
    define(ceTemplateBase, [ceStyleBase]);

    /**
     * Generate Dark components:
     * - <javascript-editor-dark />
     * - <typescript-editor-dark />
     * - <java-editor-dark />
     * - <cpp-editor-dark />
     */
    define(ceTemplateBase, [ceStyleBase, ceStyleDark], true);

    /**
     * Generate Vertical components:
     * - <javascript-editor-v />
     * - <typescript-editor-v />
     * - <java-editor-v />
     * - <cpp-editor-v />
     */
    define(ceTemplateBase, [ceStyleBase, ceStyleLightVertical], false, '-v');

    /**
     * Generate Dark Vertical components:
     * - <javascript-editor-v-dark />
     * - <typescript-editor-v-dark />
     * - <java-editor-v-dark />
     * - <cpp-editor-v-dark />
     */
    define(ceTemplateBase, [ceStyleBase, ceStyleDarkVertical], true, '-v');

    /**
     * Generate Tabs components:
     * - <javascript-editor-tabs-dark />
     * - <typescript-editor-tabs-dark />
     * - <java-editor-tabs-dark />
     * - <cpp-editor-tabs-dark />
     */
    define(ceTemplateTabs, [ceStyleBase, ceStyleTabs], true, '-tabs', true);

    /**
     * Create the components using customElements
     * @param html The template's HTML
     * @param enableDarkMode Check whether dark mode should be enabled
     * @param areTabs Check if the UI is in tabs mode
     */
    function define(html, styles, enableDarkMode = false, additionalName = '', areTabs = false) {
        console.warn("Creating Component javascript-editor" + additionalName + (enableDarkMode ? '-dark' : ''));
        customElements.define('javascript-editor' + additionalName + (enableDarkMode ? '-dark' : ''),
            class extends HTMLElement {
                constructor() {
                    super();
                }

                connectedCallback() {
                    let shadow = this.attachShadow({ mode: 'open' })
                    shadow.innerHTML = html;

                    for (const style in styles) {
                        if (Object.hasOwnProperty.call(styles, style)) {
                            const element = styles[style];
                            var styleSheet = document.createElement("style");
                            styleSheet.innerText = element;
                            shadow.appendChild(styleSheet);
                        }
                    }

                    // shadow.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));

                    createCodeMirror(shadow, 'javascript', enableDarkMode, this.getAttribute('value'));

                    if (areTabs) {
                        handleTabsMode(shadow);
                    }
                }
            }
        );

        console.warn("Creating Component typescript-editor" + additionalName + (enableDarkMode ? '-dark' : ''));
        customElements.define('typescript-editor' + additionalName + (enableDarkMode ? '-dark' : ''),
            class extends HTMLElement {
                constructor() {
                    super();
                }

                connectedCallback() {
                    let shadow = this.attachShadow({ mode: 'open' })
                    shadow.innerHTML = html;

                    for (const style in styles) {
                        if (Object.hasOwnProperty.call(styles, style)) {
                            const element = styles[style];
                            var styleSheet = document.createElement("style");
                            styleSheet.innerText = element;
                            shadow.appendChild(styleSheet);
                        }
                    }

                    createCodeMirror(shadow, 'typescript', enableDarkMode, this.getAttribute('value'));

                    if (areTabs) {
                        handleTabsMode(shadow);
                    }
                }
            }
        );

        console.warn("Creating Component cpp-editor" + additionalName + (enableDarkMode ? '-dark' : ''));
        customElements.define('cpp-editor' + additionalName + (enableDarkMode ? '-dark' : ''),
            class extends HTMLElement {
                constructor() {
                    super();
                }

                connectedCallback() {
                    let shadow = this.attachShadow({ mode: 'open' })
                    shadow.innerHTML = html;

                    for (const style in styles) {
                        if (Object.hasOwnProperty.call(styles, style)) {
                            const element = styles[style];
                            var styleSheet = document.createElement("style");
                            styleSheet.innerText = element;
                            shadow.appendChild(styleSheet);
                        }
                    }
                    createCodeMirror(shadow, 'cpp', enableDarkMode, this.getAttribute('value'));

                    if (areTabs) {
                        handleTabsMode(shadow);
                    }
                }
            }
        );

        console.warn("Creating Component java-editor" + additionalName + (enableDarkMode ? '-dark' : ''));
        customElements.define('java-editor' + additionalName + (enableDarkMode ? '-dark' : ''),
            class extends HTMLElement {
                constructor() {
                    super();
                }

                connectedCallback() {
                    let shadow = this.attachShadow({ mode: 'open' })
                    shadow.innerHTML = html;

                    for (const style in styles) {
                        if (Object.hasOwnProperty.call(styles, style)) {
                            const element = styles[style];
                            var styleSheet = document.createElement("style");
                            styleSheet.innerText = element;
                            shadow.appendChild(styleSheet);
                        }
                    }

                    createCodeMirror(shadow, 'java', enableDarkMode, this.getAttribute('value'));

                    if (areTabs) {
                        handleTabsMode(shadow);
                    }
                }
            }
        );
    }

    function handleTabsMode(document) {
        const tabs = document.querySelectorAll('[data-tab-target]')
        const tabContents = document.querySelectorAll('[data-tab-content]')

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = document.querySelector(tab.dataset.tabTarget);
                tabContents.forEach(tabContent => {
                    tabContent.classList.remove('active-item');
                })
                tabs.forEach(tab => {
                    tab.classList.remove('active');
                })
                tab.classList.add('active');
                target.classList.add('active-item');
            })
        });

        document.querySelector("#run-button").addEventListener('click', () => {
            tabs[2].click();
        });
    }
}