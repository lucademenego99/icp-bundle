import { createCodeMirror } from './ceCreation.js';

import ceTemplateBase from './html/ceTemplateBase.html';
import ceTemplateInput from './html/ceTemplateInput.html';
import ceTemplateTabs from './html/ceTemplateTabs.html';

import ceStyleBase from './styles/ceStyleBase.css';
import ceStyleInput from './styles/ceStyleInput.css';
import ceStyleDark from './styles/ceStyleDark.css';
import ceStyleVertical from './styles/ceStyleVertical.css';
import ceStyleInputVertical from './styles/ceStyleInputVertical.css';
import ceStyleTabs from './styles/ceStyleTabs.css';

/**
 * Create the following web components:
 * - `<{language}-editor />`: base editor, light mode;
 * - `<{language}-editor-input />`: base editor, light mode with input;
 * - `<{language}-editor-dark />`: base editor, dark mode;
 * - `<{language}-editor-input-dark />`: base editor, dark mode with input;
 * - `<{language}-editor-v />`: vertical editor, light mode;
 * - `<{language}-editor-v-input />`: vertical editor, light mode with input;
 * - `<{language}-editor-v-dark />`: vertical editor, dark mode;
 * - `<{language}-editor-v-input-dark />`: vertical editor, dark mode with input;
 * - `<{language}-editor-tabs-dark />`: editor with three tabs for code, input and output, dark mode.
 */
export default function createComponents() {

    /**
     * @param html Template's HTML
     * @param styles Template's CSS
     * @param enableDarkMode Enable dark mode
     * @param areTabs Enable tabs handling
     * @param language Chosen programming language
     * @returns Custom class extending HTMLElement for the creation of a shadow DOM component
     */
    function ceComponentElement(html, styles, enableDarkMode, areTabs, language) {
        return class extends HTMLElement {
            constructor() {
                super();
            }

            /**
             * Handle the tabs mode by adding an event listener to [data-tab-target] elements
             * When clicking on a certain tab, some classes will be added to the tabs and and their content.
             * In detail:
             * - tabs ([data-tab-target]):
             *   - class `active` on the currently selected tab
             *   - no class otherwise
             * - tabs content ([data-tab-content]):
             *   - class `active-item` for the content of the currently selected tab
             *   - no class otherwise
             * @param document Base root of the HTML document (useful when using shadow dom)
             */
            handleTabsMode(document) {
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

            /**
             * When connected, attach the shadow component in open mode.
             * Add html and styles to the shadow, create the codemirror editor and, if needed, handle the tabs mode.
             */
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

                createCodeMirror(shadow, language, enableDarkMode, this.getAttribute('value'));

                if (areTabs) {
                    this.handleTabsMode(shadow);
                }
            }
        };
    }

    /**
     * Generate Light components: <{language}-editor />
     */
    define(ceTemplateBase, [ceStyleBase]);

    /**
     * Generate Dark components: <{language}-editor-dark />
     */
    define(ceTemplateBase, [ceStyleBase, ceStyleDark], true);

    /**
     * Generate Vertical components: <{language}-editor-v />
     */
    define(ceTemplateBase, [ceStyleBase, ceStyleVertical], false, '-v');

    /**
     * Generate Dark Vertical components: <{language}-editor-v-dark />
     */
    define(ceTemplateBase, [ceStyleBase, ceStyleVertical, ceStyleDark], true, '-v');

    /**
     * Generate Tabs components: <{language}-editor-tabs-dark />
     */
    define(ceTemplateTabs, [ceStyleBase, ceStyleTabs], true, '-tabs', true);

    /**
     * Generate Light components with input: <{language}-editor-input />
     */
    define(ceTemplateInput, [ceStyleBase, ceStyleInput], false, '-input', false);

    /**
     * Generate Dark components with input: <{language}-editor-input-dark />
     */
    define(ceTemplateInput, [ceStyleBase, ceStyleInput, ceStyleDark], true, '-input', false);

    /**
     * Generate Light Vertical components with input: <{language}-editor-v-input />
     */
    define(ceTemplateInput, [ceStyleBase, ceStyleInputVertical], false, '-v-input', false);

    /**
     * Generate Dark Vertical components with input: <{language}-editor-v-input-dark />
     */
    define(ceTemplateInput, [ceStyleBase, ceStyleInputVertical, ceStyleDark], true, '-v-input', false);

    /**
     * Create the components using customElements
     * @param html The template's HTML
     * @param styles The template's CSS, provided as an array in which the styles are applied from the first to the last one
     * @param enableDarkMode Check whether dark mode should be enabled
     * @param additionalName String appended to the component's name
     * @param areTabs Check whether tabs mode should be enabled
     */
    function define(html, styles, enableDarkMode = false, additionalName = '', areTabs = false) {
        console.warn("Creating Component javascript-editor" + additionalName + (enableDarkMode ? '-dark' : ''));
        customElements.define('javascript-editor' + additionalName + (enableDarkMode ? '-dark' : ''), ceComponentElement(html, styles, enableDarkMode, areTabs, "javascript"));

        console.warn("Creating Component typescript-editor" + additionalName + (enableDarkMode ? '-dark' : ''));
        customElements.define('typescript-editor' + additionalName + (enableDarkMode ? '-dark' : ''), ceComponentElement(html, styles, enableDarkMode, areTabs, "typescript"));

        console.warn("Creating Component cpp-editor" + additionalName + (enableDarkMode ? '-dark' : ''));
        customElements.define('cpp-editor' + additionalName + (enableDarkMode ? '-dark' : ''), ceComponentElement(html, styles, enableDarkMode, areTabs, "cpp"));

        console.warn("Creating Component java-editor" + additionalName + (enableDarkMode ? '-dark' : ''));
        customElements.define('java-editor' + additionalName + (enableDarkMode ? '-dark' : ''), ceComponentElement(html, styles, enableDarkMode, areTabs, "java"));
    }
}