// --- Stage 1: Primary Path (Baseline) ---
const step1 = diagram.addStartEvent('Event_18ee5ju')
    .addWrappedText('Start procesu z EZD'); // Starting anchor
diagram.getElementById('Event_18ee5ju').branchType = 'primary';
const step2 = diagram.addTask('Activity_0otz49q')
    .addWrappedText('Dekretuj wniosek')
    .positionRightOf('Event_18ee5ju');
diagram.getElementById('Activity_0otz49q').branchType = 'primary';
const step3 = diagram.addExclusiveGateway('Gateway_16ae9r3')
    .addWrappedText('Czy anulowany?')
    .positionRightOf('Activity_0otz49q');
diagram.getElementById('Gateway_16ae9r3').branchType = 'primary';
const step4 = diagram.addTask('Activity_0emz3c3')
    .addWrappedText('Zarejestruj i zweryfikuj wniosek')
    .positionRightOf('Gateway_16ae9r3');
diagram.getElementById('Activity_0emz3c3').branchType = 'primary';
const step5 = diagram.addExclusiveGateway('Gateway_1nmmk20')
    .addWrappedText('Bramka')
    .positionRightOf('Activity_0emz3c3');
diagram.getElementById('Gateway_1nmmk20').branchType = 'primary';
const step6 = diagram.addExclusiveGateway('Gateway_18733in')
    .addWrappedText('Czy wezwanie do uzupełnienia?')
    .positionRightOf('Gateway_1nmmk20');
diagram.getElementById('Gateway_18733in').branchType = 'primary';
const step7 = diagram.addTask('Activity_0m9o5lr')
    .addWrappedText('Czekaj na korektę')
    .positionRightOf('Gateway_18733in');
diagram.getElementById('Activity_0m9o5lr').branchType = 'primary';
const step8 = diagram.addExclusiveGateway('Gateway_1eafwle')
    .addWrappedText('Czy korekta wpłynęła?')
    .positionRightOf('Activity_0m9o5lr');
diagram.getElementById('Gateway_1eafwle').branchType = 'primary';
const step9 = diagram.addTask('Activity_0mcyc3a')
    .addWrappedText('Zweryfikuj merytorycznie')
    .positionRightOf('Gateway_1eafwle');
diagram.getElementById('Activity_0mcyc3a').branchType = 'primary';
const step10 = diagram.addExclusiveGateway('Gateway_04z0nw7')
    .addWrappedText('Czy wniosek poprawny?')
    .positionRightOf('Activity_0mcyc3a');
diagram.getElementById('Gateway_04z0nw7').branchType = 'primary';
const step11 = diagram.addTask('Activity_0czbr6c')
    .addWrappedText('Akceptuj wniosek')
    .positionRightOf('Gateway_04z0nw7');
diagram.getElementById('Activity_0czbr6c').branchType = 'primary';
const step12 = diagram.addExclusiveGateway('Gateway_0v8ldzr')
    .addWrappedText('Czy wniosek zaakceptowany?')
    .positionRightOf('Activity_0czbr6c');
diagram.getElementById('Gateway_0v8ldzr').branchType = 'primary';
const step13 = diagram.addTask('Activity_0ewg4b2')
    .addWrappedText('Przygotuj pismo oraz wydaj decyzję')
    .positionRightOf('Gateway_0v8ldzr');
diagram.getElementById('Activity_0ewg4b2').branchType = 'primary';
const step14 = diagram.addExclusiveGateway('Gateway_1bp34yo')
    .addWrappedText('Czy zaliczka?')
    .positionRightOf('Activity_0ewg4b2');
diagram.getElementById('Gateway_1bp34yo').branchType = 'primary';
const step15 = diagram.addTask('Activity_107zong')
    .addWrappedText('Przygotuj polecenie wypłaty zaliczki')
    .positionRightOf('Gateway_1bp34yo');
diagram.getElementById('Activity_107zong').branchType = 'primary';
const step16 = diagram.addEndEvent('Event_0rzlqh1')
    .addWrappedText('Wniosek zakończony po zaliczce')
    .positionRightOf('Activity_107zong');
diagram.getElementById('Event_0rzlqh1').branchType = 'primary';

// --- Stage 2: Unsorted Branches ---
const step17 = diagram.addEndEvent('Event_0ojtc8r')
    .addWrappedText('Wniosek zakończony')
    .positionUpOf('Gateway_1bp34yo');
