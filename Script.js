const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const imagePanel = document.getElementById('imagePanel');
const controls = document.getElementById('controls');
const cropBtn = document.getElementById('cropBtn');
const rotateBtn = document.getElementById('rotateBtn');
const sizeRange = document.getElementById('sizeRange');
const brightnessRange = document.getElementById('brightnessRange');
const contrastRange = document.getElementById('contrastRange');
const generatePDF = document.getElementById('generatePDF');
const modeToggle = document.getElementById('modeToggle');

let images = [], currentIdx = null, cropper = null;

function initDarkMode() {
  if (localStorage.getItem('mode') === 'dark') {
    document.body.classList.add('dark');
    modeToggle.textContent = '☀️';
  }
}
modeToggle.onclick = () => {
  document.body.classList.toggle('dark');
  modeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  localStorage.setItem('mode', document.body.classList.contains('dark') ? 'dark' : 'light');
};
initDarkMode();

dropZone.onclick = () => fileInput.click();
dropZone.ondrop = e => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); };
dropZone.ondragover = e => { e.preventDefault(); e.stopPropagation(); };

fileInput.onchange = e => handleFiles(e.target.files);
function handleFiles(files) {
  for (let file of files) {
    const url = URL.createObjectURL(file);
    images.push({ file, url, filters: { brightness: 100, contrast: 100 }, rotation: 0, cropped: false });
    renderImages();
  }
}

function renderImages() {
  imagePanel.innerHTML = '';
  images.forEach((img, idx) => {
    const el = document.createElement('img');
    el.src = img.url;
    if (idx === currentIdx) el.classList.add('selected');
    el.onclick = () => selectImage(idx);
    imagePanel.appendChild(el);
  });
}

function selectImage(idx) {
  currentIdx = idx;
  renderImages();
  controls.style.display = 'block';
  const img = images[idx];
  if (cropper) { cropper.destroy(); cropper = null; }
  const el = imagePanel.children[idx];
  el.classList.add('selected');
  cropper = new Cropper(el, { autoCropArea: 1, viewMode: 1 });
  sizeRange.value = el.width;
  brightnessRange.value = img.filters.brightness;
  contrastRange.value = img.filters.contrast;
}

cropBtn.onclick = () => {
  if (!cropper) return;
  const canvas = cropper.getCroppedCanvas();
  const url = canvas.toDataURL();
  const el = imagePanel.children[currentIdx];
  el.src = url;
  images[currentIdx].url = url;
  cropper.destroy();
  cropper = null;
};

rotateBtn.onclick = () => {
  const img = images[currentIdx];
  img.rotation = (img.rotation + 90) % 360;
  const el = imagePanel.children[currentIdx];
  el.style.transform = `rotate(${img.rotation}deg)`;
};

[sizeRange, brightnessRange, contrastRange].forEach(el => {
  el.oninput = () => {
    if (currentIdx === null) return;
    const img = images[currentIdx];
    img.filters[el.id.replace('Range','')] = el.value;
    const css = `brightness(${brightnessRange.value}%) contrast(${contrastRange.value}%)`;
    imagePanel.children[currentIdx].style.filter = css;
    imagePanel.children[currentIdx].style.width = sizeRange.value + 'px';
  };
});

generatePDF.onclick = async () => {
  const pdfDoc = await PDFLib.PDFDocument.create();
  for (let img of images) {
    const imgBytes = await fetch(img.url).then(r => r.arrayBuffer());
    const embedded = img.url.startsWith('data') ?
      await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
    const page = pdfDoc.addPage();
    let { width, height } = page.getSize();
    page.drawImage(embedded, {
      x: 0, y: 0, width, height, rotate: PDFLib.degrees(img.rotation)
    });
  }
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'easy-pdf-tools.pdf';
  a.click();
};
