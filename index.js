
import { createApp, nextTick, shallowRef, ref, computed } from 'vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import AureaEdenBpmnDiagram from './lib/components/AureaEdenBpmnDiagram.vue';
import simpleBpmnTemplate from './demo/VueWrapperBpmnDemo/simple-process-template.bpmn?raw';
import wniosekOWsparcieBpmn from './demo/VueWrapperBpmnDemo/wniosek-o-wsparcie.bpmn?raw';

const vuetify = createVuetify({
  components,
  directives,
});

const DiagramControls = {
  props: {
    diagram: Object,
    wrapperComponent: Object,
    legacyStars: Boolean,
    theme: String
  },
  data() {
    return {
      mode: 'VIEW',
      camPosition: '(... Loading ...)',
      camLookAt: '(... Loading ...)',
      helpersEnabled: false,
      modes: ['VIEW', 'ANALYZE'],
    };
  },
  watch: {
    diagram: {
      handler(newDiagram, oldDiagram) {
        if (oldDiagram && oldDiagram.controls) {
          oldDiagram.controls.removeEventListener('change', this.readCameraPosition);
        }
        if (newDiagram) {
          if (newDiagram.controls) {
            newDiagram.controls.addEventListener('change', this.readCameraPosition);
          }
          this.readCameraPosition(); // Initial read
          this.helpersEnabled = newDiagram.helpers;
        }
      },
      immediate: true,
    },
    mode(newMode) {
      // If we don't have a wrapper component, we must update the diagram instance directly
      if (!this.wrapperComponent && this.diagram) {
        this.diagram.setMode(newMode);
      }
      this.$emit('update:mode', newMode);
    },
    helpersEnabled(enabled) {
      if (!this.wrapperComponent && this.diagram) {
        if (enabled) this.diagram.showHelpers();
        else this.diagram.hideHelpers();
      }
      this.$emit('update:helpers', enabled);
    }
  },
  computed: {
    legacyStarsModel: {
      get() { return this.legacyStars; },
      set(val) { this.$emit('update:legacyStars', val); }
    },
    isDarkMode: {
      get() { return this.theme === 'DARK'; },
      set(val) { this.$emit('update:theme', val ? 'DARK' : 'LIGHT'); }
    }
  },
  methods: {
    readCameraPosition() {
      if (this.diagram && this.diagram.camera && this.diagram.controls) {
        const cameraPosition = this.diagram.camera.position.clone();
        const cameraTarget = this.diagram.controls.target.clone();
        this.camPosition = `(${cameraPosition.x.toFixed(2)}, ${cameraPosition.y.toFixed(2)}, ${cameraPosition.z.toFixed(2)})`;
        this.camLookAt = `(${cameraTarget.x.toFixed(2)}, ${cameraTarget.y.toFixed(2)}, ${cameraTarget.z.toFixed(2)})`;
      }
    },
    resetDiagram() {
      this.mode = 'VIEW';
      if (this.wrapperComponent) {
        this.wrapperComponent.reset();
      } else if (this.diagram) {
        this.diagram.reset();
      }
    },
    importDiagram() {
      if (this.wrapperComponent) {
        // Wrapper handles import
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.bpmn';
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            this.wrapperComponent.import(file);
          }
        };
        input.click();
      } else if (this.diagram) {
        console.log('Importing diagram');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.bpmn';
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            console.log(file);
            this.diagram.import(file);
          }
        };
        input.click();
      }
    },
    exportDiagram() {
      if (this.wrapperComponent) {
        this.wrapperComponent.export();
      } else if (this.diagram) {
        this.diagram.export();
      }
    },
    clearDiagram() {
      if (this.wrapperComponent) {
        this.wrapperComponent.clear();
      } else if (this.diagram) {
        this.diagram.clear();
      }
    },
  },
  template: `
    <v-card class="pa-4">
      <v-card-title>Diagram Controls</v-card-title>
      <v-card-text>
            <v-list density="compact">
            <v-list-subheader>Mode</v-list-subheader>
            <v-radio-group v-model="mode" inline>
                <v-radio label="VIEW" value="VIEW"></v-radio>
                <v-radio label="ANALYZE" value="ANALYZE"></v-radio>
            </v-radio-group>

            <v-divider></v-divider>

            <v-list-item>
                <v-switch 
                    v-model="helpersEnabled" 
                    label="Toggle Helpers" 
                    density="compact" 
                    hide-details
                    color="primary"
                    class="ml-2"
                ></v-switch>
            </v-list-item>
            <v-list-item>
                <v-switch 
                    v-model="isDarkMode" 
                    label="Dark Mode"
                    density="compact" 
                    hide-details
                    color="primary"
                    class="ml-2"
                ></v-switch>
            </v-list-item>
            <v-list-item>
                <v-switch 
                    v-model="legacyStarsModel" 
                    label="Use Legacy Stars"
                    density="compact" 
                    hide-details
                    color="primary"
                    class="ml-2"
                ></v-switch>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item @click="resetDiagram">
                <template v-slot:prepend>
                <v-icon>mdi-reload</v-icon>
                </template>
                <v-list-item-title>Reset Diagram</v-list-item-title>
            </v-list-item>
            <v-list-item @click="exportDiagram">
                <template v-slot:prepend>
                <v-icon>mdi-export</v-icon>
                </template>
                <v-list-item-title>Export Diagram</v-list-item-title>
            </v-list-item>
            <v-list-item @click="importDiagram">
                <template v-slot:prepend>
                <v-icon>mdi-import</v-icon>
                </template>
                <v-list-item-title>Import Diagram</v-list-item-title>
            </v-list-item>
            <v-list-item @click="clearDiagram">
                <template v-slot:prepend>
                <v-icon>mdi-delete</v-icon>
                </template>
                <v-list-item-title>Clear Diagram</v-list-item-title>
            </v-list-item>
        </v-list>

        <v-divider class="my-4"></v-divider>

        <v-list-item title="Camera Position" :subtitle="camPosition"></v-list-item>
        <v-list-item title="Camera LookAt" :subtitle="camLookAt"></v-list-item>
      </v-card-text>
    </v-card>
  `,
};

