export function EmptyPlanView() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 120,
      }}
    >
      <h1 style={{ color: '#4A90E2', fontSize: 24, margin: 0 }}>No workout plan yet</h1>
      <p style={{ color: '#666', marginTop: 12, fontSize: 15 }}>
        Chat with your AI coach to create a personalized workout plan.
      </p>
    </div>
  );
}
