<template>
  <div ref="container" class="aurea-eden-bpmn-diagram" style="width: 100%; height: 100%; overflow: hidden;"></div>
</template>

<script>
import { BpmnDiagram } from '../notations/BpmnDiagram.js';
import { shallowRef, onMounted, onUnmounted, watch } from 'vue';

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

    // --- Watchers ---
    watch(() => props.mode, (newMode) => {
        if (diagramInstance.value) diagramInstance.value.setMode(newMode);
    });

    watch(() => props.helpers, (newVal) => {
        if (diagramInstance.value) {
            newVal ? diagramInstance.value.showHelpers() : diagramInstance.value.hideHelpers();
        }
    });

    watch(() => props.bpmnXml, (newXml) => {
        parseAndBuild(newXml);
    });

    watch(() => props.values, (newValues) => {
        applyValues(newValues);
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
