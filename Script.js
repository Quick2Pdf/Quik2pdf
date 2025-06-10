const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const dropArea = document.getElementById('dropArea');
const toggleTheme = document.getElementById('toggleTheme');
let images = [];

toggleTheme.onclick = () => {
  document.body.classList.toggle('dark');
};

dropArea.addEventListener('click', () => imageInput.click());

dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropArea.style.background = '#e0e0e0';
});

dropArea.addEventListener('dragleave', () => {
  dropArea.style.background = '#fafafa';
});

dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dropArea.style.background = '#fafafa';
  handleFiles(e.dataTransfer.files);
});

imageInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  imagePreview.innerHTML = '';
  images = Array.from(files);

  images.forEach((imageFile, index) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 300;
        canvas.height = 300;
        ctx.drawImage(img, 0, 0, 300, 300);

        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'preview-img';

        const brightness = document.createElement('input');
        brightness.type = 'range';
        brightness.min = 0;
        brightness.max = 2;
        brightness.step = 0.1;
        brightness.value = 1;

        brightness.oninput = () => {
          ctx.filter = `brightness(${brightness.value})`;
          ctx.drawImage(img, 0, 0, 300, 300);
        };

        imgWrapper.appendChild(canvas);
        imgWrapper.appendChild(brightness);
        imagePreview.appendChild(imgWrapper);
      };
    };
    reader.readAsDataURL(imageFile);
  });
}

async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const canvases = document.querySelectorAll('canvas');

  canvases.forEach((canvas, i) => {
    const imgData = canvas.toDataURL('image/jpeg');

    if (i !== 0) pdf.addPage();

    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  });

  pdf.save('converted.pdf');
        }
