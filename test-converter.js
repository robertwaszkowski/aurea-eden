import fs from 'fs';
import { DOMParser } from 'xmldom';
global.DOMParser = DOMParser;
import { BpmnToFluentConverter } from './lib/notations/bpmn/BpmnToFluentConverter.js';
const xml = fs.readFileSync('./demo/VueWrapperBpmnDemo/incident-management-template.bpmn', 'utf8');
const converter = new BpmnToFluentConverter();
const generatedCode = converter.convert(xml, { stage: 'overlaps' });
fs.writeFileSync('out.js', generatedCode);
console.log('Wrote to out.js');
