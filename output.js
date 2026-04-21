// --- Stage 1: Primary Path (Baseline) ---
const step1 = diagram.addStartEvent('Start_Leave')
    .addWrappedText('Leave\nRequest\nSubmitted'); // Starting anchor
diagram.getElementById('Start_Leave').branchType = 'primary';
const step2 = diagram.addUserTask('Task_Review')
    .addWrappedText('Review Leave\nRequest')
    .positionRightOf('Start_Leave');
diagram.getElementById('Task_Review').branchType = 'primary';
const step3 = diagram.addExclusiveGateway('Gateway_Decision')
    .addWrappedText('Request\nApproved?')
    .positionRightOf('Task_Review');
diagram.getElementById('Gateway_Decision').branchType = 'primary';
const step4 = diagram.addServiceTask('Task_UpdateHR')
    .addWrappedText('Update HR\nSystem')
    .positionRightOf('Gateway_Decision');
diagram.getElementById('Task_UpdateHR').branchType = 'primary';
const step5 = diagram.addSendTask('Task_NotifyEmployee')
    .addWrappedText('Notify Employee')
    .positionRightOf('Task_UpdateHR');
diagram.getElementById('Task_NotifyEmployee').branchType = 'primary';
const step6 = diagram.addEndEvent('End_Approved')
    .addWrappedText('Request\nApproved')
    .positionRightOf('Task_NotifyEmployee');
diagram.getElementById('End_Approved').branchType = 'primary';

// --- Stage 3: Sorting and Lanes ---
const step8 = diagram.addAnchorPoint('Gateway_Decision_to_Task_NotifyEmployee_anchor')
    .positionDownOf('Task_UpdateHR');
diagram.getElementById('Gateway_Decision_to_Task_NotifyEmployee_anchor').branchType = 'parallel';
const step7 = diagram.addEndEvent('End_Rejected')
    .addWrappedText('Request\nRejected')
    .positionUpOf('Task_NotifyEmployee');
diagram.getElementById('End_Rejected').branchType = 'parallel';

// --- Connectors ---
diagram.connect('Start_Leave', 'Task_Review', 'auto', 'auto');
diagram.connect('Task_Review', 'Gateway_Decision', 'auto', 'auto');
diagram.connect('Gateway_Decision', 'Task_UpdateHR', 'E', 'auto');
diagram.connect('Task_UpdateHR', 'Task_NotifyEmployee', 'auto', 'auto');
diagram.connect('Task_NotifyEmployee', 'End_Approved', 'E', 'auto');
diagram.connect('Task_NotifyEmployee', 'End_Rejected', 'auto', 'auto');
diagram.connect('Gateway_Decision', 'Gateway_Decision_to_Task_NotifyEmployee_anchor', 'auto', 'auto');
diagram.connect('Gateway_Decision_to_Task_NotifyEmployee_anchor', 'Task_NotifyEmployee', 'auto', 'auto');
