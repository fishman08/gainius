import type { PersonalRecord } from '@fitness-tracker/shared';

interface RecentPRsListProps {
  records: PersonalRecord[];
}

export function RecentPRsList({ records }: RecentPRsListProps) {
  if (records.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>Personal Records</h3>
      {records.map((pr, i) => (
        <div
          key={`${pr.exerciseName}-${pr.date}-${i}`}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: i < records.length - 1 ? '1px solid #f0f0f0' : 'none',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{pr.exerciseName}</span>
            <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>{pr.date}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{pr.weight} lbs</span>
            {pr.previousBest !== null && (
              <span style={{ color: '#4CAF50', fontSize: 12, marginLeft: 8 }}>
                +{pr.weight - pr.previousBest} lbs
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
