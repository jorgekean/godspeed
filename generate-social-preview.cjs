const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Create a 1200x630px canvas (standard social media size)
const canvas = createCanvas(1200, 630);
const ctx = canvas.getContext('2d');

// Background gradient (dark slate to violet)
const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
gradient.addColorStop(0, '#0f172a');
gradient.addColorStop(0.5, '#1a1f35');
gradient.addColorStop(1, '#2d1b69');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1200, 630);

// Add a subtle grid pattern
ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
ctx.lineWidth = 1;
for (let i = 0; i < 1200; i += 100) {
  ctx.beginPath();
  ctx.moveTo(i, 0);
  ctx.lineTo(i, 630);
  ctx.stroke();
}
for (let i = 0; i < 630; i += 100) {
  ctx.beginPath();
  ctx.moveTo(0, i);
  ctx.lineTo(1200, i);
  ctx.stroke();
}

// Add accent circle on top right
ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
ctx.beginPath();
ctx.arc(1100, 100, 150, 0, Math.PI * 2);
ctx.fill();

// Add accent circle on bottom left
ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
ctx.beginPath();
ctx.arc(100, 550, 120, 0, Math.PI * 2);
ctx.fill();

// Main title
ctx.font = 'bold 96px Arial, sans-serif';
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'left';
ctx.textBaseline = 'top';
ctx.fillText('GodSpeed', 60, 80);

// Subtitle
ctx.font = 'bold 96px Arial, sans-serif';
ctx.fillStyle = '#8b5cf6';
ctx.fillText('Grader', 60, 200);

// Tagline
ctx.font = '36px Arial, sans-serif';
ctx.fillStyle = '#cbd5e1';
ctx.textAlign = 'left';
ctx.fillText('Grade bubble sheet exams in seconds', 60, 350);

// Feature bullets
ctx.font = '28px Arial, sans-serif';
ctx.fillStyle = '#94a3b8';
const features = [
  '⚡ Instant scanning',
  '🔒 Privacy-first processing',
  '📱 Works offline'
];
let yPos = 420;
features.forEach(feature => {
  ctx.fillText(feature, 60, yPos);
  yPos += 65;
});

// Bottom accent line
ctx.strokeStyle = '#8b5cf6';
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(60, 600);
ctx.lineTo(400, 600);
ctx.stroke();

// Save the image
const outputPath = path.join(__dirname, 'public', 'social-preview.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log(`✅ Social preview generated: ${outputPath}`);
console.log('Dimensions: 1200x630px');
