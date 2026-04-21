const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib/notations/bpmn/BpmnDiagram.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Fix layoutMap creation to only use the FIRST BPMNDiagram (the main canvas)
code = code.replace(
    `const bpmnShapes = xmlDoc.getElementsByTagNameNS(bpmndiNamespace, 'BPMNShape');`,
    `const bpmnDiagrams = xmlDoc.getElementsByTagNameNS(bpmndiNamespace, 'BPMNDiagram');\n        const mainDiagram = bpmnDiagrams.length > 0 ? bpmnDiagrams[0] : xmlDoc;\n        const bpmnShapes = mainDiagram.getElementsByTagNameNS(bpmndiNamespace, 'BPMNShape');`
);

// 2. Fix the positioning loop to also only use the FIRST BPMNDiagram
code = code.replace(
    `const bpmnShapesToPosition = xmlDoc.getElementsByTagNameNS(bpmndiNamespace, 'BPMNShape');`,
    `const bpmnShapesToPosition = mainDiagram.getElementsByTagNameNS(bpmndiNamespace, 'BPMNShape');`
);

// 3. Fix the edge loop to also only use the FIRST BPMNDiagram
code = code.replace(
    `const bpmnEdges = xmlDoc.getElementsByTagNameNS(bpmndiNamespace, 'BPMNEdge');`,
    `const bpmnEdges = mainDiagram.getElementsByTagNameNS(bpmndiNamespace, 'BPMNEdge');`
);

// 4. For every getDims destructuring, inject a check to skip if it's not in the main layoutMap
const getDimsRegex = /const { width, height } = getDims\(([\w]+)\);/g;
code = code.replace(getDimsRegex, (match, idVar) => {
    return `if (!layoutMap[${idVar}]) continue;\n            ${match}`;
});

fs.writeFileSync(filePath, code);
console.log('Successfully patched BpmnDiagram.js using regex replacements.');
