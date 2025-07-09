import React from 'react';
import useModCases from '../hooks/usebackend';

export default function ModCasesList({ guildId }) {
  const { cases, loading } = useModCases(guildId);

  if (loading) return <p>Loading cases...</p>;
  if (!cases.length) return <p>No mod cases found.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Case ID</th>
          <th>User</th>
          <th>Action</th>
          <th>Reason</th>
          <th>Moderator</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {cases.map(({ case_id, user_tag, action, reason, moderator_tag, timestamp }) => (
          <tr key={case_id}>
            <td>#{case_id}</td>
            <td>{user_tag}</td>
            <td>{action}</td>
            <td>{reason}</td>
            <td>{moderator_tag}</td>
            <td>{new Date(timestamp).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