diagram.getElementById('Event_0ojtc8r').branchType = 'parallel';
const step18 = diagram.addEndEvent('Event_1to3vzi')
    .addWrappedText('Wniosek anulowany przez kierownika')
    .positionUpOf('Gateway_0v8ldzr');
diagram.getElementById('Event_1to3vzi').branchType = 'parallel';
const step19 = diagram.addEndEvent('Event_1safowe')
    .addWrappedText('Rejestracja anulowana')
    .positionUpOf('Gateway_16ae9r3');
diagram.getElementById('Event_1safowe').branchType = 'parallel';
const step20 = diagram.addTask('Activity_1lmjwqo')
    .addWrappedText('Popraw dane')
    .positionUpOf('Gateway_04z0nw7');
diagram.getElementById('Activity_1lmjwqo').branchType = 'iterative';
const step21 = diagram.addEndEvent('Event_1je728x')
    .addWrappedText('Korekta wpłynęła')
    .positionUpOf('Gateway_1eafwle');
diagram.getElementById('Event_1je728x').branchType = 'parallel';
const step22 = diagram.addAnchorPoint('Gateway_18733in_to_Activity_0mcyc3a_anchor')
    .positionDownOf('Activity_0m9o5lr');
diagram.getElementById('Gateway_18733in_to_Activity_0mcyc3a_anchor').branchType = 'parallel';

// --- Connectors ---
diagram.connect('Event_18ee5ju', 'Activity_0otz49q', 'auto', 'auto');
diagram.connect('Activity_0otz49q', 'Gateway_16ae9r3', 'auto', 'auto');
diagram.connect('Activity_0emz3c3', 'Gateway_1nmmk20', 'auto', 'auto');
diagram.connect('Activity_0mcyc3a', 'Gateway_04z0nw7', 'auto', 'auto');
diagram.connect('Gateway_04z0nw7', 'Activity_0czbr6c', 'E', 'auto', 'Tak');
diagram.connect('Gateway_04z0nw7', 'Activity_1lmjwqo', 'N', 'auto', 'Nie');
diagram.connect('Activity_0czbr6c', 'Gateway_0v8ldzr', 'auto', 'auto');
diagram.connect('Gateway_0v8ldzr', 'Activity_0ewg4b2', 'E', 'auto', 'Tak');
diagram.connect('Activity_0ewg4b2', 'Gateway_1bp34yo', 'auto', 'auto');
diagram.connect('Gateway_0v8ldzr', 'Activity_1lmjwqo', 'N', 'auto', 'Nie');
diagram.connect('Gateway_0v8ldzr', 'Event_1to3vzi', 'N', 'auto', 'Wniosek anulowany');
diagram.connect('Gateway_16ae9r3', 'Activity_0emz3c3', 'E', 'auto', 'Nie');
diagram.connect('Gateway_16ae9r3', 'Event_1safowe', 'N', 'auto', 'Tak');
diagram.connect('Activity_1lmjwqo', 'Gateway_1nmmk20', 'auto', 'auto');
diagram.connect('Gateway_1nmmk20', 'Gateway_18733in', 'auto', 'auto');
diagram.connect('Gateway_18733in', 'Activity_0m9o5lr', 'E', 'auto', 'Tak');
diagram.connect('Activity_0m9o5lr', 'Gateway_1eafwle', 'auto', 'auto');
diagram.connect('Gateway_1eafwle', 'Activity_0mcyc3a', 'E', 'auto', 'Nie');
diagram.connect('Gateway_1eafwle', 'Event_1je728x', 'N', 'auto', 'Tak');
diagram.connect('Gateway_1bp34yo', 'Event_0ojtc8r', 'N', 'auto', 'Nie');
diagram.connect('Gateway_1bp34yo', 'Activity_107zong', 'E', 'auto', 'Tak');
diagram.connect('Activity_107zong', 'Event_0rzlqh1', 'auto', 'auto');
diagram.connect('Gateway_18733in', 'Gateway_18733in_to_Activity_0mcyc3a_anchor', 'S', 'auto', 'Nie');
diagram.connect('Gateway_18733in_to_Activity_0mcyc3a_anchor', 'Activity_0mcyc3a', 'auto', 'auto');