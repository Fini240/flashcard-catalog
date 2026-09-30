import { useState, useEffect, useRef } from 'react';
import { pushBackHandler } from './backHandler';
import { Sheet } from './featureUI';
import { PrimaryButton, GhostButton, TextField } from './cardUI';
import { dayKey } from './gamification';
import { examPlan, validExamDate } from './studyPlan';

export function ExamDateSheet({ subject, cards, date, settings, onSave, onClose }) {
  const opener = useRef(document.activeElement);
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const returnFocus = opener.current;
    const removeBack = pushBackHandler(() => close.current());
    const onKey = event => { if (event.key === 'Escape') { event.preventDefault(); close.current(); } };
    window.addEventListener('keydown', onKey);
    return () => { removeBack(); window.removeEventListener('keydown', onKey); returnFocus?.focus(); };
  }, []);
  const [value, setValue] = useState(date || '');
  const [error, setError] = useState('');
  const plan = examPlan(cards, value, settings);
  const save = () => {
    if (value && (!validExamDate(value) || value < dayKey())) { setError('Choose today or a future exam date.'); return; }
    onSave(value);
    onClose();
  };
  return <div ref={dialog} role="dialog" aria-modal="true" aria-label={`${subject.name} exam`} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input, select, textarea, a[href]')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}><Sheet title={`${subject.name} exam`} onClose={onClose} footer={
    <div style={{ display: 'flex', gap: 8 }}>
      {date && <GhostButton onClick={() => { onSave(''); onClose(); }}>Remove date</GhostButton>}
      <PrimaryButton onClick={save} style={{ flex: 1 }}>Save exam date</PrimaryButton>
    </div>
  }>
    <label htmlFor="fc-exam-date" className="fc-plan-copy">Exam date</label>
    <TextField autoFocus id="fc-exam-date" type="date" min={dayKey()} value={value} onChange={event => { setValue(event.target.value); setError(''); }} aria-describedby="fc-exam-help" />
    <p id="fc-exam-help" className="fc-plan-copy">Your daily practice will prioritise this subject. The last two days are reserved for review when time allows.</p>
    {error && <p role="alert" className="fc-plan-copy">{error}</p>}
    {plan && <div className="fc-exam-preview">
      <strong>{plan.days < 0 ? 'Choose a new date' : plan.catchUp ? 'Plan some extra time' : plan.finalReview ? 'Final review' : 'Coverage plan fits your new-card limit'}</strong>
      <p>{plan.unseen} unseen · {plan.learning} still learning · {plan.familiar} familiar</p>
      {plan.days >= 0 && <p>{plan.unseen ? `Aim to introduce about ${plan.newPerDay} new cards per day, plus due reviews.` : 'Keep reviewing the cards you have already studied.'}</p>}
      {plan.catchUp && <p>Use additional sessions or adjust your new-card limit to cover the remaining material.</p>}
    </div>}
    <p className="fc-plan-copy">This estimates workload from your cards. It does not predict an exam grade or replace practice tests.</p>
  </Sheet></div>;
}
