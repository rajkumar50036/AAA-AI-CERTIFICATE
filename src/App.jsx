import React, { useState, useEffect } from 'react';
import { initialRecords } from './data/initialRecords';
import Certificate from './components/Certificate';
import AdminDashboard from './components/AdminDashboard';
import { 
  CheckCircle, AlertCircle, Award, ShieldCheck, Download, 
  Printer, Share2, ArrowLeft, Users, Settings, BookOpen, KeyRound
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function App() {
  // Database States
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('aadhya_records');
    return saved ? JSON.parse(saved) : initialRecords;
  });

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('aadhya_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // App routing/view control
  const [view, setView] = useState('home'); // 'home', 'verified', 'admin'
  const [verifiedRecord, setVerifiedRecord] = useState(null);

  // Form states
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', message: '' }
  const [copied, setCopied] = useState(false);

  // Synchronize database to local storage
  useEffect(() => {
    localStorage.setItem('aadhya_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('aadhya_logs', JSON.stringify(logs));
  }, [logs]);

  // QR Code / URL Direct Verification Check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const certId = params.get('certId');
    if (certId) {
      setIsLoading(true);
      setTimeout(() => {
        const match = records.find(r => r.id.toLowerCase() === certId.toLowerCase());
        if (match) {
          setVerifiedRecord(match);
          setView('verified');
          triggerConfetti();
          logEvent('QR Code Auto-Verify', match.studentName, match.id, 'Success');
          setAlert({ type: 'success', message: `Certificate #${match.id} successfully verified.` });
        } else {
          setAlert({ 
            type: 'error', 
            message: `Certificate record #${certId} not found in Aadhya Aspire Academy database.` 
          });
          // Scroll to form if loaded on home page
          const element = document.getElementById('verify-form-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
        setIsLoading(false);
      }, 1000);
    }
  }, [records]);

  // Log auditing events
  const logEvent = (event, studentName, certId, status) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      event,
      studentName,
      certId,
      status
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
  };

  // Confetti micro-animation on success
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0A1931', '#15305B', '#C5A85C', '#F4EAD4']
    });
  };

  // Submit manual lookup verification & generate on-the-fly if not found
  const handleVerify = (e) => {
    e.preventDefault();
    if (!inputName.trim() || !inputEmail.trim() || !inputPhone.trim()) {
      setAlert({ type: 'error', message: 'All fields are required.' });
      return;
    }

    setIsLoading(true);
    setAlert(null);

    // Normalize phone number (digits only)
    const cleanPhone = (p) => p.replace(/\D/g, '');

    setTimeout(() => {
      // Find matching record
      let match = records.find(r => 
        r.studentName.toLowerCase().trim() === inputName.toLowerCase().trim() &&
        r.email.toLowerCase().trim() === inputEmail.toLowerCase().trim() &&
        cleanPhone(r.phone) === cleanPhone(inputPhone)
      );

      if (match) {
        logEvent('Manual Search Verify', match.studentName, match.id, 'Success');
        setAlert({ type: 'success', message: 'Student certificate verified successfully!' });
      } else {
        // Automatically generate a new certificate record on the fly!
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const year = new Date().getFullYear();
        const generatedId = `AAA-AI-${year}-${randomNum}`;
        const todayText = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        match = {
          id: generatedId,
          studentName: inputName.trim(),
          email: inputEmail.trim(),
          phone: inputPhone.trim(),
          courseName: "Professional Generative AI & Future Skills Certification Program",
          completionDate: todayText,
          certificateNumber: generatedId,
          status: "Active",
          fileUrl: ""
        };

        // Add to records list so it is stored in registry
        setRecords(prev => [...prev, match]);
        logEvent('On-The-Fly Generate', match.studentName, match.id, 'Success');
        setAlert({ type: 'success', message: 'New certificate generated successfully!' });
      }

      setVerifiedRecord(match);
      setView('verified');
      triggerConfetti();
      setIsLoading(false);
    }, 1200);
  };



  // Generate High-DPI Landscape A4 PDF without screen-scale blurriness
  const handleDownloadPDF = async () => {
    const element = document.getElementById('certificate-print-area');
    if (!element) return;

    try {
      logEvent('Download PDF', verifiedRecord.studentName, verifiedRecord.id, 'Success');
      setIsLoading(true);

      // Create an exact clone of the certificate element
      const clone = element.cloneNode(true);
      
      // Style the clone to be visible to html2canvas but positioned completely offscreen
      // Reset any scale transform so it renders at full 1000x667px size
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.transform = 'none';
      clone.style.width = '1000px';
      clone.style.height = '667px';
      
      // Ensure the inner canvas element inside the clone also has transform reset
      const innerCanvas = clone.querySelector('.certificate-canvas-img');
      if (innerCanvas) {
        innerCanvas.style.transform = 'none';
        innerCanvas.style.margin = '0';
      }

      document.body.appendChild(clone);

      // Wait a tiny bit for the clone to be layout-rendered by the browser
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the unscaled offscreen clone at 4x scale for maximum DPI print quality
      const canvas = await html2canvas(clone, {
        scale: 4, // 4x scale makes it super high-res (4000x2668px)
        useCORS: true,
        logging: false,
        backgroundColor: null // Transparent background
      });

      // Remove the clone from DOM immediately
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Center the certificate on A4 landscape (297mm x 210mm) keeping the exact aspect ratio
      // Width = 297mm, Height = 297 * (667/1000) = 198.1mm
      // Y-offset offset: (210 - 198.1) / 2 = 5.95mm
      pdf.addImage(imgData, 'PNG', 0, 5.95, 297, 198.1);
      pdf.save(`aadhya_certificate_${verifiedRecord.id}.pdf`);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error compiling PDF:', err);
      setIsLoading(false);
    }
  };

  // Native Browser Landscape Print dialog
  const handlePrint = () => {
    logEvent('Print Certificate', verifiedRecord.studentName, verifiedRecord.id, 'Success');
    window.print();
  };

  // Copy shareable link
  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?certId=${verifiedRecord.id}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        logEvent('Share Link Copied', verifiedRecord.studentName, verifiedRecord.id, 'Success');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Clipboard copy failed:', err));
  };

  // Scroll to Form helper
  const scrollToForm = () => {
    setView('home');
    setTimeout(() => {
      const formSection = document.getElementById('verify-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="app-container">
      {/* Top Header Navbar */}
      <nav className="navbar">
        <div className="logo-container" onClick={() => setView('home')}>
          <div className="logo-icon">A</div>
          <div>
            <div className="logo-text">AADHYA</div>
            <div className="logo-subtitle">Aspire Academy</div>
          </div>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-btn ${view === 'home' || view === 'verified' ? 'active' : ''}`}
            onClick={() => setView('home')}
          >
            <BookOpen size={16} /> Verification Portal
          </button>
          <button 
            className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
            onClick={() => setView('admin')}
            title="Open Admin Controls"
          >
            <Settings size={16} /> Admin Panel
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Global Toast Alert */}
        {alert && (
          <div style={{ maxWidth: '600px', margin: '1.5rem auto 0', padding: '0 2rem' }}>
            <div className={`alert ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <div>
                <span>{alert.message}</span>
                <button 
                  onClick={() => setAlert(null)}
                  style={{ 
                    background: 'none', border: 'none', marginLeft: '10px', 
                    cursor: 'pointer', color: 'inherit', fontWeight: 'bold' 
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Routing */}
        {view === 'home' && (
          <div className="fade-in">
            {/* Hero Section */}
            <header className="hero">
              <h1 className="hero-title">Certificate Verification Portal</h1>
              <p className="hero-subtitle">
                Verify credentials and download official digital certificates issued by Aadhya Aspire Academy. Fast, secure, and fully verified.
              </p>
              <button className="hero-btn" onClick={scrollToForm}>
                Verify Certificate Now
              </button>
            </header>

            {/* University Quality Highlights */}
            <section className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <ShieldCheck size={26} />
                </div>
                <h3>Tamper Proof Verification</h3>
                <p>Verify credentials and completion status instantly with zero administrative lag.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Award size={26} />
                </div>
                <h3>Official Digital Badges</h3>
                <p>Generate certified AI professional credentials matching international academic guidelines.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Download size={26} />
                </div>
                <h3>Print-Ready PDF</h3>
                <p>Export high-resolution landscape certificate documents compatible with vector prints.</p>
              </div>
            </section>

            {/* Student Search Verification Form */}
            <section id="verify-form-section" className="verification-section">
              <div className="verification-card">
                <div className="card-header-gradient">
                  <h2>Student Registry Search</h2>
                  <p>Enter details exactly as registered with Aadhya Aspire Academy</p>
                </div>
                
                <form onSubmit={handleVerify} className="form-body">
                  <div className="form-group">
                    <label htmlFor="student-name">Full Name</label>
                    <div className="input-wrapper">
                      <Users className="input-icon" size={18} />
                      <input 
                        type="text" 
                        id="student-name"
                        className="form-control"
                        placeholder="e.g. Raj Kumar"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="student-email">Email Address</label>
                    <div className="input-wrapper">
                      <ShieldCheck className="input-icon" size={18} />
                      <input 
                        type="email" 
                        id="student-email"
                        className="form-control"
                        placeholder="e.g. raj@example.com"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="student-phone">Registered Phone Number</label>
                    <div className="input-wrapper">
                      <ShieldCheck className="input-icon" size={18} />
                      <input 
                        type="tel" 
                        id="student-phone"
                        className="form-control"
                        placeholder="e.g. 9876543210"
                        value={inputPhone}
                        onChange={(e) => setInputPhone(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="verify-submit-btn" 
                    disabled={isLoading}
                    style={{ position: 'relative' }}
                  >
                    {isLoading ? (
                      <>
                        <span style={{ 
                          width: '16px', height: '16px', border: '2px solid white', 
                          borderTop: '2px solid transparent', borderRadius: '50%',
                          display: 'inline-block', animation: 'spin 1s linear infinite',
                          marginRight: '8px'
                        }}></span>
                        Searching Registry...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Verify Certificate
                      </>
                    )}
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}

        {view === 'verified' && verifiedRecord && (
          <div className="certificate-view-container fade-in">
            {/* Navigation Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="action-btn" onClick={() => setView('home')}>
                <ArrowLeft size={16} /> Return to Lookup Form
              </button>
              <span style={{ 
                color: 'green', display: 'inline-flex', alignItems: 'center', 
                gap: '6px', fontWeight: 600, fontSize: '0.9rem' 
              }}>
                ● Officially Verified
              </span>
            </div>

            {/* Action Buttons for downloading, sharing & printing */}
            <div className="certificate-actions">
              <button className="action-btn action-btn-primary" onClick={handleDownloadPDF}>
                <Download size={16} /> Download PDF
              </button>
              <button className="action-btn" onClick={handlePrint}>
                <Printer size={16} /> Print Certificate
              </button>
              <button className="action-btn" onClick={handleShare}>
                <Share2 size={16} /> {copied ? 'Copied Link!' : 'Share Certificate'}
              </button>
            </div>

            {/* Certificate Canvas Render Wrapper */}
            <div className="certificate-preview-wrapper">
              <Certificate 
                studentName={verifiedRecord.studentName}
                courseName={verifiedRecord.courseName}
                completionDate={verifiedRecord.completionDate}
                certificateNumber={verifiedRecord.id}
              />
            </div>
          </div>
        )}

        {view === 'admin' && (
          <AdminDashboard 
            records={records}
            logs={logs}
          />
        )}
      </main>

      {/* Footer Branding Section */}
      <footer className="footer-main">
        <div className="footer-logo">AADHYA ASPIRE ACADEMY</div>
        <div className="footer-tagline">Empowering Future Innovators Through Artificial Intelligence</div>
        
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} Aadhya Aspire Academy. All rights reserved. Registered certification credentials are securely protected.
        </div>
      </footer>

      {/* Embedded CSS loader for inline dynamic animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