const App = {
  components: {
    DiagramControls,
    AureaEdenBpmnDiagram
  },
  data() {
    return {
      selectedDemo: 'VueWrapperBpmnDemo',
      demos: [
        { title: 'Vue Wrapper BPMN Demo', value: 'VueWrapperBpmnDemo' },
        { title: 'Text Annotation Demo', value: 'TextAnnotationDemo' },
        { title: 'Order Processing Demo', value: 'OrderProcessingDemo' },
        { title: 'Simple BPMN', value: 'SimpleBPMN' },
        { title: 'Shapes Demo', value: 'ShapesDemo' },
        { title: 'Badges Demo', value: 'BadgesDemo' },
        { title: 'Custom Notation Demo', value: 'CustomNotationDemo' }
      ],
      diagramInstance: shallowRef(null), // Use shallowRef for non-reactive diagram object
      drawer: true, // For v-navigation-drawer

      // Wrapper Props
      wrapperMode: 'VIEW',
      wrapperHelpers: false,
      bpmnXml: '',
      barValues: {},
      myActiveTasks: [],
      myActiveTasks: [],
      otherActiveTasks: [],
      legacyStars: false,
      wrapperTheme: 'LIGHT',

      // Legacy support
      isVueDemo: false
    };
  },
  methods: {
    async loadDemo() {
      // Cleanup previous state
      this.isVueDemo = false;
      this.diagramInstance = null;
      this.bpmnXml = '';
      this.barValues = {};
      this.myActiveTasks = [];
      this.otherActiveTasks = [];

      const container = document.getElementById('diagram-container');
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }

      if (this.selectedDemo === 'VueWrapperBpmnDemo') {
        this.isVueDemo = true;
        // Defer logic until component is mounted via v-if
        await nextTick();
        // Set Props
        this.bpmnXml = simpleBpmnTemplate;
        this.barValues = {
          'TaskQuotationHandling': 20,
          'TaskApproveOrder': 80,
          '_6-190': 50, // Order Handling
          '_6-241': 40, // Shipping Handling
          'TaskReviewOrder': 90
        };
        this.myActiveTasks = ['_6-190']; // Order Handling
        this.otherActiveTasks = ['_6-241']; // Shipping Handling as silver
        // Get instance from ref
        if (this.$refs.diagramRef) {
          this.diagramInstance = this.$refs.diagramRef.diagramInstance;
        }
      } else if (this.selectedDemo === 'TextAnnotationDemo') {
        this.isVueDemo = true;
        await nextTick();
        this.bpmnXml = wniosekOWsparcieBpmn;
        this.barValues = {
          'Activity_0otz49q': 15,
          'Activity_0emz3c3': 60,
          'Activity_0mcyc3a': 30,
          'Activity_0czbr6c': 85
        };
        this.myActiveTasks = ['Activity_0emz3c3']; // Zarejestruj i zweryfikuj wniosek
        this.otherActiveTasks = ['Activity_0otz49q']; // Dekretuj wniosek
        if (this.$refs.diagramRef) {
          this.diagramInstance = this.$refs.diagramRef.diagramInstance;
        }
      } else {
        await nextTick(async () => {
          try {
            // Dynamically import the demo module
            const demoModule = await import(`./demo/${this.selectedDemo}/index.js`);
            // Call the default export function to create the diagram
            // We need the container element again because v-if might have recreated it
            const el = document.getElementById('diagram-container');
            if (el) {
              this.diagramInstance = demoModule.default(el);
            }
          } catch (error) {
            console.error(`Error loading demo ${this.selectedDemo}:`, error);
          }
        });
      }
    },

    // Handler to sync mode from controls back to wrapper props
    updateMode(newMode) {
      this.wrapperMode = newMode;
    },
    updateHelpers(enabled) {
      this.wrapperHelpers = enabled;
    }
  },
  mounted() {
    this.loadDemo();
  },
  watch: {
    // When using wrapper, we need to sync diagramInstance ref if the component recreates it (though it shouldn't often)
    // But mainly we need to ensure controls get the right object.
    '$refs.diagramRef.diagramInstance': function (val) {
      if (this.isVueDemo) {
        this.diagramInstance = val;
      }
    }
  },
  template: `
    <v-app>
        <v-navigation-drawer v-model="drawer" permanent location="left" width="300">
            <v-toolbar color="primary">
                <v-toolbar-title>Aurea EDEN Demos</v-toolbar-title>
            </v-toolbar>
            <v-list nav>
            </v-list>
            <template v-slot:append>
                <DiagramControls
                    :diagram="diagramInstance" 
                    :wrapperComponent="$refs.diagramRef"
                    :legacyStars="legacyStars"
                    :theme="wrapperTheme"
                    v-if="diagramInstance"
                    @update:mode="updateMode"
                    @update:helpers="updateHelpers"
                    @update:legacyStars="(val) => legacyStars = val"
                    @update:theme="(val) => wrapperTheme = val"
                />
            </template>
        </v-navigation-drawer>

        <v-app-bar app>
            <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
            <v-row align="center">
                <v-col cols="4">
                    <v-select
                        label="Select a demo"
                        :items="demos"
                        item-title="title"
                        item-value="value"
                        v-model="selectedDemo"
                        @update:modelValue="loadDemo"
                        variant="outlined"
                        hide-details
                        density="compact"
                    ></v-select>
                </v-col>
            </v-row>
        </v-app-bar>

        <v-main class="d-flex flex-column">
            <!-- Vue Wrapper Demo -->
            <div v-if="isVueDemo" class="flex-grow-1" style="position:relative">
                <AureaEdenBpmnDiagram 
                    ref="diagramRef"
                    :bpmnXml="bpmnXml"
                    :values="barValues"
                    :mode="wrapperMode"
                    :helpers="wrapperHelpers"
                    :myActiveTasks="myActiveTasks"
                    :otherActiveTasks="otherActiveTasks"
                    :legacyStars="legacyStars"
                    :theme="wrapperTheme"
                />
            </div>
            
            <!-- Legacy JS Demos -->
            <div v-else id="diagram-container" class="flex-grow-1"></div>
        </v-main>
    </v-app>
  `,
};

createApp(App).use(vuetify).mount('#app');
