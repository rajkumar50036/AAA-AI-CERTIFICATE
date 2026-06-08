import React, { useState } from 'react';
import { 
  Search, FileSpreadsheet, History, Award 
} from 'lucide-react';

export default function AdminDashboard({ 
  records, 
  logs 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('records'); // 'records' or 'logs'

  const filteredRecords = records.filter(record => 
    record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.phone.includes(searchQuery) ||
    record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    // Columns headers
    const headers = ['Certificate ID', 'Student Name', 'Email', 'Phone', 'Course Name', 'Completion Date', 'Status'];
    const csvRows = [headers.join(',')];

    records.forEach(r => {
      const row = [
        `"${r.id.replace(/"/g, '""')}"`,
        `"${r.studentName.replace(/"/g, '""')}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${r.phone.replace(/"/g, '""')}"`,
        `"${r.courseName.replace(/"/g, '""')}"`,
        `"${r.completionDate.replace(/"/g, '""')}"`,
        `"${r.status.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aadhya_certificates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-section fade-in">
      <div className="admin-card">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h2>Academy Registry & Audit Board</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px' }}>
              View verified certificates registry, trace audit logs, and export reporting spreadsheets.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`nav-btn ${activeTab === 'records' ? 'active' : ''}`}
              onClick={() => setActiveTab('records')}
            >
              <Award size={16} /> Verified Registry
            </button>
            <button 
              className={`nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <History size={16} /> Operation Logs
            </button>
          </div>
        </div>

        {/* Inner Content */}
        <div className="form-body" style={{ padding: '2rem' }}>
          
          {activeTab === 'records' ? (
            <>
              {/* Controls */}
              <div className="admin-controls">
                <div className="search-input-wrapper">
                  <Search size={18} className="input-icon" style={{ left: '10px' }} />
                  <input 
                    type="text" 
                    placeholder="Search by student name, email, phone, or certificate ID..."
                    className="search-control"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button className="action-btn" onClick={exportToCSV}>
                  <FileSpreadsheet size={16} /> Export CSV (Excel)
                </button>
              </div>

              {/* Records Table */}
              <div className="admin-table-container">
                {filteredRecords.length > 0 ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Course & Date</th>
                        <th>Contact Details</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id}>
                          <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{record.id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{record.studentName}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{record.courseName}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                              Completed: {record.completionDate}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{record.email}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{record.phone}</div>
                          </td>
                          <td>
                            <span className="badge-status badge-status-active">
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    No matching student records found.
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Logs Tab */
            <div className="admin-table-container">
              {logs && logs.length > 0 ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Operation Event</th>
                      <th>Record Detail</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice().reverse().map((log, index) => (
                      <tr key={index}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ 
                            color: log.event.includes('Download') ? 'var(--accent-gold-dark)' : 'var(--secondary-royal)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {log.event}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{log.studentName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {log.certId}</div>
                        </td>
                        <td>
                          <span style={{ 
                            background: log.status === 'Success' ? '#DCFCE7' : '#FEF2F2',
                            color: log.status === 'Success' ? '#15803D' : '#B91C1C',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No system activity logged yet. Verifications and downloads will appear here.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
