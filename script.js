let values = [];
let comparisons = 0;
let swaps = 0;
let isPaused = false;
let isStopped = false;
let currentStep = [];
let stepResolve;
let sortSpeed = 50;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateSizeLabel() {
  const size = document.getElementById('sizeSlider').value;
  document.getElementById('sizeLabel').textContent = `數量：${size}`;
  shuffleBars();
}

function updateSpeedLabel() {
  sortSpeed = parseInt(document.getElementById('speedSlider').value);
  document.getElementById('speedLabel').textContent = `速度：${sortSpeed}ms`;
}

function shuffleBars() {
  const size = parseInt(document.getElementById('sizeSlider').value);
  values = Array.from({ length: size }, () => Math.floor(Math.random() * 300) + 20);
  comparisons = 0;
  swaps = 0;
  renderBars();
}

function renderBars(highlightIndices = []) {
  const container = document.getElementById('bar-container');
  container.innerHTML = '';
  values.forEach((val, i) => {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    bar.style.height = `${val}px`;
    if (highlightIndices.includes(i)) {
      bar.style.backgroundColor = 'orange';
    }
    container.appendChild(bar);
  });
}

async function waitOrPause() {
  while (isPaused) {
    await sleep(50);
  }
  if (isStopped) throw new Error("Sort Stopped");
  await sleep(sortSpeed);
}

function disableControls() {
  document.getElementById('algorithmSelect').disabled = true;
  document.getElementById('sizeSlider').disabled = true;
  document.getElementById('shuffleButton').disabled = true;
  document.getElementById('startButton').disabled = true;
}

function enableControls() {
  document.getElementById('algorithmSelect').disabled = false;
  document.getElementById('sizeSlider').disabled = false;
  document.getElementById('shuffleButton').disabled = false;
  document.getElementById('startButton').disabled = false;
}


async function startSort() {
  isPaused = false;
  isStopped = false;
  comparisons = 0;
  swaps = 0;

  disableControls();

  const algorithm = document.getElementById('algorithmSelect').value;
  try {
    if (algorithm === 'bubble') {
      await bubbleSort();
    } else if (algorithm === 'insertion') {
      await insertionSort();
    } else if (algorithm === 'selection') {
      await selectionSort();
    } else if (algorithm === 'merge') {
      await mergeSortWrapper();
    } else if (algorithm === 'quick') {
      await quickSortWrapper();
    }
    showSummary();
  } catch (e) {
    renderBars();
    if (e.message !== "Sort Stopped") throw e;
  }

  enableControls();
}


function pauseSort() {
  isPaused = true;
}

function resumeSort() {
  isPaused = false;
}

function stopSort() {
  isStopped = true;
  isPaused = false;
}


function showSummary() {
  const content = document.getElementById('explanationContent');
  content.innerHTML = `
    <strong>排序完成！</strong><br>
    比較次數：${comparisons} 次<br>
    資料交換次數：${swaps} 次
  `;
  const modal = new bootstrap.Modal(document.getElementById('explanationModal'));
  modal.show();
}

function renderBars({ comparing = [], special = [] } = {}) {
  const container = document.getElementById('bar-container');
  container.innerHTML = '';

  const count = values.length;
  let gap = 100 / count;

  if (count <= 100) {
    container.style.justifyContent = 'center';
    container.style.gap = `${gap}px`;
  } else {
    container.style.justifyContent = 'flex-start';
    container.style.gap = '0';
  }

  values.forEach((val, i) => {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    bar.style.height = `${val}px`;

    if (count <= 100) {
      bar.style.width = '20px';
    } else {
      bar.style.width = `${100 / count}%`;
    }

    if (special.includes(i)) {
      bar.style.backgroundColor = 'red';    // special 用紅色
    } else if (comparing.includes(i)) {
      bar.style.backgroundColor = 'orange'; // comparing 用橘色
    } else {
      bar.style.backgroundColor = '#0d6efd'; // 預設藍色
    }

    container.appendChild(bar);
  });
}



async function bubbleSort() {
  for (let i = 0; i < values.length - 1; i++) {
    for (let j = 0; j < values.length - i - 1; j++) {
      comparisons++;

      renderBars({ comparing: [j, j + 1] }); // 比較的兩個元素標示為 orange
      await waitOrPause();

      if (values[j] > values[j + 1]) {
        [values[j], values[j + 1]] = [values[j + 1], values[j]];
        swaps++;
      }
    }
  }
  renderBars(); // 結束時清空比較標示
}

