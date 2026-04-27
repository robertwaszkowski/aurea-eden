<template>
  <div ref="container" class="aurea-eden-bpmn-diagram" style="width: 100%; height: 100%; overflow: hidden;"></div>
</template>

<script>
import { BpmnDiagram } from '../notations/bpmn/BpmnDiagram.js';
import { StarShape } from '../shapes/solids/StarShape.js';
import { shallowRef, onMounted, onUnmounted, watch } from 'vue';
import starUrl from '../../assets/star_gold.gif';
import starSilverUrl from '../../assets/star_silver.gif';
import starSvgUrl from '../../assets/star_gold.svg';
import starSilverSvgUrl from '../../assets/star_silver.svg';

export default {
  name: 'AureaEdenBpmnDiagram',
  props: {
    bpmnXml: {
      type: String,
      default: ''
    },
    values: {
      type: Object,
      default: () => ({})
    },
    mode: {
      type: String,
      default: 'VIEW'
    },
    helpers: {
      type: Boolean,
      default: false
    },
    myActiveTasks: {
      type: Array,
      default: () => []
    },
    otherActiveTasks: {
      type: Array,
      default: () => []
    },
    legacyStars: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: 'LIGHT'
    }
  },
  setup(props, { expose, emit }) {
    const container = shallowRef(null);
    const diagramInstance = shallowRef(null);

    // --- Initialization ---
    onMounted(() => {
      if (container.value) {
        const diagram = new BpmnDiagram(container.value, { theme: props.theme, mode: props.mode });
        diagramInstance.value = diagram;

        // Apply theme
        if (props.theme) diagram.setTheme(props.theme);

        // --- Proxy methods for Vue reactivity ---
        // We intercept these methods to emit events back to Vue when the internal state changes
        const originalSetMode = diagram.setMode.bind(diagram);
        diagram.setMode = (mode, onComplete) => {
          originalSetMode(mode, onComplete);
          emit('update:mode', mode);
          emit('mode-change', mode);
        };

        const originalReset = diagram.reset.bind(diagram);
        diagram.reset = () => {
          originalReset();
          // After reset, the library always goes back to 'VIEW' mode
          emit('update:mode', 'VIEW');
          emit('mode-change', 'VIEW');
        };

        // Apply helpers
        if (props.helpers) diagram.showHelpers();
        
        // Initial build if XML is provided
        if (props.bpmnXml) {
          parseAndBuild(props.bpmnXml);
        }

        // Apply initial mode (after build so elements are present)
        if (props.mode) diagram.setMode(props.mode);
      }
    });

    onUnmounted(() => {
      if (diagramInstance.value) {
        diagramInstance.value.dispose();
      }
    });

    // --- Helpers ---
    const parseAndBuild = (xml) => {
        if (!diagramInstance.value || !xml) return;
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, "text/xml");
            diagramInstance.value.clear();
            diagramInstance.value.buildDiagram(xmlDoc);
            
            // Ensure camera is fitted to the new content
            diagramInstance.value.fitScreen();

            // Re-apply values after build
            applyValues(props.values);
            
            // Re-apply badges after build
            updateBadges();

            // buildDiagram now internally handles re-applying theme and mode
        } catch (e) {
            console.error("Error parsing BPMN XML:", e);
        }
    };

    const applyValues = (values) => {
        if (!diagramInstance.value || !values) return;

        /**
         * Normalizes one bar entry to canonical form: { heightValue, colorValue, colorsInverted }.
         * Accepts: number | { heightValue, colorValue?, colorsInverted? }
         */
        const normalizeBarEntry = (entry) => {
            if (typeof entry === 'number') {
                return { heightValue: entry, colorValue: entry, colorsInverted: false };
            }
            if (entry !== null && typeof entry === 'object') {
                const { heightValue, colorValue, colorsInverted = false } = entry;
                return {
                    heightValue,
                    colorValue: colorValue !== undefined ? colorValue : heightValue,
                    colorsInverted
                };
            }
            return null;
        };

        /**
         * Normalizes the full value for one element into an array of bar definitions.
         * Accepts:
         *   42                              → one bar shorthand
         *   { heightValue, ... }            → one bar with options
         *   [42, 15]                        → two bars (each shorthand or object)
         */
        const normalizeBars = (val) => {
            if (typeof val === 'number') {
                return [normalizeBarEntry(val)];
            }
            if (Array.isArray(val)) {
                return val.map(normalizeBarEntry).filter(Boolean);
            }
            if (val !== null && typeof val === 'object') {
                return [normalizeBarEntry(val)];
            }
            return null;
        };

        let updated = false;

        // Reset all active elements first
        diagramInstance.value.elements.forEach(el => {
            if (el.parameters && el.parameters.bars && el.parameters.bars.length > 0) {
                el.parameters.bars = [];
                el.parameters.value = 0;
                updated = true;
            }
        });

        Object.entries(values).forEach(([id, val]) => {
            const el = diagramInstance.value.getElementById(id);
            if (el) {
                if (!el.parameters) el.parameters = {};
                const bars = normalizeBars(val);
                if (!bars || bars.length === 0 || (bars.length === 1 && bars[0].heightValue === 0)) {
                    el.parameters.bars = [];
                    el.parameters.value = 0;
                    updated = true;
                } else {
                    el.parameters.bars = bars;
                    // Keep backward-compat alias
                    el.parameters.value = bars[0].heightValue;
                    updated = true;
                }
            }
        });

        // If in ANALYZE mode and we updated values, refresh visualization
        if (updated && props.mode === 'ANALYZE') {
            if (diagramInstance.value.isTransitioning) {
                // If it's currently transitioning to ANALYZE, it will pick up the new values automatically
            } else {
                // Explicitly refresh the bars without changing the camera
                diagramInstance.value.removeValueBars();
                diagramInstance.value._initAnalyzeBars();
                diagramInstance.value._applyAnalyzeModeTheming();
            }
        }
    };


    // --- Badges ---
    const badgedElementIds = new Set();

    const updateBadges = () => {
        if (!diagramInstance.value) return;

        // 1. Clear existing badges
        badgedElementIds.forEach(id => {
            const el = diagramInstance.value.getElementById(id);
            if (el) el.clearBadges();
        });
        badgedElementIds.clear();

        // Helper to check badge type
        const isGif = props.legacyStars;

        // 2. Add badges for my active tasks
        if (props.myActiveTasks) {
            props.myActiveTasks.forEach(id => {
                const el = diagramInstance.value.getElementById(id);
                if (el) {
                    el.userData.taskType = 'my'; // Tag as My Task
                    if (isGif) {
                        el.addBadge(starUrl, 'top-right', 30, true);
                    } else {
                        // Gold Star with explicit animation
                        el.addBadge(new StarShape(15, 5, 0xffd700), 'top-right', null, true);
                        const badge = el.badges[el.badges.length - 1].element;
                        badge.semanticType = 'my-task';
                        badge.themable = true;
                    }
                    badgedElementIds.add(id);
                }
            });
        }

        // 3. Add badges for other active tasks
        if (props.otherActiveTasks) {
            props.otherActiveTasks.forEach(id => {
                const el = diagramInstance.value.getElementById(id);
                if (el) {
                    // Avoid double badging if same ID is in both lists (prioritize myActiveTasks)
                    if (!badgedElementIds.has(id)) {
                        el.userData.taskType = 'other'; // Tag as Other Task
                        if (isGif) {
                             el.addBadge(starSilverUrl, 'top-right', 30, true);
                        } else {
                            // Silver Star with explicit animation
                            el.addBadge(new StarShape(15, 5, 0xc0c0c0), 'top-right', null, true);
                            const badge = el.badges[el.badges.length - 1].element;
                            badge.semanticType = 'other-task';
                            badge.themable = true;
                        }
                        badgedElementIds.add(id);
                    }
                }
            });
        }
    };

    // --- Watchers ---
    watch(() => props.mode, (newMode) => {
        if (diagramInstance.value && diagramInstance.value.mode !== newMode) {
          diagramInstance.value.setMode(newMode);
        }
    });

    watch(() => props.helpers, (newVal) => {
        if (diagramInstance.value) {
            newVal ? diagramInstance.value.showHelpers() : diagramInstance.value.hideHelpers();
        }
    });

    watch(() => props.theme, (newTheme) => {
        if (diagramInstance.value) diagramInstance.value.setTheme(newTheme);
    });

    watch(() => props.bpmnXml, (newXml) => {
        parseAndBuild(newXml);
    });

    watch(() => props.values, (newValues) => {
        applyValues(newValues);
    }, { deep: true });

    watch([() => props.myActiveTasks, () => props.otherActiveTasks, () => props.legacyStars], () => {
        updateBadges();
    }, { deep: true });


    // --- Exposed Methods (Controls) ---
    const reset = () => {
        if (diagramInstance.value) diagramInstance.value.reset();
    };
    
    const clear = () => {
        if (diagramInstance.value) diagramInstance.value.clear();
    };

    const importDiagram = (file) => {
         if (diagramInstance.value) diagramInstance.value.import(file);
    };

    const exportDiagram = () => {
         if (diagramInstance.value) diagramInstance.value.export();
    };

    expose({
        reset,
        clear,
        import: importDiagram,
        export: exportDiagram,
        diagramInstance // Expose internal instance if parent needs direct access
    });

    return {
        container
    };
  }
};
</script>

