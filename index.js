
import { createApp, nextTick, shallowRef } from 'vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify({
  components,
  directives,
});

const DiagramControls = {
  props: {
    diagram: Object,
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
        if (oldDiagram) {
          oldDiagram.controls.removeEventListener('change', this.readCameraPosition);
        }
        if (newDiagram) {
          newDiagram.controls.addEventListener('change', this.readCameraPosition);
          this.readCameraPosition(); // Initial read
          this.helpersEnabled = newDiagram.helpers;
        }
      },
      immediate: true,
    },
    mode(newMode) {
      if (this.diagram) {
        this.diagram.setMode(newMode);
      }
    },
    helpersEnabled() {
        this.toggleHelpers();
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
    toggleHelpers() {
      if (this.diagram) {
        if (this.diagram.helpers) {
          this.diagram.hideHelpers();
        } else {
          this.diagram.showHelpers();
        }
        this.helpersEnabled = this.diagram.helpers;
      }
    },
    resetDiagram() {
      if (this.diagram) {
        this.mode = 'VIEW';
        this.diagram.reset();
      }
    },
    importDiagram() {
      if (this.diagram) {
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
      if (this.diagram) {
        this.diagram.export();
      }
    },
    clearDiagram() {
      if (this.diagram) {
        this.diagram.clear();
      }
    },
  },
  template: `
    <v-card class="pa-4">
      <v-card-title>Diagram Controls</v-card-title>
      <v-card-text>
        <v-list>
            <v-list-subheader>Mode</v-list-subheader>
            <v-radio-group v-model="mode" inline>
                <v-radio label="VIEW" value="VIEW"></v-radio>
                <v-radio label="ANALYZE" value="ANALYZE"></v-radio>
            </v-radio-group>

            <v-divider></v-divider>

            <v-list-item>
                <v-switch v-model="helpersEnabled" label="Toggle Helpers"></v-switch>
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
  },
  data() {
    return {
      selectedDemo: 'CustomNotationDemo',
      demos: [{ title: 'Order Processing Demo', value: 'OrderProcessingDemo' }, { title: 'Simple BPMN', value: 'SimpleBPMN' }, { title: 'Shapes Demo', value: 'ShapesDemo' }, { title: 'Custom Notation Demo', value: 'CustomNotationDemo' }],
      diagramInstance: shallowRef(null), // Use shallowRef for non-reactive diagram object
      drawer: true, // For v-navigation-drawer
    };
  },
  computed: {
    selectedDemoTitle() {
      const demo = this.demos.find(d => d.value === this.selectedDemo);
      return demo ? demo.title : '';
    }
  },
  methods: {
    async loadDemo() {
      await nextTick(async () => {
        // Clear previous diagram if any
        if (this.diagramInstance) {
          this.diagramInstance.clear();
          // Dispose of the diagram to free up resources
          // if your diagram class has a dispose method
          if (typeof this.diagramInstance.dispose === 'function') {
            this.diagramInstance.dispose();
          }
          this.diagramInstance = null;
        }

        const container = document.getElementById('diagram-container');
        if (!container) {
          console.error('Diagram container not found!');
          return;
        }
        // Clear the container before loading a new diagram
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        try {
          // Dynamically import the demo module
          const demoModule = await import(`./demo/${this.selectedDemo}/index.js`);
          // Call the default export function to create the diagram
          this.diagramInstance = demoModule.default(container);
        } catch (error) {
          console.error(`Error loading demo ${this.selectedDemo}:`, error);
        }
      });
    },
  },
  mounted() {
    this.loadDemo();
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
                <DiagramControls :diagram="diagramInstance" v-if="diagramInstance"/>
            </template>
        </v-navigation-drawer>

        <v-app-bar app>
            <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
            <v-row>
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
            <div id="diagram-container" class="flex-grow-1"></div>
        </v-main>
    </v-app>
  `,
};

createApp(App).use(vuetify).mount('#app');