async function insertionSort() {
  for (let i = 1; i < values.length; i++) {
    let key = values[i];
    let j = i - 1;

    while (j >= 0 && values[j] > key) {
      comparisons++;
      values[j + 1] = values[j];
      swaps++;

      renderBars({
        comparing: [j, j + 1],  // 只顯示正在比較的兩個 index
      });
      await waitOrPause();

      j--;
    }

    values[j + 1] = key;
    renderBars({
      comparing: [j + 1],       // 插入位置高亮
    });
    await waitOrPause();
  }

  renderBars(); // 清除所有高亮
}



async function selectionSort() {
  for (let i = 0; i < values.length; i++) {
    let minIdx = i;
    for (let j = i + 1; j < values.length; j++) {
      comparisons++;

      renderBars({
        comparing: [j, minIdx],      // 當前比較的元素（橘色）
      });

      await waitOrPause();

      if (values[j] < values[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      [values[i], values[minIdx]] = [values[minIdx], values[i]];
      swaps++;
    }
  }

  renderBars(); // 清除高亮
}


async function mergeSortWrapper() {
  await mergeSort(0, values.length - 1);
  renderBars();
}

async function mergeSort(start, end) {
  if (isStopped) throw new Error("Sort Stopped");
  if (start >= end) return;

  const mid = Math.floor((start + end) / 2);
  await mergeSort(start, mid);
  await mergeSort(mid + 1, end);
  await merge(start, mid, end);
}

async function merge(start, mid, end) {
  let left = values.slice(start, mid + 1);
  let right = values.slice(mid + 1, end + 1);

  let i = 0, j = 0, k = start;

  while (i < left.length && j < right.length) {
    comparisons++;
    renderBars({
      comparing: [k], 
    });
    await waitOrPause();

    if (left[i] <= right[j]) {
      values[k++] = left[i++];
    } else {
      values[k++] = right[j++];
      swaps++;
    }
  }

  while (i < left.length) {
    values[k++] = left[i++];
    renderBars({
      comparing: [k - 1], 
    });
    await waitOrPause();
  }
  while (j < right.length) {
    values[k++] = right[j++];
    renderBars({
      comparing: [k - 1], 
    });
    await waitOrPause();
  }
}


async function quickSortWrapper() {
  await quickSort(0, values.length - 1);
  renderBars();
}

async function quickSort(low, high) {
  if (isStopped) throw new Error("Sort Stopped");
  if (low < high) {
    const pi = await partition(low, high);
    await quickSort(low, pi - 1);
    await quickSort(pi + 1, high);
  }
}

async function partition(low, high) {
  let pivot = values[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    comparisons++;
    renderBars({
      comparing: [j, high], 
    });
    await waitOrPause();
    if (values[j] < pivot) {
      i++;
      [values[i], values[j]] = [values[j], values[i]];
      swaps++;
    }
  }
  [values[i + 1], values[high]] = [values[high], values[i + 1]];
  swaps++;
  return i + 1;
}



function showExplanation() {
  const algorithm = document.getElementById('algorithmSelect').value;
  const content = document.getElementById('explanationContent');

  if (algorithm === 'bubble') {
    content.innerHTML = `
      <strong>Bubble Sort（泡沫排序）</strong><br>
      每次比較相鄰兩數，若順序錯誤則交換，像氣泡一樣將最大值逐步移到末端。<br>
      <strong>時間複雜度：</strong> O(n²)
    `;
  } else if (algorithm === 'insertion') {
    content.innerHTML = `
      <strong>Insertion Sort（插入排序）</strong><br>
      將每個元素插入已排序的部分，從左到右逐步構建排序結果。<br>
      <strong>時間複雜度：</strong> O(n²)
    `;
  } else if (algorithm === 'selection') {
    content.innerHTML = `
      <strong>Selection Sort（選擇排序）</strong><br>
      每次從未排序區中找出最小元素，放到前面。<br>
      <strong>時間複雜度：</strong> O(n²)
    `;
  } else if (algorithm === 'merge') {
    content.innerHTML = `
      <strong>Merge Sort（合併排序）</strong><br>
      使用分治法將陣列分為兩半遞迴排序，再合併排序結果。<br>
      <strong>時間複雜度：</strong> O(n log n)
    `;
  } else if (algorithm === 'quick') {
    content.innerHTML = `
      <strong>Quick Sort（快速排序）</strong><br>
      選取基準值，將小於基準值的放左邊，大於的放右邊，遞迴進行排序。<br>
      <strong>時間複雜度：</strong> 平均 O(n log n)，最差 O(n²)
    `;
  }

  const modal = new bootstrap.Modal(document.getElementById('explanationModal'));
  modal.show();
}


// 初始化
window.onload = () => {
  updateSizeLabel();
  updateSpeedLabel();
  shuffleBars();
};
