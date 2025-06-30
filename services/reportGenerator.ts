import { Claim, VerificationStatus, Source } from '../types';

const getStatusInfo = (status: VerificationStatus) => {
  switch (status) {
    case VerificationStatus.VERIFIED:
      return {
        title: 'Verified',
        color: '#10B981', // green-500
        bgColor: '#D1FAE5', // green-100
      };
    case VerificationStatus.UNVERIFIED:
      return {
        title: 'Unverified',
        color: '#EF4444', // red-500
        bgColor: '#FEE2E2', // red-100
      };
    case VerificationStatus.MISLEADING:
       return {
        title: 'Misleading',
        color: '#F59E0B', // amber-500
        bgColor: '#FEF3C7', // amber-100
      };
    default:
      return {
        title: 'Error',
        color: '#6B7280', // gray-500
        bgColor: '#F3F4F6', // gray-100
      };
  }
};

const generateDonutChart = (summary: { verified: number; unverified: number; misleading: number; total: number }) => {
  if (summary.total === 0) return '<div class="chart-placeholder">No claims to display in chart.</div>';

  const data = [
    { value: summary.verified, color: '#10B981', label: 'Verified' },
    { value: summary.misleading, color: '#F59E0B', label: 'Misleading' },
    { value: summary.unverified, color: '#EF4444', label: 'Unverified' },
  ].filter(d => d.value > 0);

  if (data.length === 0) return '<div class="chart-placeholder">No claims to display in chart.</div>';
  
  const cx = 50;
  const cy = 50;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const segments = data.map(item => {
    const percent = (item.value / summary.total) * 100;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    
    accumulatedPercent += percent;
    
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="transparent" stroke="${item.color}" stroke-width="15" stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"></circle>`;
  }).join('');

  const legend = data.map(item => {
    const percentage = Math.round((item.value / summary.total) * 100);
    return `
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${item.color};"></span>
        <div class="legend-text">
          <span class="legend-label">${item.label}</span>
          <span class="legend-value">${item.value} (${percentage}%)</span>
        </div>
      </div>
    `;
  }).join('');

  const backgroundCircle = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="transparent" stroke="#F3F4F6" stroke-width="15"></circle>`;

  return `
    <div class="chart-container">
      <div class="chart-wrapper">
        <svg viewBox="0 0 100 100" class="donut-chart">
          ${backgroundCircle}
          ${segments}
        </svg>
        <div class="chart-center">
          <div class="chart-total">${summary.total}</div>
          <div class="chart-label">Total</div>
        </div>
      </div>
      <div class="legend">${legend}</div>
    </div>
  `;
};

const getUniqueSources = (claims: Claim[]): Source[] => {
    const sourceMap = new Map<string, Source>();
    claims.forEach(claim => {
        claim.verification?.sources.forEach(source => {
            if (!sourceMap.has(source.web.uri)) {
                sourceMap.set(source.web.uri, source);
            }
        });
    });
    return Array.from(sourceMap.values());
};

export const generateReportHtml = (claims: Claim[], originalText: string): string => {
    const summary = {
        total: claims.length,
        verified: claims.filter(c => c.status === VerificationStatus.VERIFIED).length,
        unverified: claims.filter(c => c.status === VerificationStatus.UNVERIFIED).length,
        misleading: claims.filter(c => c.status === VerificationStatus.MISLEADING).length,
    };
    
    const uniqueSources = getUniqueSources(claims);

    const claimCardsHtml = claims.map(claim => {
        const { title, color, bgColor } = getStatusInfo(claim.status);
        const sourcesHtml = claim.verification?.sources.map((source) =>
            `<li><a href="${source.web.uri}" target="_blank">${source.web.title || source.web.uri}</a></li>`
        ).join('') || '<li>No sources cited.</li>';

        return `
            <div class="claim-card">
                <div class="claim-header" style="background-color: ${bgColor}; border-left: 5px solid ${color};">
                    <h3 style="color: ${color};">${title}</h3>
                </div>
                <div class="claim-body">
                    <p class="claim-text">"${claim.claimText}"</p>
                    ${claim.verification ? `
                        <div class="verification-details">
                            <h4>Explanation</h4>
                            <p>${claim.verification.explanation}</p>
                            <h4>Confidence</h4>
                            <div class="confidence-bar-container">
                                <div class="confidence-bar" style="width: ${claim.verification.confidence}%; background-color: ${color};"></div>
                                <span class="confidence-value">${claim.verification.confidence}%</span>
                            </div>
                            <h4>Sources for this Claim</h4>
                            <ul class="source-list">${sourcesHtml}</ul>
                        </div>
                    ` : '<p>Verification pending or failed.</p>'}
                </div>
            </div>
        `;
    }).join('');
    
    const allSourcesHtml = uniqueSources.length > 0
        ? uniqueSources.map((source) =>
            `<li><a href="${source.web.uri}" target="_blank">${source.web.title || source.web.uri}</a></li>`
        ).join('')
        : '<li>No sources were cited across all claims.</li>';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Fact-Check Analysis Report</title>
      <style>
        @import url('https://rsms.me/inter/inter.css');
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 2rem; background-color: #f9fafb; color: #1f2937; }
        .report-container { max-width: 800px; margin: auto; background-color: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .report-header { text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; }
        .report-header h1 { font-size: 2.25rem; color: #111827; margin: 0; }
        .report-header p { color: #6b7280; margin-top: 0.5rem; }
        .section-title { font-size: 1.5rem; color: #111827; margin-top: 2.5rem; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; text-align: center; }
        .summary-item { background-color: #f3f4f6; padding: 1rem; border-radius: 8px; }
        .summary-item .value { font-size: 2rem; font-weight: bold; }
        .summary-item .label { font-size: 0.875rem; color: #4b5563; }
        .value.verified { color: #10B981; } .value.unverified { color: #EF4444; } .value.misleading { color: #F59E0B; } .value.total { color: #3B82F6; }
        .chart-container { display: flex; align-items: center; justify-content: center; gap: 3rem; margin: 2rem 0; background-color: #f8fafc; padding: 2rem; border-radius: 12px; border: 1px solid #e2e8f0; }
        .chart-wrapper { position: relative; }
        .donut-chart { width: 180px; height: 180px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
        .chart-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .chart-total { font-size: 2.5rem; font-weight: bold; color: #1f2937; line-height: 1; }
        .chart-label { font-size: 0.875rem; color: #6b7280; font-weight: 500; }
        .legend { display: flex; flex-direction: column; gap: 1rem; min-width: 200px; }
        .legend-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 6px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .legend-color { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; }
        .legend-text { display: flex; flex-direction: column; }
        .legend-label { font-weight: 600; color: #374151; font-size: 0.875rem; }
        .legend-value { font-size: 0.75rem; color: #6b7280; }
        .original-text-block { background-color: #f3f4f6; border-left: 4px solid #d1d5db; padding: 1rem; margin-top: 1rem; font-style: italic; color: #4b5563; }
        .claim-card { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 1.5rem; overflow: hidden; }
        .claim-header { padding: 0.75rem 1.25rem; }
        .claim-header h3 { margin: 0; font-size: 1.25rem; font-weight: bold; }
        .claim-body { padding: 1.25rem; }
        .claim-text { font-style: italic; color: #374151; border-left: 3px solid #d1d5db; padding-left: 1rem; margin: 0 0 1rem 0; }
        .verification-details h4 { font-weight: 600; margin-top: 1rem; margin-bottom: 0.25rem; color: #111827; }
        .verification-details p { margin: 0; color: #4b5563; }
        .confidence-bar-container { position: relative; width: 100%; background-color: #e5e7eb; border-radius: 99px; height: 24px; margin-top: 0.5rem; }
        .confidence-bar { height: 100%; border-radius: 99px; }
        .confidence-value { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); color: white; font-size: 0.8rem; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
        .source-list { list-style-type: disc; padding-left: 1.5rem; font-size: 0.875rem; }
        .source-list li a { color: #3B82F6; text-decoration: none; }
        .source-list li a:hover { text-decoration: underline; }
        .print-button { display: block; width: 100%; padding: 1rem; background-color: #3B82F6; color: white; border: none; font-size: 1.25rem; border-radius: 8px; margin-top: 2rem; cursor: pointer; }
        @media print {
            body { padding: 0; background-color: white; }
            .report-container { box-shadow: none; padding: 0; }
            .print-button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <header class="report-header">
          <h1>Fact-Check Analysis Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </header>
        
        <section>
            <h2 class="section-title">Analysis Summary</h2>
            <div class="summary-grid">
                <div class="summary-item"><div class="value total">${summary.total}</div><div class="label">Total Claims</div></div>
                <div class="summary-item"><div class="value verified">${summary.verified}</div><div class="label">Verified</div></div>
                <div class="summary-item"><div class="value unverified">${summary.unverified}</div><div class="label">Unverified</div></div>
                <div class="summary-item"><div class="value misleading">${summary.misleading}</div><div class="label">Misleading</div></div>
            </div>
            ${generateDonutChart(summary)}
        </section>

        <section>
            <h2 class="section-title">Original Text Analyzed</h2>
            <div class="original-text-block">${originalText}</div>
        </section>

        <section>
            <h2 class="section-title">Detailed Claim Verification</h2>
            ${claimCardsHtml}
        </section>

        <section>
            <h2 class="section-title">Consolidated Sources</h2>
            <div class="claim-card"><div class="claim-body">
                <ul class="source-list">${allSourcesHtml}</ul>
            </div></div>
        </section>

        <button class="print-button" onclick="window.print()">Print or Save as PDF</button>
      </div>
    </body>
    </html>
  `;
};
