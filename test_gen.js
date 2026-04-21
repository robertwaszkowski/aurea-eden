import fs from 'fs';
import { DOMParser } from 'xmldom';
global.DOMParser = DOMParser;
import { BpmnToFluentConverter } from './lib/notations/bpmn/BpmnToFluentConverter.js';
const xml = fs.readFileSync('./demo/VueWrapperBpmnDemo/leave-request-approval.bpmn', 'utf8');
const converter = new BpmnToFluentConverter();
console.log(converter.convert(xml, { stage: 'lanes' }));
