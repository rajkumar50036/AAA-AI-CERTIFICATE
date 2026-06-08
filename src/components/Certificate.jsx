import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function Certificate({ 
  studentName, 
  courseName, 
  completionDate, 
  certificateNumber 
}) {
  // Generate the verification URL
  const verificationUrl = `${window.location.origin}${window.location.pathname}?certId=${certificateNumber}`;

  return (
    <div id="certificate-print-area" className="scale-in">
      <div className="certificate-canvas-img">
        {/* Student Name Overlay */}
        <div className="cert-overlay-student-name">
          {studentName}
        </div>

        {/* Completion Date Overlay (Elegant placement in the blank space) */}
        <div className="cert-overlay-date">
          Date of Issuance: {completionDate}
        </div>

        {/* Certificate ID Cover & Replace (Covers the AAA-AI-2024-000123 text on the template) */}
        <div className="cert-overlay-id-cover">
          <div className="cert-overlay-id-text">
            {certificateNumber}
          </div>
        </div>

        {/* Dynamic QR Code overlay (Placed elegantly on the right side under the gold medal) */}
        <div className="cert-overlay-qrcode-container">
          <QRCodeSVG 
            value={verificationUrl} 
            size={55} 
            level={"H"} 
            bgColor={"#FFFFFF"} 
            fgColor={"#0A1931"}
          />
          <div className="cert-qrcode-text">
            <span>VERIFIED</span>
            <span style={{ color: '#C5A85C', fontSize: '0.42rem', fontWeight: 700 }}>Scan to Verify</span>
          </div>
        </div>
      </div>
    </div>
  );
}
