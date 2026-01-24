<template>
  <div ref="container" class="aurea-eden-bpmn-diagram" style="width: 100%; height: 100%; overflow: hidden;"></div>
</template>

<script>
import { BpmnDiagram } from '../notations/BpmnDiagram.js';
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
        const diagram = new BpmnDiagram(container.value);
        diagramInstance.value = diagram;

        // Apply theme
        if (props.theme) diagram.setTheme(props.theme);

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
        } catch (e) {
            console.error("Error parsing BPMN XML:", e);
        }
    };

    const applyValues = (values) => {
        if (!diagramInstance.value || !values) return;
        
        let updated = false;
        Object.entries(values).forEach(([id, val]) => {
            const el = diagramInstance.value.getElementById(id);
            if (el) {
                el.parameters.value = val;
                updated = true;
            } else {
                // Warn or ignore if element ID from JSON doesn't exist in diagram
            }
        });

        // If in ANALYZE mode and we updated values, we might need to refresh visualization
        // The simplest way with current Diagram implementation is to re-set the mode.
        if (updated && props.mode === 'ANALYZE') {
            diagramInstance.value.setMode('ANALYZE');
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
        if (diagramInstance.value) diagramInstance.value.setMode(newMode);
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
