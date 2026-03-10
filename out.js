// --- Stage 1: Primary Path (Baseline) ---
const step1 = diagram.addStartEvent('_6-81')
    .addWrappedText('question \nreceived'); // Starting anchor
diagram.getElementById('_6-81').branchType = 'primary';
const step2 = diagram.addTask('_6-94')
    .addWrappedText('handle question')
    .positionRightOf('_6-81');
diagram.getElementById('_6-94').branchType = 'primary';
const step3 = diagram.addExclusiveGateway('_6-196')
    .addWrappedText('can handle myself?')
    .positionRightOf('_6-94');
diagram.getElementById('_6-196').branchType = 'primary';
const step4 = diagram.addTask('_6-333')
    .addWrappedText('Handle 1st level issue')
    .positionRightOf('_6-196');
diagram.getElementById('_6-333').branchType = 'primary';
const step5 = diagram.addExclusiveGateway('_6-263')
    .addWrappedText('Finished?')
    .positionRightOf('_6-333');
diagram.getElementById('_6-263').branchType = 'primary';
const step6 = diagram.addTask('_6-63')
    .addWrappedText('Handle 2nd level issue')
    .positionRightOf('_6-263');
diagram.getElementById('_6-63').branchType = 'primary';
const step7 = diagram.addExclusiveGateway('_6-289')
    .addWrappedText('Unsure?')
    .positionRightOf('_6-63');
diagram.getElementById('_6-289').branchType = 'primary';
const step8 = diagram.addTask('_6-190')
    .addWrappedText('Provide feedback')
    .positionRightOf('_6-289');
diagram.getElementById('_6-190').branchType = 'primary';
const step9 = diagram.addTask('_6-313')
    .addWrappedText('Explain solution')
    .positionRightOf('_6-190');
diagram.getElementById('_6-313').branchType = 'primary';
const step10 = diagram.addEndEvent('_6-423')
    .positionRightOf('_6-313');
diagram.getElementById('_6-423').branchType = 'primary';

// --- Stage 2: Unsorted Branches ---
const step11 = diagram.addAnchorPoint('_6-263_to__6-313_anchor')
    .positionDownOf('_6-63');
diagram.getElementById('_6-263_to__6-313_anchor').branchType = 'parallel';
const step12 = diagram.addAnchorPoint('_6-289_to__6-313_anchor')
    .positionDownOf('_6-190');
diagram.getElementById('_6-289_to__6-313_anchor').branchType = 'parallel';
const step13 = diagram.addAnchorPoint('_6-196_to__6-313_anchor')
    .positionDownOf('_6-333');
diagram.getElementById('_6-196_to__6-313_anchor').branchType = 'parallel';

// --- Connectors ---
diagram.connect('_6-263', '_6-63', 'E', 'auto', 'no');
diagram.connect('_6-289', '_6-190', 'E', 'auto', 'Yes');
diagram.connect('_6-190', '_6-313', 'auto', 'auto');
diagram.connect('_6-63', '_6-289', 'auto', 'auto');
diagram.connect('_6-313', '_6-423', 'auto', 'auto');
diagram.connect('_6-81', '_6-94', 'auto', 'auto');
diagram.connect('_6-94', '_6-196', 'auto', 'auto');
diagram.connect('_6-196', '_6-333', 'E', 'auto', 'No');
diagram.connect('_6-333', '_6-263', 'auto', 'auto');
diagram.connect('_6-263', '_6-263_to__6-313_anchor', 'S', 'auto', 'Yes');
diagram.connect('_6-263_to__6-313_anchor', '_6-313', 'auto', 'auto');
diagram.connect('_6-289', '_6-289_to__6-313_anchor', 'S', 'auto', 'No');
diagram.connect('_6-289_to__6-313_anchor', '_6-313', 'auto', 'auto');
diagram.connect('_6-196', '_6-196_to__6-313_anchor', 'S', 'auto', 'Yes');
diagram.connect('_6-196_to__6-313_anchor', '_6-313', 'auto', 'auto');